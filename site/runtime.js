// Runtime: loads the data files and provides the small `dash` API the page scripts use
// (data, calc, draw, params). Lets the same chart code run on its own website.
(() => {
  const DATASETS = ['radar', 'stages', 'forecasts', 'backtest', 'model', 'edges', 'accuracy', 'risk', 'clock', 'odds', 'briefs', 'people', 'riskinfo'];
  const DATA = {};
  const calcs = {};
  const draws = {};
  const onDatas = [];
  let params = {};
  let loaded = false;
  const errors = [];
  window.__ffErrors = errors;

  // Watchlist lives on this device only.
  const KEY = 'ff-watchlist-v1';
  const readWatch = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const writeWatch = (w) => { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) { /* private mode: keep in memory */ } };
  DATA.watchlist = readWatch();
  DATA.alerts = [];
  DATA.fit = [];

  const rowsOf = (id) => {
    if (DATA[id]) return DATA[id];
    const c = calcs[id];
    if (c) return c.fn(...c.inputs.map(rowsOf));
    return null;
  };
  const cache = {};
  const memo = (id) => {
    if (!(id in cache)) {
      try { const d = rowsOf(id); cache[id] = d == null ? { status: 'missing', data: [], message: 'Not found' } : { status: 'ok', data: d, rows: d, columns: d[0] ? Object.keys(d[0]) : [], refreshing: false, meta: [] }; }
      catch (e) { errors.push(`${id}: ${e.message}`); cache[id] = { status: 'error', data: [], message: e.message }; }
    }
    return cache[id];
  };

  const runOne = (name) => {
    const f = draws[name]; if (!f) return;
    document.querySelectorAll(`[data-draw="${name}"]`).forEach((el) => {
      if (el.closest('[hidden]')) return;
      try {
        if (typeof f === 'function') f(el);
        else { if (!el.__ffMade) el.__ffMade = { v: f.mount ? f.mount(el) : undefined }; if (f.update) f.update(el, el.__ffMade.v); }
      } catch (e) { errors.push(`draw ${name}: ${e.message}`); console.error(e); }
    });
  };
  const runAll = () => {
    if (!loaded) return;
    onDatas.forEach((fn) => { try { fn(); } catch (e) { errors.push(`onData: ${e.message}`); } });
    Object.keys(draws).forEach(runOne);
    if (window.ffAfterRun) window.ffAfterRun();
  };
  const refreshAll = () => { for (const k in cache) delete cache[k]; runAll(); };

  window.dash = {
    data: (id) => (loaded ? memo(id) : { status: 'loading', data: [], rows: [], refreshing: false, meta: [] }),
    calc: (id, o) => { calcs[id] = o; },
    loader: () => {},
    colors: ['#2c6fbb', '#d1793a', '#3a9a6a', '#8a5cc2', '#c2456b', '#3f9fb3', '#a08a24', '#6f6f6f'],
    refresh: () => {},
    setLink: (id) => { try { history.replaceState(null, '', `#${id}`); } catch (e) { /* ignore */ } },
    params: () => ({ ...params }),
    setParams: (o) => { for (const k in o) { if (o[k] == null) delete params[k]; else params[k] = o[k]; } runAll(); },
    resetParams: () => { params = {}; runAll(); },
    onData: (fn) => { onDatas.push(fn); if (loaded) fn(); },
    draw: (name, fn) => { if (fn === undefined) { runOne(name); return; } draws[name] = fn; },
  };

  window.ffWatch = {
    has: (field) => DATA.watchlist.some((w) => w.field === field),
    toggle: (field) => {
      if (!field) return;
      if (window.ffWatch.has(field)) DATA.watchlist = DATA.watchlist.filter((w) => w.field !== field);
      else {
        const m = (memo('map').data || []).find((r) => r.field === field) || {};
        DATA.watchlist = DATA.watchlist.concat([{ field, since: new Date().toISOString().slice(0, 10), base_heat: m.heat_pts ?? 0, base_stage: m.stage ?? 1, base_zone: m.zone || 'Get in early', base_signals: m.signals ?? 0 }]);
      }
      writeWatch(DATA.watchlist);
      refreshAll();
    },
  };

  const start = async () => {
    const stamp = Date.now();
    const results = await Promise.all(DATASETS.map((id) => fetch(`data/${id}.json?t=${stamp}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
    results.forEach((d, i) => { DATA[DATASETS[i]] = d || []; });
    try { const m = await fetch(`data/updated.json?t=${stamp}`).then((r) => (r.ok ? r.json() : null)); if (m && m.at) window.ffUpdated = m.at; } catch (e) { /* optional */ }
    loaded = true;
    new MutationObserver((ms) => { if (ms.some((x) => x.attributeName === 'hidden')) runAll(); })
      .observe(document.getElementById('dash-root'), { attributes: true, subtree: true, attributeFilter: ['hidden'] });
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(runAll, 150); });
    runAll();
  };
  window.ffStart = start;
})();
