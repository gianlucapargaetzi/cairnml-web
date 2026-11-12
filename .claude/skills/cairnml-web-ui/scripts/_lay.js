const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01', 1100, 900);
  await p.go('datasets');
  await p.locator('sm-table tbody tr', {hasText: 'greenhouse-data'}).first().click(); await p.waitForTimeout(1500);
  console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('sm-table')].map(t => {
    const tb = t.querySelector('table'); const cs = getComputedStyle(tb); const wrap = tb.parentElement; const w2 = getComputedStyle(wrap);
    return {cls: t.className, tableW: Math.round(tb.getBoundingClientRect().width), layout: cs.tableLayout, wrapOverflowX: w2.overflowX, wrapW: Math.round(wrap.getBoundingClientRect().width), ths: [...t.querySelectorAll('th')].map(h => h.dataset.colId + ':' + Math.round(h.getBoundingClientRect().width)).join(' ')};
  })), null, 1));
  await b.close();
})();
