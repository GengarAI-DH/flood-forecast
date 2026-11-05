// Drawings: every chart, table and panel the data fills.
(() => {
  const NOW = 2026.84;
  const fmtY = d3.format('.1f');
  const ok = (id) => dash.data(id).status === 'ok';
  const rows = (id) => (ok(id) ? dash.data(id).data : []);
  const setText = (el, v) => { el.textContent = v; };

  document.querySelectorAll('.sw.st').forEach((s) => { s.style.background = dash.colors[+s.dataset.i % dash.colors.length]; });

  const one = (id) => rows(id)[0];
  dash.draw('barrier', (el) => { const m = one('model'); setText(el, m ? fmtY(m.per_barrier_point) : '—'); });
  dash.draw('speed', (el) => { const m = one('model'); setText(el, m ? d3.format('.2f')(m.per_year_later) : '—'); });
  dash.draw('t_mae', (el) => { const m = one('model'); setText(el, m ? '±' + fmtY(m.mae_years) : '—'); });
  dash.draw('t_cases', (el) => { const m = one('model'); setText(el, m ? String(m.past_cases) : '—'); });
  const byField = (f) => rows('forecasts').find((r) => r.field === f);
  dash.draw('t_robot', (el) => { const r = byField('Robotics technician'); setText(el, r ? fmtY(r.flood_year) : '—'); });
  dash.draw('t_agent', (el) => { const r = byField('Agentic AI engineer'); setText(el, r ? fmtY(r.flood_year) : '—'); });

  dash.draw('ftable', (tb) => {
    const data = rows('forecasts').slice().sort((a, b) => b.flood_year - a.flood_year);
    tb.replaceChildren();
    data.forEach((r) => {
      const tr = document.createElement('tr');
      tr.dataset.key = r.field;
      [[r.field, ''], [String(r.barrier), 'r'], [fmtY(r.flood_year), 'r'], [fmtY(r.low), 'r'], [fmtY(r.high), 'r'], [fmtY(r.years_left), 'r']].forEach(([v, c], i) => {
        const td = document.createElement('td'); td.textContent = v; if (c) td.className = c;
        if (i === 5) td.classList.add(r.years_left >= 4 ? 'hot' : r.years_left >= 1 ? 'warm' : 'cold');
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
  });

  dash.draw('kpempty', (el) => {
    const s = dash.data('kpsignals').status;
    if (s !== 'ok') { setText(el, '—'); return; }
    setText(el, rows('kpsignals').length ? '' : 'No key people logged yet. They arrive with the collector\'s next runs.');
  });
  dash.draw('kptable', (tb) => {
    tb.replaceChildren();
    rows('kpsignals').forEach((r) => {
      const tr = document.createElement('tr'); tr.dataset.key = r.signal;
      const who = personFor(r);
      const tw = document.createElement('td');
      if (who) { tw.textContent = who.name; tw.dataset.person = who.name; tw.className = 'tlink'; } else tw.textContent = '—';
      tr.appendChild(tw);
      [r.date, r.field, r.signal].forEach((v, i) => { const td = document.createElement('td'); td.textContent = v; if (i === 1) { td.dataset.trend = r.field; td.className = 'tlink'; } tr.appendChild(td); });
      const td = document.createElement('td');
      if (r.url) { const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.source; td.appendChild(a); } else td.textContent = r.source;
      tr.appendChild(td); tb.appendChild(tr);
    });
  });

  dash.draw('rtable', (tb) => {
    const data = rows('radar').slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    tb.replaceChildren();
    data.forEach((r) => {
      const tr = document.createElement('tr');
      tr.dataset.key = r.signal;
      const cells = [r.date, r.field, r.category, r.signal, r.stage];
      cells.forEach((v, i) => {
        const td = document.createElement('td'); td.textContent = v;
        if (i === 1) { td.dataset.trend = r.field; td.className = 'tlink'; }
        if (i === 4) td.className = r.heat >= 3 ? 'hot' : r.heat === 2 ? 'warm' : 'cold';
        tr.appendChild(td);
      });
      const td = document.createElement('td');
      const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.source;
      td.appendChild(a); tr.appendChild(td);
      tb.appendChild(tr);
    });
  });

  const measure = (svg, texts) => {
    const t = svg.append('text').attr('font-size', 12).style('font-family', 'var(--font-anthropic-sans)');
    let w = 0; texts.forEach((s) => { t.text(s); w = Math.max(w, t.node().getComputedTextLength()); });
    t.remove(); return w;
  };

  dash.draw('timeline', (el) => {
    el.replaceChildren();
    const data = rows('stages');
    if (!data.length) return;
    const groupOrder = { 'Forecast': 0, 'Still short': 1, 'Past trend': 2 };
    const fields = Array.from(d3.group(data, (d) => d.field), ([f, v]) => ({ f, g: v[0].group, v }))
      .sort((a, b) => groupOrder[a.g] - groupOrder[b.g] || d3.min(b.v, (d) => d.year) - d3.min(a.v, (d) => d.year));
    const W = Math.max(300, el.clientWidth), rowH = 26;
    const svg = d3.select(el).append('svg').attr('width', '100%');
    const narrow = W < 560;
    const labels = fields.map((d) => d.f);
    const lw = Math.min(narrow ? 120 : 230, measure(svg, labels) + 12);
    const m = { l: lw, r: 16, t: 8, b: 26 };
    const H = m.t + m.b + fields.length * rowH + 12;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const x = d3.scaleLinear([1994, 2040], [m.l, W - m.r]);
    const y = d3.scaleBand(labels, [m.t, H - m.b]).padding(0.3);
    const g = svg.append('g');
    g.append('g').attr('transform', `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).ticks(narrow ? 4 : 9).tickFormat(d3.format('d')).tickSize(-(H - m.b - m.t)))
      .attr('font-size', null).attr('font-family', null)
      .call((a) => a.select('.domain').remove())
      .call((a) => a.selectAll('line').attr('stroke', 'var(--cds-chart-grid)'))
      .call((a) => a.selectAll('text').attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)'));
    const lab = g.append('g').selectAll('text').data(fields).join('text')
      .attr('x', 0).attr('y', (d) => y(d.f) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('fill', (d) => (d.g === 'Forecast' ? 'var(--color-fg)' : 'var(--color-fg-muted)'))
      .style('font-size', 'var(--cds-font-size-caption)').text((d) => d.f);
    lab.each(function () { const s = this; let t = s.textContent; while (s.getComputedTextLength() > lw - 10 && t.length > 4) { t = t.slice(0, -2); s.textContent = t + '…'; } });
    g.append('line').attr('x1', x(NOW)).attr('x2', x(NOW)).attr('y1', m.t).attr('y2', H - m.b)
      .attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 3');
    const rowsG = g.append('g').selectAll('g').data(fields).join('g');
    rowsG.append('line')
      .attr('x1', (d) => x(d3.min(d.v, (p) => p.year))).attr('x2', (d) => x(d3.max(d.v, (p) => p.year)))
      .attr('y1', (d) => y(d.f) + y.bandwidth() / 2).attr('y2', (d) => y(d.f) + y.bandwidth() / 2)
      .attr('stroke', 'var(--cds-chart-axis)').attr('stroke-width', 2).attr('stroke-linecap', 'round');
    const preds = data.filter((d) => d.low != null);
    g.append('g').selectAll('line').data(preds).join('line')
      .attr('x1', (d) => x(d.low)).attr('x2', (d) => x(d.high))
      .attr('y1', (d) => y(d.field) + y.bandwidth() / 2).attr('y2', (d) => y(d.field) + y.bandwidth() / 2)
      .attr('stroke', dash.colors[5 % dash.colors.length]).attr('stroke-opacity', 0.35).attr('stroke-width', 8).attr('stroke-linecap', 'round');
    const tip = d3.select(el).append('div').attr('class', 'tip').style('display', 'none');
    g.append('g').selectAll('circle').data(data).join('circle')
      .attr('cx', (d) => x(d.year)).attr('cy', (d) => y(d.field) + y.bandwidth() / 2).attr('r', 5)
      .attr('fill', (d) => (d.kind === 'predicted' ? 'var(--color-panel)' : dash.colors[(d.stage - 1) % dash.colors.length]))
      .attr('stroke', (d) => dash.colors[(d.stage - 1) % dash.colors.length]).attr('stroke-width', 2)
      .on('pointerenter pointermove', (ev, d) => {
        const [px, py] = d3.pointer(ev, el);
        tip.style('display', null).selectAll('*').remove();
        tip.append('div').attr('class', 't').text(d.field);
        tip.append('div').text(`${d.stage_name}: ${d.kind === 'predicted' ? 'forecast ' : ''}${fmtY(d.year)}`);
        if (d.low != null) tip.append('div').text(`Range ${fmtY(d.low)} to ${fmtY(d.high)}`);
        const tw = tip.node().offsetWidth;
        tip.style('left', Math.min(Math.max(0, px + 12), el.clientWidth - tw) + 'px').style('top', (py + 12) + 'px');
      })
      .on('pointerleave', () => tip.style('display', 'none'));
    el.style.minHeight = H + 'px';
  });

  dash.draw('backtest', (el) => {
    el.replaceChildren();
    const data = rows('backtest');
    if (!data.length) return;
    const W = Math.max(280, el.clientWidth), rowH = 30;
    const svg = d3.select(el).append('svg').attr('width', '100%');
    const lw = Math.min(170, measure(svg, data.map((d) => d.field)) + 12);
    const m = { l: lw, r: 40, t: 8, b: 26 };
    const H = m.t + m.b + data.length * rowH;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const ext = Math.max(8, d3.max(data, (d) => Math.abs(d.error_years)));
    const x = d3.scaleLinear([-ext, ext], [m.l, W - m.r]);
    const y = d3.scaleBand(data.map((d) => d.field), [m.t, H - m.b]).padding(0.35);
    svg.append('g').attr('transform', `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((v) => (v > 0 ? '+' : '') + v).tickSize(-(H - m.b - m.t)))
      .attr('font-size', null).attr('font-family', null)
      .call((a) => a.select('.domain').remove())
      .call((a) => a.selectAll('line').attr('stroke', 'var(--cds-chart-grid)'))
      .call((a) => a.selectAll('text').attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)'));
    svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', m.t).attr('y2', H - m.b).attr('stroke', 'var(--cds-chart-reference)');
    const lab = svg.append('g').selectAll('text').data(data).join('text')
      .attr('x', 0).attr('y', (d) => y(d.field) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text((d) => d.field);
    lab.each(function () { const s = this; let t = s.textContent; while (s.getComputedTextLength() > lw - 10 && t.length > 4) { t = t.slice(0, -2); s.textContent = t + '…'; } });
    svg.append('g').selectAll('rect').data(data).join('rect')
      .attr('x', (d) => x(Math.min(0, d.error_years))).attr('width', (d) => Math.max(2, Math.abs(x(d.error_years) - x(0))))
      .attr('y', (d) => y(d.field)).attr('height', y.bandwidth()).attr('rx', 3)
      .attr('fill', (d) => (Math.abs(d.error_years) <= 3 ? dash.colors[0] : 'var(--cds-chart-status-critical)'));
    svg.append('g').selectAll('text').data(data).join('text')
      .attr('x', (d) => x(d.error_years) + (d.error_years >= 0 ? 4 : -4)).attr('text-anchor', (d) => (d.error_years >= 0 ? 'start' : 'end'))
      .attr('y', (d) => y(d.field) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)')
      .text((d) => (d.error_years > 0 ? '+' : '') + fmtY(d.error_years));
    el.style.minHeight = H + 'px';
  });
  const axisStyle = (a) => a.attr('font-size', null).attr('font-family', null)
    .call((s) => s.select('.domain').remove())
    .call((s) => s.selectAll('line').attr('stroke', 'var(--cds-chart-grid)'))
    .call((s) => s.selectAll('text').attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)'));

  const ZONE = { 'Get in early': 'var(--color-ok)', 'Hot now': 'var(--color-warn)', 'Crowded': 'var(--color-bad)', 'Fading': 'var(--cds-chart-muted)' };
  document.querySelectorAll('.sw.zone').forEach((s) => { s.style.background = ZONE[s.dataset.z]; });

  dash.draw('glancechart', (el) => {
    el.replaceChildren();
    const data = rows('map');
    if (!data.length) return;
    const radar = rows('radar');
    const cats = window.FF_CATS;
    const catColor = (c) => dash.colors[Math.max(0, cats.indexOf(c)) % dash.colors.length];
    const W = Math.max(300, el.clientWidth), H = Math.min(480, Math.max(340, W * 0.62));
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).style('touch-action', 'pan-y');
    const m = { l: 14, r: 14, t: 14, b: 44 };
    const clipId = 'ffclip';
    svg.append('clipPath').attr('id', clipId).append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b);
    const x = d3.scaleLinear([0.5, 6.5], [m.l, W - m.r]);
    const hmax = Math.max(1, d3.max(data, (d) => d.heat)), hmin = Math.min(-0.5, d3.min(data, (d) => d.heat));
    const y = d3.scaleLinear([hmin, hmax * 1.15], [H - m.b, m.t]);
    const r = d3.scaleSqrt([1, Math.max(2, d3.max(data, (d) => d.signals))], [7, 20]);
    const pts = data.map((d) => ({ ...d, rr: r(d.signals) }));
    d3.group(pts, (d) => d.stage).forEach((g) => {
      const n = g.length;
      g.sort((a, b) => b.heat - a.heat).forEach((d, i) => { d.sx = d.stage + (n > 1 ? -0.38 + (0.76 * i) / (n - 1) : 0); });
    });
    pts.forEach((d) => {
      const sig = radar.filter((s) => s.field === d.field);
      const g = Array.from(d3.rollup(sig, (v) => ({ n: v.length, h: d3.mean(v, (s) => s.heat) }), (s) => s.category));
      d.sats = g.map(([c, v], i) => ({ field: d.field, cat: c, n: v.n, h: v.h, a: -Math.PI / 2 + (i / Math.max(1, g.length)) * 2 * Math.PI }));
    });
    const view = svg.append('g').attr('clip-path', `url(#${clipId})`);
    const bands = [[0.5, 2.5, 'Get in early'], [2.5, 4.5, 'Hot now'], [4.5, 6.5, 'Crowded']];
    const bandSel = view.append('g').selectAll('rect').data(bands).join('rect').style('fill', (b) => ZONE[b[2]]).attr('fill-opacity', 0.07).attr('y', m.t).attr('height', H - m.b - m.t);
    const zero = view.append('line').attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 3');
    const linkG = view.append('g'), satG = view.append('g'), bubG = view.append('g');
    const stageLbl = W < 420 ? ['New', 'Money', 'Main', 'How-to', 'Social', 'Crowd'] : W < 620 ? ['Emerging', 'Money', 'Mainstream', 'How-tos', 'Social', 'Crowded'] : ['Emerging', 'Money pours in', 'Goes mainstream', 'How-tos boom', 'Social flood', 'Crowded'];
    const stageText = svg.append('g').selectAll('text').data(stageLbl).join('text').attr('y', H - m.b + 16).attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text((s) => s);
    svg.append('text').attr('x', W / 2).attr('y', H - 6).attr('text-anchor', 'middle').attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text('Lifecycle stage →');
    svg.append('text').attr('x', m.l + 4).attr('y', m.t + 12).attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text('↑ Hotter');
    const tip = d3.select(el).append('div').attr('class', 'tip').style('display', 'none');
    const showTip = (ev, lines) => {
      const [px, py] = d3.pointer(ev, el);
      tip.style('display', null).selectAll('*').remove();
      lines.forEach((l, i) => tip.append('div').attr('class', i === 0 ? 't' : null).text(l));
      const tw = tip.node().offsetWidth;
      tip.style('left', Math.min(Math.max(0, px + 12), el.clientWidth - tw) + 'px').style('top', (py + 12) + 'px');
    };
    const hideTip = () => tip.style('display', 'none');
    const links = linkG.selectAll('line').data(pts.flatMap((d) => d.sats.map((s) => ({ d, s })))).join('line')
      .attr('stroke', (o) => catColor(o.s.cat)).attr('stroke-opacity', 0.55).attr('stroke-width', 1.5);
    const sats = satG.selectAll('g').data(pts.flatMap((d) => d.sats)).join('g').attr('data-trend', (s) => s.field)
      .on('pointerenter pointermove', (ev, s) => showTip(ev, [`${s.field} · ${s.cat}`, `${s.n} signal${s.n === 1 ? '' : 's'}, ${s.h >= 2.5 ? 'heating up' : s.h >= 1.5 ? 'building' : 'cooling'}`, 'Tap to see why']))
      .on('pointerleave', hideTip);
    sats.append('circle').attr('r', (s) => 3.5 + Math.sqrt(s.n) * 1.8).style('fill', (s) => catColor(s.cat)).attr('stroke', 'var(--color-panel)').attr('stroke-width', 1.5);
    const satLbl = sats.append('text').attr('dy', '0.35em').attr('fill', 'var(--color-fg-muted)').style('font-size', '10px').text((s) => s.cat);
    const bubs = bubG.selectAll('g').data(pts).join('g').attr('data-trend', (d) => d.field)
      .on('pointerenter pointermove', (ev, d) => showTip(ev, [d.field, `${d.zone} · heat ${d3.format('.2f')(d.heat)}`, `${d.signals} signal${d.signals === 1 ? '' : 's'} · tap for why`]))
      .on('pointerleave', hideTip);
    const lensOn = dash.params().lens === 'me';
    const fitOf = (f) => (rows('fit').find((r) => r.field === f) || {}).fit;
    bubs.append('circle').attr('r', (d) => d.rr).style('fill', (d) => ZONE[d.zone])
      .attr('fill-opacity', (d) => (lensOn ? (fitOf(d.field) == null ? 0.12 : 0.12 + 0.8 * fitOf(d.field) / 10) : 0.78))
      .attr('stroke', (d) => (lensOn && fitOf(d.field) >= 7 ? 'var(--color-fg)' : 'var(--color-panel)')).attr('stroke-width', (d) => (lensOn && fitOf(d.field) >= 7 ? 3 : 2));
    bubs.attr('opacity', (d) => (lensOn && !(fitOf(d.field) >= 4) ? 0.45 : 1));
    const bubLbl = bubs.append('text').attr('text-anchor', 'middle').attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)')
      .attr('y', (d) => -d.rr - 4).text((d) => d.field);
    const render = (t) => {
      const xs = t.rescaleX(x), ys = t.rescaleY(y), k = t.k;
      bandSel.attr('x', (b) => xs(b[0])).attr('width', (b) => xs(b[1]) - xs(b[0]));
      zero.attr('x1', m.l).attr('x2', W - m.r).attr('y1', ys(0)).attr('y2', ys(0));
      stageText.attr('x', (s, i) => xs(i + 1)).attr('display', (s, i) => (xs(i + 1) < m.l || xs(i + 1) > W - m.r ? 'none' : null));
      pts.forEach((d) => { d.px = xs(d.sx); d.py = ys(d.heat); });
      bubs.attr('transform', (d) => `translate(${d.px},${d.py})`);
      const full = W < 520 && k < 1.5;
      bubLbl.text((d) => (full && d.field.length > 14 ? d.field.slice(0, 13) + '…' : d.field)).attr('display', null);
      const kept = [];
      pts.slice().sort((a, b) => b.signals - a.signals || b.heat - a.heat).forEach((d) => {
        const node = bubLbl.filter((x) => x === d).node(); if (!node) return;
        const w = node.getComputedTextLength(), h = 14;
        const box = { x: d.px - w / 2 - 2, y: d.py - d.rr - 4 - h, w: w + 4, h };
        const inView = d.px > m.l - 20 && d.px < W - m.r + 20 && d.py > m.t - 10 && d.py < H - m.b + 10;
        const hit = kept.some((k) => box.x < k.x + k.w && box.x + box.w > k.x && box.y < k.y + k.h && box.y + box.h > k.y);
        if (hit || !inView) node.setAttribute('display', 'none'); else kept.push(box);
      });
      const showSats = k >= 1.8, ring = (d) => d.rr + 16 + Math.min(18, (k - 1.8) * 8);
      links.attr('display', showSats ? null : 'none')
        .attr('x1', (o) => o.d.px).attr('y1', (o) => o.d.py)
        .attr('x2', (o) => o.d.px + ring(o.d) * Math.cos(o.s.a)).attr('y2', (o) => o.d.py + ring(o.d) * Math.sin(o.s.a));
      sats.attr('display', showSats ? null : 'none').attr('transform', (s) => {
        const d = pts.find((p) => p.field === s.field);
        return `translate(${d.px + ring(d) * Math.cos(s.a)},${d.py + ring(d) * Math.sin(s.a)})`;
      });
      satLbl.attr('display', k >= 3 ? null : 'none').attr('text-anchor', (s) => (Math.cos(s.a) < -0.2 ? 'end' : 'start')).attr('x', (s) => (Math.cos(s.a) < -0.2 ? -8 : 8));
      svg.style('touch-action', k > 1.01 ? 'none' : 'pan-y');
    };
    const zoom = d3.zoom().scaleExtent([1, 8]).extent([[m.l, m.t], [W - m.r, H - m.b]]).translateExtent([[m.l, m.t], [W - m.r, H - m.b]])
      .filter((ev) => {
        if (ev.type === 'wheel') return ev.ctrlKey || ev.metaKey;
        if (ev.type === 'touchstart') return ev.touches.length > 1 || d3.zoomTransform(svg.node()).k > 1.01;
        return !ev.button;
      })
      .on('zoom', (ev) => { window.ffZoomT = ev.transform; hideTip(); render(ev.transform); });
    svg.call(zoom).on('dblclick.zoom', null);
    window.ffZoom = { zoom, svg };
    const start = window.ffZoomT || d3.zoomIdentity;
    svg.call(zoom.transform, start);
    render(start);
    el.style.minHeight = H + 'px';
  });

  [['o_es', 'ext_super'], ['o_ee', 'ext_expert'], ['o_cs', 'cat_super'], ['o_ce', 'cat_expert']].forEach(([name, key]) => {
    dash.draw(name, (el) => { const r = rows('odds').find((d) => d.key === key); setText(el, r ? d3.format('~g')(r.value) : '—'); });
  });
  dash.draw('ctable', (tb) => {
    tb.replaceChildren();
    rows('consensus').forEach((r) => {
      const tr = document.createElement('tr'); tr.dataset.key = r.outcome;
      const pct = (v) => `${d3.format('~g')(v)}%`;
      [[r.outcome, ''], [String(r.estimates), 'r'], [pct(r.lowest), 'r'], [pct(r.highest), 'r'], [pct(r.consensus), 'r'], [pct(r.per_year), 'r']].forEach(([v, c], i) => {
        const td = document.createElement('td'); td.textContent = v; if (c) td.className = c; if (i === 4) td.style.fontWeight = 'var(--cds-font-weight-medium)'; tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
  });

  dash.draw('oddschart', (el) => {
    el.replaceChildren();
    const data = rows('odds');
    if (!data.length) return;
    const groups = [...new Set(data.map((d) => d.group))];
    const W = Math.max(300, el.clientWidth), narrow = W < 560;
    const rowH = narrow ? 40 : 26, gapH = 30;
    const svg = d3.select(el).append('svg').attr('width', '100%');
    const lbl = (d) => `${d.label} · ${d.who}`;
    const lw = narrow ? 0 : Math.min(330, measure(svg, data.map(lbl)) + 14);
    const m = { l: narrow ? 8 : lw, r: 52, t: 6, b: 26 };
    let yy = m.t; const pos = [];
    groups.forEach((g) => { pos.push({ g, y: yy + 16, head: true }); yy += gapH; data.filter((d) => d.group === g).forEach((d) => { pos.push({ d, y: yy + rowH / 2 }); yy += rowH; }); });
    const H = yy + m.b;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const x = d3.scaleLog([0.01, 100], [m.l, W - m.r]);
    svg.append('g').attr('transform', `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).tickValues([0.01, 0.1, 1, 10, 100]).tickFormat((v) => `${d3.format('~g')(v)}%`).tickSize(-(H - m.b - m.t)))
      .call(axisStyle);
    const tip = d3.select(el).append('div').attr('class', 'tip').style('display', 'none');
    pos.forEach((p, i) => {
      if (p.head) {
        svg.append('text').attr('x', narrow ? m.l : 0).attr('y', p.y).attr('fill', 'var(--color-fg)')
          .style('font-size', 'var(--cds-font-size-caption)').style('font-weight', 'var(--cds-font-weight-medium)').text(p.g);
        return;
      }
      const d = p.d, c = d.who.startsWith('Super') || d.who.startsWith('Samotsvety') ? dash.colors[0] : dash.colors[1 % dash.colors.length];
      const dotY = narrow ? p.y + 7 : p.y;
      svg.append('text').attr('x', narrow ? m.l : 0).attr('y', narrow ? p.y - 8 : p.y).attr('dy', '0.35em')
        .attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text(lbl(d))
        .each(function () { const s = this, max = narrow ? W - 16 : lw - 10; let t = s.textContent; while (s.getComputedTextLength() > max && t.length > 6) { t = t.slice(0, -2); s.textContent = t + '…'; } });
      if (d.low != null && d.high != null) svg.append('line').attr('x1', x(d.low)).attr('x2', x(d.high)).attr('y1', dotY).attr('y2', dotY)
        .attr('stroke', c).attr('stroke-opacity', 0.4).attr('stroke-width', 6).attr('stroke-linecap', 'round');
      svg.append('circle').attr('cx', x(d.value)).attr('cy', dotY).attr('r', 6).style('fill', c).style('cursor', 'pointer')
        .on('pointerenter pointermove click', (ev) => {
          const [px, py] = d3.pointer(ev, el);
          tip.style('display', null).selectAll('*').remove();
          tip.append('div').attr('class', 't').text(d.label);
          tip.append('div').text(`${d.who}: ${d3.format('~g')(d.value)}%${d.low != null ? ` (range ${d3.format('~g')(d.low)} to ${d3.format('~g')(d.high)}%)` : ''}`);
          tip.append('div').text(d.source);
          const tw = tip.node().offsetWidth;
          tip.style('left', Math.min(Math.max(0, px + 12), el.clientWidth - tw) + 'px').style('top', (py + 12) + 'px');
        })
        .on('pointerleave', () => tip.style('display', 'none'));
      svg.append('text').attr('x', Math.min(x(d.high ?? d.value) + 10, W - m.r + 6)).attr('y', dotY).attr('dy', '0.35em')
        .attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)').text(`${d3.format('~g')(d.value)}%`);
    });
    el.style.minHeight = H + 'px';
  });

  const riskColor = (v) => (v >= 80 ? 'var(--color-bad)' : v >= 60 ? 'var(--cds-chart-status-critical)' : v >= 40 ? 'var(--color-warn)' : 'var(--color-ok)');
  const riskWord = (v) => (v >= 80 ? 'Crisis' : v >= 60 ? 'High' : v >= 40 ? 'Elevated' : v >= 20 ? 'Normal tension' : 'Calm');
  dash.draw('clocksec', (el) => { const c = rows('clock')[0]; setText(el, c ? String(c.seconds_to_midnight) : '—'); });
  dash.draw('clockdate', (el) => { const c = rows('clock')[0]; setText(el, c ? d3.utcFormat('%b %-d, %Y')(new Date(c.set_on)) : '—'); });
  dash.draw('gauge', (el) => {
    el.replaceChildren();
    const data = rows('risk');
    if (!data.length) return;
    const avg = d3.mean(data, (d) => d.level);
    const W = Math.max(220, Math.min(360, el.clientWidth)), H = W * 0.62;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', '360px');
    const cx = W / 2, cy = H - 18, R = W / 2 - 14;
    const a = d3.scaleLinear([0, 100], [-Math.PI / 2, Math.PI / 2]);
    const arc = d3.arc().innerRadius(R - 16).outerRadius(R);
    [[0, 40, 'var(--color-ok)'], [40, 60, 'var(--color-warn)'], [60, 80, 'var(--cds-chart-status-critical)'], [80, 100, 'var(--color-bad)']].forEach(([s, e, c]) => {
      svg.append('path').attr('transform', `translate(${cx},${cy})`).attr('d', arc({ startAngle: a(s), endAngle: a(e) })).style('fill', c).attr('fill-opacity', 0.35);
    });
    svg.append('path').attr('transform', `translate(${cx},${cy})`).attr('d', arc({ startAngle: a(0), endAngle: a(avg) })).style('fill', riskColor(avg));
    const ang = a(avg) - Math.PI / 2;
    svg.append('line').attr('x1', cx).attr('y1', cy).attr('x2', cx + (R - 24) * Math.cos(ang)).attr('y2', cy + (R - 24) * Math.sin(ang))
      .attr('stroke', 'var(--color-fg)').attr('stroke-width', 3).attr('stroke-linecap', 'round');
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 5).style('fill', 'var(--color-fg)');
    svg.append('text').attr('x', cx).attr('y', cy - R * 0.38).attr('text-anchor', 'middle').style('font-family', 'var(--font-anthropic-serif)')
      .style('font-size', 'var(--cds-font-size-title)').attr('fill', 'var(--color-fg)').text(d3.format('.0f')(avg));
    svg.append('text').attr('x', cx).attr('y', cy - R * 0.38 + 20).attr('text-anchor', 'middle').style('font-size', 'var(--cds-font-size-caption)')
      .attr('fill', 'var(--color-fg-muted)').text(`World stress: ${riskWord(avg)}`);
    el.style.minHeight = H + 'px';
  });
  dash.draw('riskbars', (el) => {
    el.replaceChildren();
    const data = rows('risk').slice().sort((a, b) => b.level - a.level);
    if (!data.length) return;
    const W = Math.max(260, el.clientWidth), rowH = 30;
    const svg = d3.select(el).append('svg').attr('width', '100%');
    const lw = measure(svg, data.map((d) => d.category)) + 12;
    const m = { l: lw, r: 70, t: 4, b: 4 };
    const H = m.t + m.b + data.length * rowH;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const x = d3.scaleLinear([0, 100], [m.l, W - m.r]);
    const y = d3.scaleBand(data.map((d) => d.category), [m.t, H - m.b]).padding(0.3);
    svg.append('g').selectAll('rect.bg').data(data).join('rect').attr('class', 'bg').attr('x', m.l).attr('width', x(100) - m.l)
      .attr('y', (d) => y(d.category)).attr('height', y.bandwidth()).attr('rx', 3).style('fill', 'var(--cds-chart-grid)').attr('data-risk', (d) => d.category);
    svg.append('g').selectAll('rect.v').data(data).join('rect').attr('class', 'v').attr('x', m.l).attr('width', (d) => Math.max(2, x(d.level) - m.l))
      .attr('y', (d) => y(d.category)).attr('height', y.bandwidth()).attr('rx', 3).style('fill', (d) => riskColor(d.level)).attr('data-risk', (d) => d.category);
    svg.append('g').selectAll('text.l').data(data).join('text').attr('class', 'l').attr('x', 0).attr('y', (d) => y(d.category) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('fill', 'var(--color-fg-muted)').attr('data-risk', (d) => d.category).attr('text-decoration', 'underline').style('font-size', 'var(--cds-font-size-caption)').text((d) => d.category);
    const arrow = { up: '↑', down: '↓', flat: '→' };
    svg.append('g').selectAll('text.n').data(data).join('text').attr('class', 'n').attr('x', W - m.r + 6).attr('y', (d) => y(d.category) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('fill', 'var(--color-fg)').attr('data-risk', (d) => d.category).style('font-size', 'var(--cds-font-size-caption)').text((d) => `${d.level} ${arrow[d.trend] || ''}`);
    el.style.minHeight = H + 'px';
  });

  const picked = () => dash.params().trend || null;
  const sigFor = (f) => rows('radar').filter((r) => r.field === f).sort((a, b) => (a.date < b.date ? 1 : -1));
  const link = (r) => {
    if (!r.url) return document.createTextNode(r.source || '');
    const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.source; return a;
  };
  dash.draw('sugg', {
    mount: (el) => {
      const input = document.getElementById('ffsearch');
      const state = { input, items: [], active: -1 };
      const go = (it) => { if (!it) return; input.value = ''; el.replaceChildren(); el.classList.remove('open'); if (it.kind === 'ask') return; window.ffOpen(it.kind, it.name); };
      state.go = go;
      if (input) {
        input.addEventListener('input', () => { state.active = -1; dash.draw('sugg'); });
        input.addEventListener('focus', () => dash.draw('sugg'));
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'ArrowDown') { state.active = Math.min(state.items.length - 1, state.active + 1); dash.draw('sugg'); ev.preventDefault(); }
          else if (ev.key === 'ArrowUp') { state.active = Math.max(0, state.active - 1); dash.draw('sugg'); ev.preventDefault(); }
          else if (ev.key === 'Enter') { go(state.items[Math.max(0, state.active)]); ev.preventDefault(); }
          else if (ev.key === 'Escape') { input.value = ''; dash.draw('sugg'); }
        });
        input.addEventListener('blur', () => setTimeout(() => { el.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); }, 200));
      }
      return state;
    },
    update: (el, st) => {
      el.replaceChildren();
      const q = st.input ? st.input.value.trim().toLowerCase() : '';
      if (!q) { el.classList.remove('open'); if (st.input) st.input.setAttribute('aria-expanded', 'false'); st.items = []; return; }
      const has = (t) => (t || '').toLowerCase().includes(q);
      const items = [];
      rows('map').forEach((m) => {
        const b = rows('briefs').find((r) => r.field === m.field) || {};
        const sig = rows('radar').filter((r) => r.field === m.field);
        let score = 0, hint = m.zone;
        if (m.field.toLowerCase().startsWith(q)) score = 3; else if (has(m.field)) score = 2;
        else { const hitSig = sig.find((r) => has(r.signal)); if (hitSig) { score = 1; hint = `mentions “${q}”: ${hitSig.signal}`; } else if (has(b.why) || has(b.background)) { score = 1; hint = `related: ${b.why}`; } }
        if (score) items.push({ kind: 'trend', name: m.field, label: 'Trend', hint, score });
      });
      rows('people').forEach((p) => { if (has(p.name) || has(p.role)) items.push({ kind: 'person', name: p.name, label: 'Person', hint: p.role, score: has(p.name) ? 2.5 : 1 }); });
      rows('risk').forEach((r) => { const ri = rows('riskinfo').find((x) => x.category === r.category) || {}; if (has(r.category) || has(ri.background)) items.push({ kind: 'risk', name: r.category, label: 'World risk', hint: `Level ${r.level}`, score: has(r.category) ? 2.5 : 1 }); });
      items.sort((a, b) => b.score - a.score);
      const list = items.slice(0, 8);
      const qq = st.input.value.trim();
      list.push({ kind: 'ask', name: qq, label: list.length ? 'Want more?' : 'Not tracked yet', hint: list.length ? `Want more on “${qq}”? Ask in #flood-forecast on Discord` : `Suggest “${qq}” in #flood-forecast on Discord and we'll start tracking it`, score: 0 });
      st.items = list;
      list.forEach((it, i) => {
        const li = document.createElement('li'); li.className = 'sg' + (i === st.active ? ' on' : '') + (it.kind === 'ask' ? ' ask' : '');
        li.setAttribute('role', 'option');
        const k = document.createElement('span'); k.className = 'sgk'; k.textContent = it.label; li.appendChild(k);
        const n = document.createElement('span'); n.className = 'sgn'; n.textContent = it.kind === 'ask' ? '' : it.name; li.appendChild(n);
        const h = document.createElement('span'); h.className = 'sgh'; h.textContent = it.hint || ''; li.appendChild(h);
        li.addEventListener('pointerdown', (ev) => { ev.preventDefault(); st.go(it); });
        el.appendChild(li);
      });
      el.classList.add('open'); st.input.setAttribute('aria-expanded', 'true');
    },
  });

  dash.draw('tdpick', (sel) => {
    const names = rows('map').map((r) => r.field).sort((a, b) => a.localeCompare(b));
    sel.replaceChildren(new Option('Choose a trend…', ''), ...names.map((n) => new Option(n, n)));
    sel.value = picked() && names.includes(picked()) ? picked() : '';
    sel.onchange = () => { if (sel.value) window.ffPick(sel.value); };
  });
  dash.draw('freshness', (el) => {
    const r = rows('radar'); if (!r.length) { setText(el, '—'); return; }
    const u = window.ffUpdated ? new Date(window.ffUpdated) : null;
    setText(el, `${r.length} signals across ${new Set(r.map((x) => x.field)).size} trends${u ? ` · data updated ${d3.timeFormat('%b %-d, %-I:%M %p')(u)}` : ''}`);
  });
  dash.draw('tdname', (el) => setText(el, picked() || '—'));
  dash.draw('tdstats', (el) => {
    const m = rows('map').find((r) => r.field === picked());
    setText(el, m ? `${m.zone} · stage ${m.stage} of 6 · heat ${d3.format('.2f')(m.heat)} · ${m.signals} signal${m.signals === 1 ? '' : 's'}` : (picked() ? 'No live signals for this one yet.' : '—'));
  });
  dash.draw('tdwhy', (el) => {
    const f = picked(); if (!f) { setText(el, '—'); return; }
    const b = rows('briefs').find((r) => r.field === f);
    if (b) { setText(el, b.why); return; }
    const s = sigFor(f);
    if (!s.length) { setText(el, 'The collector has no signals for this trend yet.'); return; }
    const top = Array.from(d3.rollup(s, (v) => v.length, (r) => r.category)).sort((a, b) => b[1] - a[1]).slice(0, 2).map((e) => e[0]);
    setText(el, `Driven mostly by ${top.join(' and ').toLowerCase()} signals. Latest: ${s[0].signal}`);
  });
  dash.draw('tdwatch', (el) => {
    const b = rows('briefs').find((r) => r.field === picked());
    setText(el, b ? b.watch : (picked() ? 'A brief arrives with the collector\'s next run.' : '—'));
  });
  dash.draw('tdfore', (el) => {
    const f = picked(); const d = rows('projection').filter((r) => r.field === f);
    if (!d.length) { setText(el, '—'); return; }
    const act = d.filter((r) => r.kind === 'actual'), fc = d.filter((r) => r.kind === 'forecast');
    const now = act[act.length - 1].heat, end = fc[fc.length - 1];
    const dir = end.heat > now + 0.1 ? 'keep heating up' : end.heat < now - 0.1 ? 'cool off' : 'hold steady';
    setText(el, `Heat ${d3.format('.2f')(now)} now. Over the next ${end.horizon_weeks} weeks it's forecast to ${dir}, reaching about ${d3.format('.2f')(end.heat)} (range ${d3.format('.2f')(end.lo)} to ${d3.format('.2f')(end.hi)}).`);
  });
  dash.draw('tddrivers', (el) => {
    el.replaceChildren();
    const s = sigFor(picked());
    Array.from(d3.rollup(s, (v) => ({ n: v.length, h: d3.mean(v, (r) => r.heat) }), (r) => r.category)).sort((a, b) => b[1].n - a[1].n)
      .forEach(([c, v]) => {
        const sp = document.createElement('span'); sp.className = 'chip';
        sp.style.borderColor = v.h >= 2.5 ? 'var(--color-ok)' : v.h >= 1.5 ? 'var(--color-warn)' : 'var(--color-bad)';
        sp.textContent = `${c} · ${v.n}`; el.appendChild(sp);
      });
  });
  const listInto = (el, items, empty) => {
    el.replaceChildren();
    if (!items.length) { const li = document.createElement('li'); li.className = 'meta'; li.textContent = empty; el.appendChild(li); return; }
    items.forEach((r) => {
      const li = document.createElement('li');
      const t = document.createElement('div'); t.textContent = r.signal; li.appendChild(t);
      const m = document.createElement('div'); m.className = 'meta';
      m.appendChild(document.createTextNode(`${d3.utcFormat('%b %-d, %Y')(new Date(r.date))} · ${r.category} · `)); m.appendChild(link(r));
      li.appendChild(m); el.appendChild(li);
    });
  };
  const personFor = (r) => rows('people').find((pp) => (pp.match || [pp.name]).some((m) => (r.signal || '').includes(m)));
  const pickedP = () => dash.params().person || null;
  const pickedR = () => dash.params().risk || null;
  const person = () => rows('people').find((pp) => pp.name === pickedP());
  const pSignals = () => { const pp = person(); return pp ? rows('radar').filter((r) => (pp.match || [pp.name]).some((m) => (r.signal || '').includes(m))).sort((a, b) => (a.date < b.date ? 1 : -1)) : []; };
  dash.draw('tdbg', (el) => { const b = rows('briefs').find((r) => r.field === picked()); setText(el, b && b.background ? b.background : (picked() ? 'Background arrives with the next collector run.' : '—')); });
  dash.draw('pdname', (el) => setText(el, pickedP() || '—'));
  dash.draw('pdrole', (el) => { const pp = person(); setText(el, pp ? pp.role : (pickedP() ? 'Profile coming with the next collector run.' : '—')); });
  dash.draw('pdbg', (el) => { const pp = person(); setText(el, pp ? pp.background : '—'); });
  dash.draw('pdwhy', (el) => { const pp = person(); setText(el, pp ? pp.why : '—'); });
  dash.draw('pdtrends', (el) => {
    el.replaceChildren();
    [...new Set(pSignals().map((r) => r.field))].forEach((f) => { const sp = document.createElement('span'); sp.className = 'chip tlink'; sp.dataset.trend = f; sp.textContent = f; el.appendChild(sp); });
  });
  dash.draw('pdsignals', (el) => listInto(el, pSignals(), 'Nothing logged yet.'));
  const riskRow = () => rows('risk').find((r) => r.category === pickedR());
  const riskInfo = () => rows('riskinfo').find((r) => r.category === pickedR());
  dash.draw('rdname', (el) => setText(el, pickedR() || '—'));
  dash.draw('rdlevel', (el) => { const r = riskRow(); setText(el, r ? `Level ${r.level} of 100 · ${riskWord(r.level)} · ${r.trend === 'up' ? 'rising' : r.trend === 'down' ? 'falling' : 'holding steady'}` : '—'); });
  dash.draw('rdwhy', (el) => {
    el.replaceChildren();
    const r = riskRow(); if (!r) { el.textContent = '—'; return; }
    el.appendChild(document.createTextNode(r.basis + ' '));
    if (r.url) { const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = `(${r.source})`; el.appendChild(a); }
  });
  dash.draw('rdbg', (el) => { const r = riskInfo(); setText(el, r ? r.background : '—'); });
  dash.draw('rdwatch', (el) => { const r = riskInfo(); setText(el, r ? r.watch : '—'); });
  dash.draw('rdodds', (el) => {
    el.replaceChildren();
    const keys = (riskInfo() || {}).odds_keys || [];
    const list = rows('odds').filter((o) => keys.includes(o.key));
    if (!list.length) { const li = document.createElement('li'); li.className = 'meta'; li.textContent = 'No published estimates tracked for this one yet.'; el.appendChild(li); return; }
    list.forEach((o) => {
      const li = document.createElement('li');
      const t = document.createElement('div'); t.textContent = `${o.label}: ${d3.format('~g')(o.value)}%`; li.appendChild(t);
      const m2 = document.createElement('div'); m2.className = 'meta'; m2.appendChild(document.createTextNode(`${o.who} · `));
      if (o.url) { const a = document.createElement('a'); a.href = o.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = o.source; m2.appendChild(a); } else m2.appendChild(document.createTextNode(o.source));
      li.appendChild(m2); el.appendChild(li);
    });
  });

  dash.draw('tdpeople', (el) => listInto(el, sigFor(picked()).filter((r) => r.category === 'Key people'), 'No key people logged for this trend yet.'));
  dash.draw('tdsignals', (el) => listInto(el, sigFor(picked()), 'No signals yet.'));

  const STATUS = { 'Trending harder': 'var(--color-ok)', 'Cooling off': 'var(--color-warn)', 'Becoming a problem': 'var(--color-bad)', 'Steady': 'var(--color-fg-muted)', 'No new data': 'var(--color-fg-muted)' };
  const signed = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${d3.format('.2f')(v)}`);
  dash.draw('tdwatchstate', (el) => {
    const f = picked(); if (!f) { setText(el, '—'); return; }
    const w = rows('watchlist').find((r) => r.field === f);
    el.style.color = w ? 'var(--color-ok)' : 'var(--color-fg-muted)';
    setText(el, w ? `★ Watching since ${d3.utcFormat('%b %-d')(new Date(w.since))}` : 'Tap ☆ Watch to follow this trend on your Watched tab.');
  });
  dash.draw('wcards', (el) => {
    el.replaceChildren();
    const list = rows('watched');
    if (dash.data('watched').status === 'ok' && !list.length) { const p0 = document.createElement('p'); p0.className = 'wmeta'; p0.textContent = 'Nothing watched yet. Open any trend and tap ☆ Watch.'; el.appendChild(p0); return; }
    const order = { 'Becoming a problem': 0, 'Trending harder': 1, 'Cooling off': 2, 'Steady': 3, 'No new data': 4 };
    list.slice().sort((a, b) => order[a.status] - order[b.status]).forEach((w) => {
      const c = document.createElement('div'); c.className = 'wcard';
      const top = document.createElement('div'); top.className = 'wtop';
      const nm = document.createElement('span'); nm.className = 'wname tlink'; nm.dataset.trend = w.field; nm.textContent = w.field; top.appendChild(nm);
      const pill = document.createElement('span'); pill.className = 'pill'; pill.style.color = STATUS[w.status]; pill.textContent = w.status; top.appendChild(pill);
      c.appendChild(top);
      const row = document.createElement('div'); row.className = 'wrow';
      [['30 days ago', w.heat_30d_ago], ['Since watching', w.base_heat], ['Now', w.now_heat]].forEach(([l, v]) => {
        const cell = document.createElement('div'); cell.className = 'wcell';
        const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = l; cell.appendChild(lab);
        const b = document.createElement('b'); b.textContent = v == null ? '—' : d3.format('.2f')(v); cell.appendChild(b);
        row.appendChild(cell);
      });
      c.appendChild(row);
      const ch = document.createElement('div'); ch.className = 'wmeta';
      ch.textContent = `Heat ${signed(w.change_30d)} in 30 days, ${signed(w.change_since)} since you started watching. ${w.base_zone} → ${w.now_zone || '—'}.`;
      c.appendChild(ch);
      const s = rows('trend').filter((r) => r.field === w.field);
      if (s.length > 1) {
        const sw = Math.max(200, el.clientWidth > 600 ? 260 : el.clientWidth - 40), sh = 40;
        const sv = d3.select(c).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${sw} ${sh}`).attr('preserveAspectRatio', 'none').style('height', sh + 'px');
        const xx = d3.scaleLinear([0, s.length - 1], [2, sw - 2]);
        const ext = d3.extent(s, (r) => r.heat); if (ext[0] === ext[1]) { ext[0] -= 0.5; ext[1] += 0.5; }
        const yy = d3.scaleLinear(ext, [sh - 3, 3]);
        sv.append('path').attr('d', d3.line().x((r, i) => xx(i)).y((r) => yy(r.heat))(s)).attr('fill', 'none').attr('stroke', STATUS[w.status] === 'var(--color-fg-muted)' ? dash.colors[0] : STATUS[w.status]).attr('stroke-width', 2).attr('vector-effect', 'non-scaling-stroke');
      }
      const lt = document.createElement('div'); lt.className = 'wmeta';
      lt.textContent = w.new_signals ? `${w.new_signals} new signal${w.new_signals === 1 ? '' : 's'} since you started watching. Latest: ${w.latest}` : 'No new signals since you started watching.';
      c.appendChild(lt);
      el.appendChild(c);
    });
  });
  dash.draw('alist', (el) => {
    el.replaceChildren();
    const a = rows('alerts').slice().sort((x, y) => (x.at < y.at ? 1 : -1));
    if (!a.length) { const li = document.createElement('li'); li.className = 'meta'; li.textContent = 'No alerts yet. The collector checks your watched trends every 6 hours.'; el.appendChild(li); return; }
    a.slice(0, 40).forEach((r) => {
      const li = document.createElement('li');
      const t = document.createElement('div');
      const nm = document.createElement('span'); nm.className = 'tlink'; nm.dataset.trend = r.field; nm.textContent = r.field; t.appendChild(nm);
      t.appendChild(document.createTextNode(` · ${r.kind}`)); t.style.color = STATUS[r.kind] || 'var(--color-fg)'; li.appendChild(t);
      const m2 = document.createElement('div'); m2.textContent = r.text; li.appendChild(m2);
      const m3 = document.createElement('div'); m3.className = 'meta'; m3.textContent = d3.utcFormat('%b %-d, %Y %H:%M UTC')(new Date(r.at)); li.appendChild(m3);
      el.appendChild(li);
    });
  });

  const fitColor = (n) => (n >= 7 ? 'var(--color-ok)' : n >= 4 ? 'var(--color-warn)' : 'var(--color-fg-muted)');
  dash.draw('digestlist', (el) => {
    el.replaceChildren();
    const d = rows('digest');
    if (dash.data('digest').status === 'ok' && !d.length) { const li = document.createElement('li'); li.className = 'meta'; li.textContent = 'Nothing has moved enough yet. Check back after the next collector run.'; el.appendChild(li); return; }
    const col = { 'Heating up': 'var(--color-ok)', 'Cooling': 'var(--color-bad)', 'Whisper': 'var(--color-warn)', 'New on the radar': 'var(--color-warn)' };
    d.forEach((r) => {
      const li = document.createElement('li');
      const k = document.createElement('span'); k.className = 'dkind'; k.style.color = col[r.kind] || 'var(--color-fg)';
      k.textContent = r.delta == null ? r.kind : `${r.kind} · heat ${r.delta > 0 ? '+' : ''}${d3.format('.2f')(r.delta)} in 4 weeks`; li.appendChild(k);
      const n = document.createElement('span'); n.className = 'wname tlink'; n.dataset.trend = r.field; n.textContent = r.field; li.appendChild(n);
      const why = document.createElement('span'); why.className = 'meta'; why.textContent = r.reason; li.appendChild(why);
      el.appendChild(li);
    });
  });
  dash.draw('foryoulist', (el) => {
    el.replaceChildren();
    const zoneBoost = { 'Get in early': 1.2, 'Hot now': 1.1, 'Crowded': 0.7, 'Fading': 0.5 };
    const list = rows('fit').map((f) => ({ ...f, z: (rows('map').find((m) => m.field === f.field) || {}).zone }))
      .sort((a, b) => b.fit * (zoneBoost[b.z] || 1) - a.fit * (zoneBoost[a.z] || 1)).filter((f) => f.fit >= 4).slice(0, 6);
    list.forEach((f) => {
      const li = document.createElement('li');
      const t = document.createElement('div');
      const b = document.createElement('span'); b.className = 'fitbadge'; b.style.color = fitColor(f.fit); b.textContent = `${f.fit}/10`; t.appendChild(b);
      const n = document.createElement('span'); n.className = 'wname tlink'; n.dataset.trend = f.field; n.textContent = f.field; t.appendChild(n);
      if (f.z) { const z = document.createElement('span'); z.className = 'meta'; z.textContent = ` · ${f.z}`; t.appendChild(z); }
      li.appendChild(t);
      const w = document.createElement('div'); w.textContent = f.why_me; li.appendChild(w);
      const s = document.createElement('div'); s.className = 'meta'; s.textContent = `Next step: ${f.next_step}`; li.appendChild(s);
      el.appendChild(li);
    });
  });
  dash.draw('tdfit', (el) => {
    const f = rows('fit').find((r) => r.field === picked());
    setText(el, f ? `${f.fit}/10 fit. ${f.why_me} Next step: ${f.next_step}` : (picked() ? 'Fit for you arrives with the next collector run.' : '—'));
  });

  const topTrends = () => {
    const d = rows('projection').filter((r) => r.kind === 'actual');
    const last = d3.rollup(d, (v) => v[v.length - 1].heat, (r) => r.field);
    return [...last].sort((a, b) => b[1] - a[1]).slice(0, 5).map((e) => e[0]);
  };
  dash.draw('reach', (el) => { const r = rows('projection')[0]; setText(el, r ? String(r.horizon_weeks) : '—'); });
  dash.draw('histw', (el) => { const r = rows('projection')[0]; setText(el, r ? String(r.history_weeks) : '—'); });
  dash.draw('fclegend', (el) => {
    el.replaceChildren();
    topTrends().forEach((f, i) => {
      const sp = document.createElement('span'); sp.dataset.trend = f; const sw = document.createElement('i'); sw.className = 'sw';
      sw.style.background = dash.colors[i % dash.colors.length]; sp.appendChild(sw); sp.appendChild(document.createTextNode(f)); el.appendChild(sp);
    });
  });
  dash.draw('fcchart', (el) => {
    el.replaceChildren();
    const all = rows('projection');
    if (!all.length) return;
    const top = topTrends();
    const data = all.filter((r) => top.includes(r.field)).map((r) => ({ ...r, t: new Date(r.week) }));
    const W = Math.max(300, el.clientWidth), H = 280;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
    const m = { l: 36, r: 12, t: 12, b: 26 };
    const x = d3.scaleUtc(d3.extent(data, (d) => d.t), [m.l, W - m.r]);
    const lo = d3.min(data, (d) => (d.lo ?? d.heat)), hi = d3.max(data, (d) => (d.hi ?? d.heat));
    const y = d3.scaleLinear([Math.min(0, lo), Math.max(0.5, hi)], [H - m.b, m.t]).nice();
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(W < 520 ? 3 : 6).tickFormat(d3.utcFormat('%b %y')).tickSize(0).tickPadding(8)).call(axisStyle);
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(W - m.l - m.r))).call(axisStyle);
    const nowT = d3.max(data.filter((d) => d.kind === 'actual'), (d) => d.t);
    svg.append('line').attr('x1', x(nowT)).attr('x2', x(nowT)).attr('y1', m.t).attr('y2', H - m.b).attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 3');
    svg.append('text').attr('x', x(nowT) + 4).attr('y', m.t + 10).attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text('Today');
    top.forEach((f, i) => {
      const c = dash.colors[i % dash.colors.length];
      const act = data.filter((d) => d.field === f && d.kind === 'actual');
      const fc = [act[act.length - 1], ...data.filter((d) => d.field === f && d.kind === 'forecast')];
      svg.append('path').attr('d', d3.area().x((d) => x(d.t)).y0((d) => y(d.lo ?? d.heat)).y1((d) => y(d.hi ?? d.heat))(fc)).style('fill', c).attr('fill-opacity', 0.1);
      svg.append('path').attr('d', d3.line().x((d) => x(d.t)).y((d) => y(d.heat))(act)).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      svg.append('path').attr('d', d3.line().x((d) => x(d.t)).y((d) => y(d.heat))(fc)).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2).attr('stroke-dasharray', '5 4');
    });
    const tip = d3.select(el).append('div').attr('class', 'tip').style('display', 'none');
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px, py] = d3.pointer(ev, el);
        const t = x.invert(d3.pointer(ev)[0]);
        tip.style('display', null).selectAll('*').remove();
        tip.append('div').attr('class', 't').text(d3.utcFormat('%b %-d, %Y')(t));
        top.forEach((f, i) => {
          const s = data.filter((d) => d.field === f);
          const near = s.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
          const row = tip.append('div');
          row.append('i').attr('class', 'sw').style('background', dash.colors[i % dash.colors.length]).style('margin-right', '6px');
          row.append('span').text(`${f}: ${d3.format('.2f')(near.heat)}${near.kind === 'forecast' ? ' (forecast)' : ''}`);
        });
        const tw = tip.node().offsetWidth;
        tip.style('left', Math.min(Math.max(0, px + 12), el.clientWidth - tw) + 'px').style('top', (py + 12) + 'px');
      })
      .on('pointerleave', () => tip.style('display', 'none'));
    el.style.minHeight = H + 'px';
  });

  dash.draw('trendchart', (el) => {
    el.replaceChildren();
    const data = rows('trend');
    if (!data.length) return;
    const byF = d3.group(data, (d) => d.field);
    const last = (v) => v[v.length - 1].heat;
    const series = Array.from(byF, ([f, v]) => ({ f, v: v.map((d) => ({ t: new Date(d.week), h: d.heat })) }))
      .sort((a, b) => last(b.v.map((p) => ({ heat: p.h }))) - last(a.v.map((p) => ({ heat: p.h })))).slice(0, 6);
    const W = Math.max(300, el.clientWidth), H = 260;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
    const narrow = W < 560;
    const endW = narrow ? 0 : Math.min(200, measure(svg, series.map((s) => s.f)) + 16);
    const m = { l: 36, r: 12 + endW, t: 10, b: 26 };
    const x = d3.scaleUtc(d3.extent(data, (d) => new Date(d.week)), [m.l, W - m.r]);
    const y = d3.scaleLinear([Math.min(0, d3.min(data, (d) => d.heat)), Math.max(0.5, d3.max(data, (d) => d.heat))], [H - m.b, m.t]).nice();
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(narrow ? 3 : 6).tickFormat(d3.utcFormat('%b %y')).tickSize(0).tickPadding(8)).call(axisStyle);
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickSize(-(W - m.l - m.r))).call(axisStyle);
    const line = d3.line().x((p) => x(p.t)).y((p) => y(p.h));
    series.forEach((s, i) => {
      const c = dash.colors[i % dash.colors.length];
      svg.append('path').attr('d', line(s.v)).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
    });
    if (!narrow) {
      const ends = series.map((s, i) => ({ f: s.f, y: y(s.v[s.v.length - 1].h), c: dash.colors[i % dash.colors.length] })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      svg.append('g').selectAll('text').data(ends).join('text').attr('x', W - m.r + 6).attr('y', (d) => d.y).attr('dy', '0.35em')
        .style('fill', (d) => d.c).attr('data-trend', (d) => d.f).style('font-size', 'var(--cds-font-size-caption)').text((d) => d.f);
    } else {
      const lg = d3.select(el).append('div').attr('class', 'legend');
      series.forEach((s, i) => { const sp = lg.append('span').attr('data-trend', s.f); sp.append('i').attr('class', 'sw').style('background', dash.colors[i % dash.colors.length]); sp.append('span').text(s.f); });
    }
    el.style.minHeight = H + 'px';
  });

  dash.draw('heatmapchart', (el) => {
    el.replaceChildren();
    const data = rows('grid');
    if (!data.length) return;
    const fields = [...new Set(data.map((d) => d.field))];
    const cats = window.FF_CATS;
    const W = Math.max(300, el.clientWidth);
    const svg = d3.select(el).append('svg').attr('width', '100%');
    const lw = Math.min(W < 500 ? 110 : 190, measure(svg, fields) + 10);
    const m = { l: lw, r: 6, t: 70, b: 6 };
    const cw = (W - m.l - m.r) / cats.length, ch = 26;
    const H = m.t + m.b + fields.length * ch;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const max = Math.max(0.01, d3.max(data, (d) => Math.abs(d.heat)));
    const tip = d3.select(el).append('div').attr('class', 'tip').style('display', 'none');
    svg.append('g').selectAll('rect').data(data).join('rect')
      .attr('x', (d) => m.l + cats.indexOf(d.category) * cw + 1).attr('y', (d) => m.t + fields.indexOf(d.field) * ch + 1)
      .attr('width', cw - 2).attr('height', ch - 2).attr('rx', 3).attr('data-trend', (d) => d.field)
      .style('fill', (d) => (d.heat < 0 ? 'var(--cds-chart-status-critical)' : d.heat > 0 ? dash.colors[0] : 'var(--cds-chart-grid)'))
      .attr('fill-opacity', (d) => (d.heat === 0 ? 0.5 : 0.15 + 0.85 * Math.abs(d.heat) / max))
      .on('pointerenter pointermove', (ev, d) => {
        const [px, py] = d3.pointer(ev, el);
        tip.style('display', null).selectAll('*').remove();
        tip.append('div').attr('class', 't').text(`${d.field} · ${d.category}`);
        tip.append('div').text(`Heat ${d3.format('.2f')(d.heat)}`);
        const tw = tip.node().offsetWidth;
        tip.style('left', Math.min(Math.max(0, px + 12), el.clientWidth - tw) + 'px').style('top', (py + 12) + 'px');
      })
      .on('pointerleave', () => tip.style('display', 'none'));
    const fl = svg.append('g').selectAll('text').data(fields).join('text').attr('x', 0).attr('y', (f, i) => m.t + i * ch + ch / 2).attr('dy', '0.35em')
      .attr('fill', 'var(--color-fg-muted)').attr('data-trend', (f) => f).style('font-size', 'var(--cds-font-size-caption)').text((f) => f);
    fl.each(function () { const s = this; let t = s.textContent; while (s.getComputedTextLength() > lw - 8 && t.length > 4) { t = t.slice(0, -2); s.textContent = t + '…'; } });
    svg.append('g').selectAll('text').data(cats).join('text')
      .attr('transform', (c, i) => `translate(${m.l + i * cw + cw / 2},${m.t - 6}) rotate(-45)`)
      .attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text((c) => c);
    el.style.minHeight = H + 'px';
  });

  dash.draw('catchart', (el) => {
    el.replaceChildren();
    const data = rows('cats').slice().sort((a, b) => b.heat - a.heat);
    if (!data.length) return;
    const W = Math.max(280, el.clientWidth), rowH = 28;
    const svg = d3.select(el).append('svg').attr('width', '100%');
    const lw = measure(svg, data.map((d) => d.category)) + 12;
    const m = { l: lw, r: 44, t: 6, b: 6 };
    const H = m.t + m.b + data.length * rowH;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const lo = Math.min(0, d3.min(data, (d) => d.heat)), hi = Math.max(0.5, d3.max(data, (d) => d.heat));
    const x = d3.scaleLinear([lo, hi], [m.l, W - m.r]);
    const y = d3.scaleBand(data.map((d) => d.category), [m.t, H - m.b]).padding(0.3);
    svg.append('g').selectAll('text').data(data).join('text').attr('x', 0).attr('y', (d) => y(d.category) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)').text((d) => d.category);
    svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', m.t).attr('y2', H - m.b).attr('stroke', 'var(--cds-chart-axis)');
    svg.append('g').selectAll('rect').data(data).join('rect')
      .attr('x', (d) => x(Math.min(0, d.heat))).attr('width', (d) => Math.max(d.heat === 0 ? 0 : 2, Math.abs(x(d.heat) - x(0))))
      .attr('y', (d) => y(d.category)).attr('height', y.bandwidth()).attr('rx', 3)
      .style('fill', (d, i) => (d.heat < 0 ? 'var(--cds-chart-status-critical)' : i === 0 ? dash.colors[0] : 'var(--cds-chart-muted)'));
    svg.append('g').selectAll('text.v').data(data).join('text').attr('class', 'v')
      .attr('x', (d) => x(Math.max(0, d.heat)) + 4).attr('y', (d) => y(d.category) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)')
      .text((d) => (d.signals ? d3.format('.2f')(d.heat) : 'no data yet'));
    el.style.minHeight = H + 'px';
  });

  dash.draw('accchart', (el) => {
    el.replaceChildren();
    const data = rows('accuracy').map((d) => ({ ...d, t: new Date(d.at) }));
    if (!data.length) return;
    const W = Math.max(300, el.clientWidth), H = 200;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
    const m = { l: 40, r: 16, t: 12, b: 26 };
    const ext = d3.extent(data, (d) => d.t);
    if (+ext[0] === +ext[1]) { ext[0] = d3.utcDay.offset(ext[0], -3); ext[1] = d3.utcDay.offset(ext[1], 30); }
    const x = d3.scaleUtc(ext, [m.l, W - m.r]);
    const y = d3.scaleLinear([0, 1], [H - m.b, m.t]);
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(4).tickFormat(d3.utcFormat('%b %-d')).tickSize(0).tickPadding(8)).call(axisStyle);
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('.0%')).tickSize(-(W - m.l - m.r))).call(axisStyle);
    svg.append('path').attr('d', d3.line().x((d) => x(d.t)).y((d) => y(d.hit_rate))(data))
      .attr('fill', 'none').attr('stroke', dash.colors[0]).attr('stroke-width', 2).attr('stroke-linecap', 'round');
    svg.append('g').selectAll('circle').data(data).join('circle').attr('cx', (d) => x(d.t)).attr('cy', (d) => y(d.hit_rate)).attr('r', 4).style('fill', dash.colors[0]);
    const lastD = data[data.length - 1];
    svg.append('text').attr('x', Math.min(x(lastD.t) + 8, W - m.r - 90)).attr('y', y(lastD.hit_rate) - 8)
      .attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)').text(`${d3.format('.0%')(lastD.hit_rate)} right now`);
    el.style.minHeight = H + 'px';
  });

  dash.draw('htable', (tb) => {
    const data = rows('heat').slice().sort((a, b) => b.jobs_incoming - a.jobs_incoming);
    tb.replaceChildren();
    data.forEach((r) => {
      const tr = document.createElement('tr'); tr.dataset.key = r.field; tr.dataset.trend = r.field;
      [[r.field, 'tlink'], [d3.format('.2f')(r.heat_now), 'r'], [d3.format('.2f')(r.jobs_incoming), 'r'], [d3.format('.2f')(r.courses_incoming), 'r'], [r.outlook, '']].forEach(([v, c], i) => {
        const td = document.createElement('td'); td.textContent = v; if (c) td.className = c;
        if (i === 4) td.classList.add(r.outlook === 'Opportunity building' ? 'hot' : r.outlook === 'Crowding coming' || r.outlook === 'Cooling' ? 'cold' : 'warm');
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
  });

  dash.draw('network', (el) => {
    el.replaceChildren();
    const edges = rows('edges');
    if (!edges.length) return;
    const nodes = [...new Set(edges.flatMap((e) => [e.from, e.to]))];
    const W = Math.max(300, el.clientWidth), H = Math.min(420, Math.max(300, W * 0.7));
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
    const R = Math.max(60, Math.min(W / 2 - 85, H / 2 - 30)), cx = W / 2, cy = H / 2;
    const pos = {}; nodes.forEach((n, i) => { const a = -Math.PI / 2 + (i / nodes.length) * 2 * Math.PI; pos[n] = [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
    const col = dash.colors[0];
    svg.append('defs').append('marker').attr('id', 'ffarrow').attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M0,0L10,5L0,10z').style('fill', col);
    const tip = d3.select(el).append('div').attr('class', 'tip').style('display', 'none');
    const nr = 7;
    const edgePath = (e) => {
      const [x1, y1] = pos[e.from], [x2, y2] = pos[e.to];
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
      const sx = x1 + (dx / L) * (nr + 3), sy = y1 + (dy / L) * (nr + 3), ex = x2 - (dx / L) * (nr + 5), ey = y2 - (dy / L) * (nr + 5);
      const mx = (sx + ex) / 2 - (dy / L) * 18, my = (sy + ey) / 2 + (dx / L) * 18;
      return `M${sx},${sy}Q${mx},${my} ${ex},${ey}`;
    };
    const vis = svg.append('g').selectAll('path').data(edges).join('path').attr('d', edgePath)
      .attr('fill', 'none').attr('stroke', col).attr('stroke-opacity', (e) => 0.25 + 0.6 * e.strength)
      .attr('stroke-width', (e) => 1 + 4 * e.strength).attr('marker-end', 'url(#ffarrow)').style('pointer-events', 'none');
    svg.append('g').selectAll('path').data(edges).join('path').attr('class', 'edgehit').attr('d', edgePath)
      .attr('fill', 'none').attr('stroke', 'transparent').attr('stroke-width', 18).style('cursor', 'pointer').style('pointer-events', 'stroke')
      .on('pointerenter pointermove click', (ev, e) => {
        vis.attr('stroke-opacity', (x) => (x === e ? 1 : 0.12));
        const [px, py] = d3.pointer(ev, el);
        tip.style('display', null).selectAll('*').remove();
        tip.append('div').attr('class', 't').text(e.edge);
        const lead = e.lead_months < 1 ? 'days' : `about ${d3.format('.0f')(e.lead_months)} months`;
        tip.append('div').text(`Strength ${d3.format('.2f')(e.strength)}, lead time ${lead}`);
        tip.append('div').text(e.why);
        if (e.basis) tip.append('div').attr('class', 't').text(e.basis);
        const tw = tip.node().offsetWidth;
        tip.style('left', Math.min(Math.max(0, px + 12), el.clientWidth - tw) + 'px').style('top', (py + 12) + 'px');
      })
      .on('pointerleave', () => { tip.style('display', 'none'); vis.attr('stroke-opacity', (x) => 0.25 + 0.6 * x.strength); });
    const ng = svg.append('g').selectAll('g').data(nodes).join('g').attr('transform', (n) => `translate(${pos[n][0]},${pos[n][1]})`);
    ng.append('circle').attr('r', nr).attr('fill', 'var(--color-panel)').attr('stroke', 'var(--color-fg)').attr('stroke-width', 2);
    ng.append('text').text((n) => n).attr('text-anchor', (n) => (pos[n][0] < cx - 5 ? 'end' : pos[n][0] > cx + 5 ? 'start' : 'middle'))
      .attr('x', (n) => (pos[n][0] < cx - 5 ? -12 : pos[n][0] > cx + 5 ? 12 : 0))
      .attr('y', (n) => (Math.abs(pos[n][0] - cx) <= 5 ? (pos[n][1] < cy ? -14 : 22) : 4))
      .attr('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)');
    el.style.minHeight = H + 'px';
  });
})();
