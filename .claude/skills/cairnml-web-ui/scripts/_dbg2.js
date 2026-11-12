const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01', 1280, 800);
  await p.go('datasets'); await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => { const th = document.querySelector('th[data-col-id="short_id"]'); return th ? th.outerHTML.slice(0, 900) + ' || ' + getComputedStyle(th).paddingLeft + ' ' + getComputedStyle(th).paddingRight + ' cls=' + document.querySelector('sm-table p-table, sm-table .p-datatable').className : 'no th'; }));
  await b.close();
})();
