const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const vis = async (pg, sel) => { for (const h of await pg.$$(sel)) { const bb = await h.boundingBox(); if (bb && bb.width > 0) return h; } return null; };
  const out = [];
  for (const vp of [{ w: 390, h: 844, n: 'phone' }, { w: 1280, h: 900, n: 'desk' }]) {
    const pg = await b.newPage({ viewport: { width: vp.w, height: vp.h } });
    const cons = []; pg.on('console', m => { if (m.type() === 'error') cons.push(m.text()); }); pg.on('pageerror', e => cons.push('pageerror ' + e.message));
    await pg.goto('file://' + __dirname + '/harness.html');
    await pg.waitForTimeout(400);
    const log = (s) => out.push(`[${vp.n}] ${s}`);
    log('unknown draws: ' + JSON.stringify(await pg.evaluate(() => __unknownDraws())));
    const hscroll = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    log('horizontal overflow: ' + hscroll);
    await pg.screenshot({ path: `${vp.n}-overview.png`, fullPage: true });
    // info buttons on overview
    const infos = await pg.$$('#overview .infobtn'); for (const i of infos) await i.click();
    log('overview infos opened: ' + (await pg.$$eval('#overview .info:not([hidden])', e => e.length)) + '/' + infos.length);
    // bubble click
    const bub = await vis(pg, '#glance g[data-trend]'); 
    if (bub) { await bub.click({ force: true }); await pg.waitForTimeout(200); log('trend detail open: ' + await pg.$eval('#trenddetail', e => !e.hidden) + ' name=' + await pg.$eval('#trenddetail .dname', e => e.textContent)); 
      log('detail why: ' + (await pg.$eval('[data-draw=tdwhy]', e => e.textContent)).slice(0, 60)); log('signals listed: ' + await pg.$$eval('[data-draw=tdsignals] li', e => e.length)); }
    else log('NO bubble found');
    // zoom
    await pg.click('.zbtn[data-zoom=in]'); await pg.waitForTimeout(400); await pg.click('.zbtn[data-zoom=in]'); await pg.waitForTimeout(400);
    const satsVis = await pg.$$eval('#glance g[data-trend]', gs => gs.filter(g => g.getAttribute('display') !== 'none' && g.getBoundingClientRect().width > 0).length);
    log('after zoom, visible groups: ' + satsVis);
    await pg.screenshot({ path: `${vp.n}-zoomed.png` , clip: await (await pg.$('#glance')).boundingBox() });
    await pg.click('.zbtn[data-zoom=out]'); await pg.waitForTimeout(350); await pg.click('.zbtn[data-zoom=reset]'); await pg.waitForTimeout(350);
    // lens
    await pg.click('.zoombar .lensbtn'); await pg.waitForTimeout(200); log('lens pressed: ' + await pg.$eval('.zoombar .lensbtn', e => e.getAttribute('aria-pressed')));
    await pg.click('.zoombar .lensbtn');
    // lookup select
    const opts = await pg.$$eval('#tdpick option', o => o.length); log('lookup options: ' + opts);
    await pg.selectOption('#tdpick', { index: 3 }); await pg.waitForTimeout(150); log('lookup picked: ' + await pg.$eval('#trenddetail .dname', e => e.textContent));
    // close
    await pg.click('#trenddetail .closebtn'); log('closed: ' + await pg.$eval('#trenddetail', e => e.hidden));
    // digest + foryou clicks
    log('digest items: ' + await pg.$$eval('[data-draw=digestlist] li', e => e.length) + ', foryou: ' + await pg.$$eval('[data-draw=foryoulist] li', e => e.length));
    await (await vis(pg,'[data-draw=foryoulist] [data-trend]')).click(); log('foryou click opens: ' + await pg.$eval('#trenddetail', e => !e.hidden));
    log('tdfit: ' + (await pg.$eval('[data-draw=tdfit]', e => e.textContent)).slice(0, 40));
    await pg.click('#trenddetail .closebtn');
    // tabs
    for (const t of ['watched', 'trends', 'risk', 'model', 'overview']) {
      await pg.click(`.tab[data-tab=${t}]`); await pg.waitForTimeout(250);
      const shown = await pg.$eval('#' + t, e => !e.hidden);
      const empties = await pg.$$eval(`#${t} .chart`, cs => cs.filter(c => !c.querySelector('svg')).map(c => c.dataset.draw));
      log(`tab ${t}: visible=${shown} emptyCharts=${JSON.stringify(empties)}`);
      if (t !== 'overview') await pg.screenshot({ path: `${vp.n}-${t}.png`, fullPage: true });
      const ii = await pg.$$(`#${t} .infobtn`); for (const i of ii) await i.click();
      const opened = await pg.$$eval(`#${t} .info:not([hidden])`, e => e.length); log(`  infos ${opened}/${ii.length}`);
      for (const i of ii) await i.click();
      if (t === 'watched') { log('  watch cards: ' + await pg.$$eval('.wcard', e => e.length)); await (await vis(pg,'.wcard [data-trend]')).click(); log('  card opens detail: ' + await pg.$eval('#trenddetail', e => !e.hidden)); await pg.click('#trenddetail .closebtn'); }
      if (t === 'trends') {
        const kp = await vis(pg, '#keypeople [data-person]'); if (kp) { await kp.click(); await pg.waitForTimeout(150); log('  person open: ' + await pg.$eval('#persondetail', e => !e.hidden) + ' ' + await pg.$eval('#persondetail .dname', e => e.textContent) + ' signals=' + await pg.$$eval('[data-draw=pdsignals] li', e => e.length));
          const chip = await vis(pg, '[data-draw=pdtrends] [data-trend]'); if (chip) { await chip.click(); log('  person->trend chip: ' + await pg.$eval('#trenddetail', e => !e.hidden) + ' person hidden=' + await pg.$eval('#persondetail', e => e.hidden)); }
          await pg.click('#trenddetail .closebtn'); } else log('  NO person cells');
        const hm = await vis(pg, '#heatmap rect[data-trend]'); if (hm) { await hm.click({ force: true }); log('  heatmap cell opens: ' + await pg.$eval('#trenddetail', e => !e.hidden)); await pg.click('#trenddetail .closebtn'); }
        const rr = await vis(pg, '#radar td[data-trend]'); if (rr) { await rr.click(); log('  radar row opens: ' + await pg.$eval('#trenddetail', e => !e.hidden)); await pg.click('#trenddetail .closebtn'); }
        const tl = await pg.$('#trendcard [data-trend]'); log('  trend line labels clickable: ' + !!tl);
      }
      if (t === 'risk') {
        const bars = await pg.$$('#doom rect[data-risk]'); log('  risk clickables: ' + bars.length);
        if (bars.length) { await bars[bars.length - 1].click({ force: true }); await pg.waitForTimeout(150); log('  risk open: ' + await pg.$eval('#riskdetail', e => !e.hidden) + ' ' + await pg.$eval('#riskdetail .dname', e => e.textContent) + ' odds=' + await pg.$$eval('[data-draw=rdodds] li', e => e.length)); await pg.click('#riskdetail .closebtn'); }
        const arrowsClickable = await pg.$$eval('#doom text.n', t => t.filter(x => x.hasAttribute('data-risk')).length + '/' + t.length); log('  risk value/arrow labels clickable: ' + arrowsClickable);
        log('  consensus rows: ' + await pg.$$eval('[data-draw=ctable] tr', e => e.length));
      }
      if (t === 'model') {
        const edges = await pg.$$('#network path.edgehit'); log('  network arrows: ' + edges.length);
        if (edges.length) { await pg.$eval('#network', e => e.scrollIntoView({block:'center'})); await pg.waitForTimeout(100); const bb = await edges[0].boundingBox(); log('  arrow0 box ' + JSON.stringify(bb)); const tot = await edges[0].evaluate(p => { const L = p.getTotalLength(); const pt = p.getPointAtLength(L/2); const r = p.ownerSVGElement.getBoundingClientRect(); const vb = p.ownerSVGElement.viewBox.baseVal; return { x: r.left + pt.x * r.width / vb.width, y: r.top + pt.y * r.height / vb.height }; }); await pg.mouse.click(tot.x, tot.y); await pg.waitForTimeout(100); log('  arrow tooltip shown: ' + await pg.$eval('#network .tip', e => e.style.display !== 'none')); }
      }
    }
    await pg.click('.tab[data-tab=overview]');
    await pg.fill('#ffsearch', 'oil'); await pg.waitForTimeout(150);
    log('search "oil": ' + JSON.stringify(await pg.$$eval('#ffsugg .sg', l => l.map(x => x.querySelector('.sgk').textContent + ':' + x.querySelector('.sgn').textContent))));
    await pg.fill('#ffsearch', 'mus'); await pg.waitForTimeout(150);
    log('search "mus": ' + JSON.stringify(await pg.$$eval('#ffsugg .sg', l => l.map(x => x.querySelector('.sgk').textContent + ':' + x.querySelector('.sgn').textContent))));
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(150);
    log('enter opens person: ' + await pg.$eval('#persondetail', e => !e.hidden) + ' ' + await pg.$eval('#persondetail .dname', e => e.textContent));
    await pg.fill('#ffsearch', 'nuc'); await pg.waitForTimeout(150);
    const first = await pg.$('#ffsugg .sg'); await first.dispatchEvent('pointerdown'); await pg.waitForTimeout(150);
    log('tap opens risk: ' + await pg.$eval('#riskdetail', e => !e.hidden) + ' ' + await pg.$eval('#riskdetail .dname', e => e.textContent));
    await pg.fill('#ffsearch', 'gold'); await pg.waitForTimeout(150); if (vp.n==='phone') await pg.screenshot({ path: 'phone-search.png', clip: { x: 0, y: 0, width: 390, height: 560 } });
    log('errors: ' + JSON.stringify(await pg.evaluate(() => __errors)) + ' console: ' + JSON.stringify(cons));
    await pg.close();
  }
  console.log(out.join('\n'));
  await b.close();
})();
