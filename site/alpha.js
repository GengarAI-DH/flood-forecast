// Alpha extras: watch buttons. Watching lives on this device only.
(() => {
  // A small + / ✓ button. + adds to Watched. ✓ asks before removing.
  window.ffWatchBtn = (field) => {
    const wrap = document.createElement('span'); wrap.className = 'wbtnwrap';
    wrap.addEventListener('click', (ev) => ev.stopPropagation());
    const draw = () => {
      wrap.replaceChildren();
      const on = window.ffWatch.has(field);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'wplus' + (on ? ' on' : '');
      b.textContent = on ? '✓' : '+';
      b.setAttribute('aria-label', on ? `Watching ${field}. Tap to remove` : `Add ${field} to Watched`);
      b.title = on ? 'Watching. Tap to remove' : 'Add to Watched';
      b.addEventListener('click', () => { if (on) ask(); else window.ffWatch.toggle(field); });
      wrap.appendChild(b);
    };
    const ask = () => {
      wrap.replaceChildren();
      const q = document.createElement('span'); q.className = 'wask'; q.textContent = 'Remove?'; wrap.appendChild(q);
      const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'wyes'; yes.textContent = 'Remove';
      yes.addEventListener('click', () => window.ffWatch.toggle(field));
      const no = document.createElement('button'); no.type = 'button'; no.className = 'wno'; no.textContent = 'Keep';
      no.addEventListener('click', draw);
      wrap.append(yes, no); no.focus();
    };
    draw();
    return wrap;
  };

  // The big button on a trend's detail card.
  let confirming = false;
  const sync = () => {
    const f = dash.params().trend;
    document.querySelectorAll('.ff .starbtn').forEach((b) => {
      const on = !!f && window.ffWatch.has(f);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? (confirming ? 'Yes, remove from Watched' : '✓ Watching') : '+ Add to Watched';
      b.classList.toggle('confirm', on && confirming);
      let keep = b.nextElementSibling && b.nextElementSibling.classList.contains('starkeep') ? b.nextElementSibling : null;
      if (on && confirming && !keep) {
        keep = document.createElement('button'); keep.type = 'button'; keep.className = 'starkeep'; keep.textContent = 'Keep';
        keep.addEventListener('click', () => { confirming = false; sync(); });
        b.after(keep);
      } else if (!(on && confirming) && keep) keep.remove();
    });
  };
  window.ffAfterRun = () => { confirming = false; sync(); };
  document.querySelectorAll('.ff .starbtn').forEach((b) => b.addEventListener('click', () => {
    const f = dash.params().trend; if (!f) return;
    if (window.ffWatch.has(f) && !confirming) { confirming = true; sync(); return; }
    confirming = false;
    window.ffWatch.toggle(f);
  }));
  window.ffStart();
})();
