const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  await p.go('datasets');
  console.log('LIST:', (await p.text()).replace(/.*Last used/, '').slice(0, 400));
  const row = p.locator('sm-table tbody tr', {hasText: 'greenhouse-data'}).first(); await row.click(); await p.waitForTimeout(2000);
  await p.shot('e6-dataset');
  console.log('PANEL:', (await p.text()).replace(/.*Git graph/, 'Git graph').slice(0, 700));
  for (const x of await p.locator('.sm-inline-alert button').all()) await x.click({force:true}).catch(()=>{}); await p.locator('.mat-mdc-tab', {hasText: 'Runs'}).first().click(); await p.waitForTimeout(1800); await p.shot('e6-runs');
  console.log('RUNS:', (await p.text()).replace(/.*Created/, 'Created').slice(0, 200));
  await b.close();
})();
