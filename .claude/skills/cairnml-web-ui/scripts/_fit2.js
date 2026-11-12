const {open} = require('./_chk');
const pages = [['settings/devices', 'devices'], ['settings/access', 'access'], ['workers-and-queues/workers', 'workers'], ['workers-and-queues/queues', 'queues'], ['dashboard', 'dashboard']];
(async () => {
  for (const [w, h] of [[3440, 1440], [1600, 900], [1100, 800], [800, 700]]) {
    const {b, p} = await open('testuser01', w, h);
    for (const [route, name] of pages) {
      await p.go(route, 3500);
      const m = await p.evaluate(() => [...document.querySelectorAll('sm-table')].filter(t => t.offsetWidth).map(t => {
        const wrap = t.querySelector('.p-datatable-table-container') || t; const tb = t.querySelector('table');
        const cut = [...t.querySelectorAll('th')].filter(x => x.offsetWidth && x.scrollWidth > x.clientWidth + 1).map(x => x.dataset.colId || x.innerText.trim());
        const act = [...t.querySelectorAll('.row-actions')].some(r => r.getBoundingClientRect().right > wrap.getBoundingClientRect().right + 1);
        return {panel: Math.round(wrap.clientWidth), table: Math.round(tb.getBoundingClientRect().width), scrolls: wrap.scrollWidth > wrap.clientWidth + 1, headersCut: cut, actionsCut: act,
          cols: [...t.querySelectorAll('th')].filter(x => x.offsetWidth).map(x => (x.dataset.colId || 'x') + ':' + Math.round(x.getBoundingClientRect().width)).join(' ')};
      }));
      console.log(w, name, JSON.stringify(m));
      await p.shot(`fit2-${name}-${w}`);
    }
    await b.close();
  }
})();
