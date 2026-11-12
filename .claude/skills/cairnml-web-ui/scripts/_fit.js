const {open} = require('./_chk');
(async () => {
  for (const [w, h] of [[3440, 1440], [1920, 1080], [1600, 900], [1280, 800], [1024, 768]]) {
    const {b, p} = await open('testuser01', w, h);
    await p.go('datasets');
    await p.locator('sm-table tbody tr', {hasText: 'greenhouse-data'}).first().click(); await p.waitForTimeout(2000);
    const m = await p.evaluate(() => [...document.querySelectorAll('sm-table')].map(t => {
      const tb = t.querySelector('table'); const wrap = t.querySelector('.p-datatable-table-container') || tb.parentElement;
      const ths = [...t.querySelectorAll('th[data-col-id], th')].filter(x => x.offsetWidth);
      return {panel: Math.round(wrap.clientWidth), table: Math.round(tb.getBoundingClientRect().width), scrolls: wrap.scrollWidth > wrap.clientWidth + 1,
        cols: ths.map(x => (x.dataset.colId || x.innerText.trim() || 'x') + ':' + Math.round(x.getBoundingClientRect().width) + (x.scrollWidth > x.clientWidth + 1 ? '!' : '')).join(' '),
        cut: [...t.querySelectorAll('.row-actions')].some(r => r.getBoundingClientRect().right > wrap.getBoundingClientRect().right + 1)};
    }));
    console.log(w, JSON.stringify(m));
    await p.shot('fit-' + w); await b.close();
  }
})();
