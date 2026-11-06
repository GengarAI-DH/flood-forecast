// Calculations: every number the page derives from the datasets.
dash.calc('kpsignals', {
  inputs: ['radar'],
  title: 'Key people signals',
  description: 'Every signal of type Key people, newest first.',
  fn: (radar) => radar.filter((r) => r.category === 'Key people').sort((a, b) => (a.date < b.date ? 1 : -1)),
});

dash.calc('consensus', {
  inputs: ['odds'],
  title: 'Triangulated consensus',
  description: 'For each outcome with two or more published estimates: the geometric mean of their odds (the standard way forecasters pool independent estimates), then the same chance spread evenly over the 75 years from 2025 to 2100 as a per-year figure.',
  fn: (odds) => {
    const groups = {};
    odds.filter((r) => r.outcome).forEach((r) => { (groups[r.outcome] = groups[r.outcome] || []).push(r); });
    return Object.entries(groups).filter(([, v]) => v.length >= 2).map(([outcome, v]) => {
      const logOdds = v.map((r) => Math.log((r.value / 100) / (1 - r.value / 100)));
      const mean = logOdds.reduce((a, b) => a + b, 0) / logOdds.length;
      const p = 1 / (1 + Math.exp(-mean));
      const perYear = 1 - Math.pow(1 - p, 1 / 75);
      return {
        outcome,
        estimates: v.length,
        lowest: Math.min(...v.map((r) => r.value)),
        highest: Math.max(...v.map((r) => r.value)),
        consensus: Math.round(p * 1000) / 10,
        per_year: Math.round(perYear * 100000) / 1000,
      };
    });
  },
});

dash.calc('projection', {
  inputs: ['radar', 'accuracy'],
  title: 'Heat forecast',
  description: 'Weekly heat per trend projected forward: today\'s signals fading by half every 90 days, plus new signals arriving at the trend\'s average weekly pace over the last 26 weeks, with an 80% range from how uneven that pace has been. How far ahead it reaches grows with the weeks of history collected and with the latest hit rate, up to five years.',
  fn: (radar, accuracy) => {
    const score = (p) => Math.round(p >= 0 ? 100 * (1 - Math.exp(-p / 8)) : -100 * (1 - Math.exp(p / 8))); // fixed heat scale: 0 to 100, never above 100
    const weight = { 3: 1, 2: 0.5, 1: -0.5 };
    const day = (s) => Date.parse(s) / 864e5;
    const ref = Math.max(...radar.map((r) => day(r.date)));
    const first = Math.min(...radar.map((r) => day(r.date)));
    const spanWeeks = Math.min(260, Math.max(1, Math.round((ref - first) / 7)));
    const hits = accuracy.map((a) => a.hit_rate).filter((v) => v != null);
    const rate = hits.length ? hits[hits.length - 1] : 0.5;
    const horizon = Math.max(4, Math.min(260, Math.round(spanWeeks * 0.5 * Math.min(1.5, Math.max(0.5, rate / 0.67)))));
    const iso = (t) => new Date(t * 864e5).toISOString().slice(0, 10);
    const out = [];
    [...new Set(radar.map((r) => r.field))].forEach((field) => {
      const sig = radar.filter((r) => r.field === field);
      const hist = [];
      for (let w = spanWeeks; w >= 0; w--) {
        const t = ref - w * 7;
        hist.push(sig.filter((r) => day(r.date) <= t).reduce((s, r) => s + (weight[r.heat] ?? 0) * Math.pow(0.5, (t - day(r.date)) / 90), 0));
      }
      // Forecast = what today's signals fade to (they lose half their heat every 90 days, so this
      // part is certain) + new signals arriving at this trend's usual weekly pace over the last
      // 26 weeks. Using the long-run pace keeps a short burst of fresh signals from being
      // stretched into a runaway line. The band is the 80% range from how uneven that pace has been.
      const decay = Math.pow(0.5, 7 / 90);
      const weeksBack = Math.min(26, spanWeeks);
      const inflow = [];
      for (let w = weeksBack - 1; w >= 0; w--) {
        const t1 = ref - w * 7, t0 = t1 - 7;
        inflow.push(sig.filter((r) => day(r.date) > t0 && day(r.date) <= t1).reduce((s, r) => s + (weight[r.heat] ?? 0), 0));
      }
      const pace = inflow.reduce((a, b) => a + b, 0) / Math.max(1, inflow.length);
      const sd = Math.sqrt(inflow.reduce((s, v) => s + (v - pace) ** 2, 0) / Math.max(1, inflow.length - 1)) || 0;
      const r2 = (v) => score(v);
      hist.forEach((h, i) => out.push({ field, week: iso(ref - (hist.length - 1 - i) * 7), heat: r2(h), kind: 'actual', lo: null, hi: null, fade: null, horizon_weeks: horizon, history_weeks: spanWeeks, pace_per_week: r2(pace) }));
      const level = hist[hist.length - 1];
      let added = 0, varSum = 0;
      for (let j = 1; j <= horizon; j++) {
        added = added * decay + pace;
        varSum = varSum * decay * decay + sd * sd;
        const fade = level * Math.pow(decay, j), f = fade + added, band = 1.28 * Math.sqrt(varSum);
        out.push({ field, week: iso(ref + j * 7), heat: r2(f), kind: 'forecast', lo: r2(f - band), hi: r2(f + band), fade: r2(fade), horizon_weeks: horizon, history_weeks: spanWeeks, pace_per_week: r2(pace) });
      }
    });
    return out;
  },
});

dash.calc('map', {
  inputs: ['radar'],
  title: 'Trend map',
  description: 'For each trend: how far along its lifecycle it is, its heat now on the fixed 0 to 100 scale, its change over 4 weeks, how its last 4 weeks compare with its own usual pace (vs normal), and how much of its heat is real-world action rather than talk (impact).',
  fn: (radar) => {
    const score = (p) => Math.round(p >= 0 ? 100 * (1 - Math.exp(-p / 8)) : -100 * (1 - Math.exp(p / 8))); // fixed heat scale: 0 to 100, never above 100
    const weight = { 3: 1, 2: 0.5, 1: -0.5 };
    const order = ['Tech emerges', 'Funding boom', 'Job spike', 'Courses boom', 'Content flood', 'Flooded'];
    const day = (s) => Date.parse(s) / 864e5;
    const ref = Math.max(...radar.map((r) => day(r.date)));
    return [...new Set(radar.map((r) => r.field))].map((field) => {
      const sig = radar.filter((r) => r.field === field);
      const recent = sig.filter((r) => ref - day(r.date) <= 365);
      const stage = Math.max(1, ...recent.map((r) => order.indexOf(r.stage) + 1));
      const pts = sig.reduce((s, r) => s + (weight[r.heat] ?? 0) * Math.pow(0.5, (ref - day(r.date)) / 90), 0);
      const zone = pts <= 0 ? 'Fading' : stage <= 2 ? 'Get in early' : stage <= 4 ? 'Hot now' : 'Crowded';
      // Change over the last 4 weeks on the same scale.
      const ptsAt = (t) => sig.filter((r) => day(r.date) <= t).reduce((s, r) => s + (weight[r.heat] ?? 0) * Math.pow(0.5, (t - day(r.date)) / 90), 0);
      const change_4w = score(pts) - score(ptsAt(ref - 28));
      // Vs its normal: signal pace over the last 4 weeks compared with its own usual 4-week pace
      // over the 26 weeks before that. Loud, always-on topics read "Normal" at their usual level.
      const inWin = (a, b) => sig.filter((r) => ref - day(r.date) >= a && ref - day(r.date) < b).reduce((s, r) => s + Math.max(0, weight[r.heat] ?? 0), 0);
      const recentPace = inWin(0, 28), usual = inWin(28, 210) / 6.5;
      const vs_normal = usual < 0.5 ? null : Math.round((recentPace / usual) * 10) / 10;
      const normal_word = vs_normal == null ? 'New, no normal yet' : vs_normal >= 2 ? 'Way above normal' : vs_normal >= 1.25 ? 'Above normal' : vs_normal > 0.8 ? 'Normal' : 'Below normal';
      // Real-world impact: share of its heat from action (money moved, hiring, laws, contracts, launches)
      // rather than talk (statements, coverage, buzz). Uses the collector's tag, or the signal type for older signals.
      const ACTION = ['Funding', 'Stocks', 'Jobs', 'World events', 'Politics'];
      const isAction = (r) => (r.kind ? r.kind === 'action' : ACTION.includes(r.category));
      let act = 0, all = 0;
      sig.forEach((r) => { const w = Math.max(0, weight[r.heat] ?? 0) * Math.pow(0.5, (ref - day(r.date)) / 90); all += w; if (isAction(r)) act += w; });
      const impact = all > 0 ? Math.round((act / all) * 100) : 0;
      const impact_word = impact >= 60 ? 'Mostly real action' : impact >= 35 ? 'Mix of action and talk' : 'Mostly talk';
      return { field, stage, heat: score(pts), heat_pts: Math.round(pts * 100) / 100, signals: sig.length, zone, change_4w, vs_normal, normal_word, impact, impact_word, impact_score: Math.round(score(pts) * impact / 100) };
    });
  },
});

window.FF_CATS = ['Key people', 'World events', 'Politics', 'Stocks', 'News', 'Social', 'Funding', 'Jobs', 'Courses'];
dash.calc('grid', {
  inputs: ['radar'],
  title: 'Heat by field and type',
  description: 'Heat now for every field and signal type, on the same fixed 0 to 100 heat scale as the trends.',
  fn: (radar) => {
    const score = (p) => Math.round(p >= 0 ? 100 * (1 - Math.exp(-p / 8)) : -100 * (1 - Math.exp(p / 8))); // fixed heat scale: 0 to 100, never above 100
    const weight = { 3: 1, 2: 0.5, 1: -0.5 };
    const day = (s) => Date.parse(s) / 864e5;
    const ref = Math.max(...radar.map((r) => day(r.date)));
    const out = [];
    [...new Set(radar.map((r) => r.field))].forEach((field) => {
      ['Key people', 'World events', 'Politics', 'Stocks', 'News', 'Social', 'Funding', 'Jobs', 'Courses'].forEach((category) => {
        const h = radar.filter((r) => r.field === field && r.category === category)
          .reduce((s, r) => s + (weight[r.heat] ?? 0) * Math.pow(0.5, (ref - day(r.date)) / 90), 0);
        out.push({ field, category, heat: score(h), heat_pts: Math.round(h * 100) / 100 });
      });
    });
    return out;
  },
});
dash.calc('cats', {
  inputs: ['radar'],
  title: 'Heat by signal type',
  description: 'Total heat per signal type across all fields, same scoring and 90-day fade, shown as each type\'s share of all heat (the shares add up to 100%).',
  fn: (radar) => {
    const weight = { 3: 1, 2: 0.5, 1: -0.5 };
    const day = (s) => Date.parse(s) / 864e5;
    const ref = Math.max(...radar.map((r) => day(r.date)));
    const rows = ['Key people', 'World events', 'Politics', 'Stocks', 'News', 'Social', 'Funding', 'Jobs', 'Courses'].map((category) => ({
      category,
      pts: radar.filter((r) => r.category === category)
        .reduce((s, r) => s + (weight[r.heat] ?? 0) * Math.pow(0.5, (ref - day(r.date)) / 90), 0),
      signals: radar.filter((r) => r.category === category).length,
    }));
    // Share of all heat: what slice of the total each signal type is contributing (adds up to 100%).
    const total = Math.max(0.01, rows.reduce((t, r) => t + Math.max(0, r.pts), 0));
    return rows.map((r) => ({ category: r.category, heat: Math.round((Math.max(0, r.pts) / total) * 100), heat_pts: Math.round(r.pts * 100) / 100, signals: r.signals }));
  },
});
dash.calc('trend', {
  inputs: ['radar'],
  title: 'Heat over the last year',
  description: 'Heat per field at the end of each of the last 52 weeks, counting only signals dated by then.',
  fn: (radar) => {
    const score = (p) => Math.round(p >= 0 ? 100 * (1 - Math.exp(-p / 8)) : -100 * (1 - Math.exp(p / 8))); // fixed heat scale: 0 to 100, never above 100
    const weight = { 3: 1, 2: 0.5, 1: -0.5 };
    const day = (s) => Date.parse(s) / 864e5;
    const ref = Math.max(...radar.map((r) => day(r.date)));
    const out = [];
    [...new Set(radar.map((r) => r.field))].forEach((field) => {
      for (let w = 51; w >= 0; w--) {
        const t = ref - w * 7;
        const h = radar.filter((r) => r.field === field && day(r.date) <= t)
          .reduce((s, r) => s + (weight[r.heat] ?? 0) * Math.pow(0.5, (t - day(r.date)) / 90), 0);
        out.push({ field, week: new Date(t * 864e5).toISOString().slice(0, 10), heat: score(h) });
      }
    });
    return out;
  },
});

dash.calc('watched', {
  inputs: ['watchlist', 'map', 'trend', 'radar'],
  title: 'Watched trends, then vs now',
  description: 'For each watched trend: its heat, stage and zone when you started watching, 30 days ago (from the weekly heat series) and now, the change, new signals since you started watching, and a status: trending harder (heat score up 5+ or moving toward hot), cooling off (heat score down 5+), becoming a problem (newly crowded or fading), else steady.',
  fn: (watchlist, map, trend, radar) => watchlist.map((w) => {
    const score = (p) => Math.round(p >= 0 ? 100 * (1 - Math.exp(-p / 8)) : -100 * (1 - Math.exp(p / 8))); // fixed heat scale: 0 to 100, never above 100
    const now = map.find((r) => r.field === w.field);
    const series = trend.filter((r) => r.field === w.field);
    const ago = series.length > 4 ? series[series.length - 5].heat : null;
    const r2 = (v) => (v == null ? null : Math.round(v));
    const base = score(w.base_heat || 0);
    const nh = now ? now.heat : null;
    const dh = nh == null ? 0 : nh - base;
    let status = 'Steady';
    if (!now) status = 'No new data';
    else if ((now.zone === 'Crowded' || now.zone === 'Fading') && now.zone !== w.base_zone) status = 'Becoming a problem';
    else if (dh >= 5 || (now.stage > w.base_stage && now.zone !== 'Crowded')) status = 'Trending harder';
    else if (dh <= -5) status = 'Cooling off';
    const fresh = radar.filter((s) => s.field === w.field && s.date >= w.since).sort((a, b) => (a.date < b.date ? 1 : -1));
    return {
      field: w.field, since: w.since,
      base_heat: base, base_stage: w.base_stage, base_zone: w.base_zone,
      heat_30d_ago: r2(ago), now_heat: r2(nh), now_stage: now ? now.stage : null, now_zone: now ? now.zone : null,
      change_since: r2(dh), change_30d: ago == null || nh == null ? null : r2(nh - ago),
      new_signals: fresh.length, latest: fresh.length ? fresh[0].signal : '', status,
    };
  }),
});

dash.calc('digest', {
  inputs: ['trend', 'map', 'radar'],
  title: "Today's digest",
  description: 'Heating up: the three trends with the biggest heat gain over the last 4 weeks (not fading). Cooling: the biggest heat drop. Whisper: the newest "Early whisper" signal, or else the newest trend first seen in the last 14 days. Each with its newest signal as the reason.',
  fn: (trend, map, radar) => {
    const byF = {};
    trend.forEach((r) => { (byF[r.field] = byF[r.field] || []).push(r); });
    const latest = (f) => radar.filter((s) => s.field === f).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const rows = Object.entries(byF).map(([field, s]) => {
      const now = s[s.length - 1].heat, then = s.length > 4 ? s[s.length - 5].heat : s[0].heat;
      const m = map.find((x) => x.field === field) || {};
      return { field, delta: Math.round(now - then), zone: m.zone };
    });
    const out = [];
    rows.filter((r) => r.delta > 0 && r.zone !== 'Fading').sort((a, b) => b.delta - a.delta).slice(0, 3)
      .forEach((r) => out.push({ kind: 'Heating up', field: r.field, delta: r.delta, reason: (latest(r.field) || {}).signal || '' }));
    const cool = rows.filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta)[0];
    if (cool) out.push({ kind: 'Cooling', field: cool.field, delta: cool.delta, reason: (latest(cool.field) || {}).signal || '' });
    const day = (s) => Date.parse(s) / 864e5;
    const ref = Math.max(...radar.map((s) => day(s.date)));
    const wh = radar.filter((s) => /^Early whisper/i.test(s.signal)).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (wh) out.push({ kind: 'Whisper', field: wh.field, delta: null, reason: wh.signal.replace(/^Early whisper:\s*/i, '') });
    else {
      const first = {};
      radar.forEach((s) => { if (!first[s.field] || s.date < first[s.field]) first[s.field] = s.date; });
      const used = out.map((o) => o.field);
      const fresh = Object.entries(first).filter(([f, d]) => ref - day(d) <= 14 && !used.includes(f)).sort((a, b) => (a[1] < b[1] ? 1 : -1))[0];
      if (fresh) out.push({ kind: 'New on the radar', field: fresh[0], delta: null, reason: (latest(fresh[0]) || {}).signal || '' });
    }
    return out;
  },
});

dash.calc('heat', {
  inputs: ['radar', 'edges'],
  title: 'Heat by field',
  description: 'Each signal adds heat that fades by half every 90 days, then heat flows along the influence edges (one and two steps) into jobs and courses.',
  fn: (radar, edges) => {
    const score = (p) => Math.round(p >= 0 ? 100 * (1 - Math.exp(-p / 8)) : -100 * (1 - Math.exp(p / 8))); // fixed heat scale: 0 to 100, never above 100
    const weight = { 3: 1, 2: 0.5, 1: -0.5 };
    const day = (s) => Date.parse(s) / 864e5;
    const ref = Math.max(...radar.map((r) => day(r.date)));
    const fields = [...new Set(radar.map((r) => r.field))];
    const into = (to) => edges.filter((e) => e.to === to);
    return fields.map((field) => {
      const node = {};
      radar.filter((r) => r.field === field).forEach((r) => {
        node[r.category] = (node[r.category] || 0) + (weight[r.heat] ?? 0) * Math.pow(0.5, (ref - day(r.date)) / 90);
      });
      const flow = (to) => into(to).reduce((s, e) => s + e.strength * (node[e.from] || 0)
        + 0.5 * into(e.from).reduce((s2, e2) => s2 + e2.strength * e.strength * (node[e2.from] || 0), 0), 0);
      const now = Object.values(node).reduce((a, b) => a + b, 0);
      const jobs = flow('Jobs'), courses = flow('Courses');
      const outlook = jobs > courses + 0.2 ? 'Opportunity building' : courses > jobs + 0.2 ? 'Crowding coming' : now < 0 ? 'Cooling' : 'Balanced';
      const r2 = (v) => score(v);
      return { field, heat_now: r2(now), jobs_incoming: r2(jobs), courses_incoming: r2(courses), outlook };
    });
  },
});
