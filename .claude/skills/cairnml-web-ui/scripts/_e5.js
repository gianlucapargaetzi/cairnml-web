const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const ts = (await p.api('tasks.get_all_ex', {only_fields: ['id', 'name', 'status', 'last_metrics'], order_by: ['-created']})).data.data.tasks;
  for (const t of ts.filter(t => /registry/.test(t.name) && t.status === 'failed')) console.log('delete failed attempt', t.id.slice(0, 6), (await p.api('tasks.delete', {task: t.id, force: true})).status);
  const acc = t => { const m = t.last_metrics || {}; for (const k in m) for (const v in m[k]) if (m[k][v].metric === 'accuracy' && m[k][v].variant === 'val') return m[k][v].value; };
  console.log('val acc:', ts.filter(t => t.status === 'completed' && /CIFAR/.test(t.name)).map(t => t.name.slice(0, 38) + ' = ' + acc(t)));
  await p.go('datasets');
  console.log('LIST:', (await p.text()).replace(/.*Last used/, '').slice(0, 330));
  const row = p.locator('sm-table tbody tr', {hasText: 'cairnml-dataset-registry'}).first(); await row.click(); await p.waitForTimeout(1500);
  await p.shot('e5-registry');
  console.log('PANEL:', (await p.text()).replace(/.*Git graph/, '').slice(0, 520));
  await p.locator('.mat-mdc-tab', {hasText: 'Runs'}).first().click(); await p.waitForTimeout(1800); await p.shot('e5-runs');
  console.log('RUNS:', (await p.text()).replace(/.*Created/, 'Created').slice(0, 200));
  const child = p.locator('sm-table tbody tr', {hasText: 'cifar10'}).first(); await child.click(); await p.waitForTimeout(1800); await p.shot('e5-entry');
  console.log('ENTRY:', (await p.text()).replace(/.*Git graph/, '').slice(0, 520));
  await b.close();
})();
