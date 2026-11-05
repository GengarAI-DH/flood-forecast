// Interaction: tabs, info buttons, detail panels, zoom and lens buttons.
(() => {
  const tabs = document.querySelectorAll('.ff .tab');
  const pages = document.querySelectorAll('.ff .page');
  const show = (id, scroll) => {
    if (![...pages].some((p) => p.id === id)) return;
    pages.forEach((p) => { p.hidden = p.id !== id; });
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    dash.setLink(id);
    if (scroll) document.querySelector('.ff .tabs').scrollIntoView({ block: 'start' });
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab, true)));
  const fromLink = location.hash.slice(1);
  if (fromLink) show(fromLink, false);
})();

document.querySelectorAll('.ff .infobtn').forEach((b) => {
  b.addEventListener('click', () => {
    const panel = b.closest('.card').querySelector('.info');
    if (!panel) return;
    const open = panel.hidden;
    panel.hidden = !open;
    b.setAttribute('aria-expanded', String(open));
  });
});

(() => {
  const card = document.getElementById('trenddetail');
  const cards = { trend: card, person: document.getElementById('persondetail'), risk: document.getElementById('riskdetail') };
  const open = (kind, name) => {
    if (!name || !cards[kind]) return;
    Object.entries(cards).forEach(([k, c]) => { if (c) c.hidden = k !== kind; });
    dash.setParams({ trend: kind === 'trend' ? name : null, person: kind === 'person' ? name : null, risk: kind === 'risk' ? name : null });
    cards[kind].scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  window.ffPick = (name) => open('trend', name);
  window.ffOpen = open;
  document.querySelector('.ff').addEventListener('click', (ev) => {
    if (ev.target.closest('a')) return;
    const el = ev.target.closest('[data-trend],[data-person],[data-risk]');
    if (!el) return;
    if (el.hasAttribute('data-person')) open('person', el.getAttribute('data-person'));
    else if (el.hasAttribute('data-risk')) open('risk', el.getAttribute('data-risk'));
    else open('trend', el.getAttribute('data-trend'));
  });
  document.querySelectorAll('.ff .closebtn').forEach((b) => b.addEventListener('click', () => {
    Object.values(cards).forEach((c) => { if (c) c.hidden = true; });
    dash.setParams({ trend: null, person: null, risk: null });
  }));
})();

(() => {
  document.querySelectorAll('.ff .sw.cat').forEach((s) => {
    const i = Math.max(0, (window.FF_CATS || []).indexOf(s.dataset.cat));
    s.style.background = dash.colors[i % dash.colors.length];
  });
  document.querySelectorAll('.ff .zbtn').forEach((b) => b.addEventListener('click', () => {
    const z = window.ffZoom; if (!z) return;
    const t = z.svg.transition().duration(300);
    if (b.dataset.zoom === 'in') z.zoom.scaleBy(t, 1.6);
    else if (b.dataset.zoom === 'out') z.zoom.scaleBy(t, 1 / 1.6);
    else z.zoom.transform(t, d3.zoomIdentity);
  }));
})();

document.querySelectorAll('.ff .lensbtn').forEach((b) => b.addEventListener('click', () => {
  const on = dash.params().lens === 'me';
  dash.setParams({ lens: on ? null : 'me' });
  document.querySelectorAll('.ff .lensbtn').forEach((x) => x.setAttribute('aria-pressed', String(!on)));
  if (!on) { const g = document.getElementById('glance'); if (g) g.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
}));
