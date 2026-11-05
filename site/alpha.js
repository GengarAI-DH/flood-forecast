// Alpha extras: the ☆ Watch button on each trend.
(() => {
  const sync = () => {
    const f = dash.params().trend;
    document.querySelectorAll('.ff .starbtn').forEach((b) => {
      const on = !!f && window.ffWatch.has(f);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? '★ Watching' : '☆ Watch';
    });
  };
  window.ffAfterRun = sync;
  document.querySelectorAll('.ff .starbtn').forEach((b) => b.addEventListener('click', () => {
    window.ffWatch.toggle(dash.params().trend);
  }));
  window.ffStart();
})();
