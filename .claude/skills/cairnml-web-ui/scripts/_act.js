const {open} = require('./_chk');
(async () => {
  for (const w of [1600, 1100]) {
    const {b, p} = await open('testuser01', w, 900);
    await p.go('datasets');
    await p.locator('sm-table tbody tr', {hasText: 'greenhouse-data'}).first().click(); await p.waitForTimeout(1500);
    const m = await p.evaluate(() => [...document.querySelectorAll('.row-actions')].map(r => {
      const rr = r.getBoundingClientRect(); const bs = [...r.querySelectorAll('button')].map(x => x.getBoundingClientRect());
      const cell = r.closest('td,th,[role=cell]')?.getBoundingClientRect(); const tbl = r.closest('sm-table')?.getBoundingClientRect();
      return {btn: bs.map(x => Math.round(x.width) + 'x' + Math.round(x.height)), gaps: bs.slice(1).map((x, i) => Math.round(x.left - bs[i].right)),
        cutRight: cell ? Math.round(rr.right - cell.right) : null, tblRight: tbl ? Math.round(tbl.right) : null, rowRight: Math.round(rr.right)};
    }));
    console.log(w, JSON.stringify(m));
    await p.shot('actions-' + w); await b.close();
  }
})();
