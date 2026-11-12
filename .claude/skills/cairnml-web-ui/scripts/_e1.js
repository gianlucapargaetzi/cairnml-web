const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const ts = (await p.api('tasks.get_all_ex', {only_fields: ['id','name','status','project'], order_by: ['created']})).data.data.tasks;
  const pid = ts[0].project.id || ts[0].project;
  await p.go(`projects/${pid}/tasks`); console.log('LIST:', (await p.text()).slice(0, 300)); await p.shot('e1-list');
  for (const [i, t] of ts.entries()) {
    await p.go(`projects/${pid}/tasks/${t.id}/execution`); const tx = await p.text();
    console.log(`TASK${i} execution:`, /Uncommitted changes/.test(tx), /gauss\(0\.0, 0\.1\)|0\.1/.test(tx), /cairnml-examples/.test(tx), /Access refused|Read with|No credential|None needed/.exec(tx)?.[0]);
    await p.shot(`e1-exec-${i}`);
  }
  await p.go(`projects/${pid}/tasks/${ts[1].id}/hyper-params/hyperparams`); console.log('PARAMS:', (await p.text()).replace(/.*Configuration/,'').slice(0, 260));
  await p.go(`projects/${pid}/tasks/${ts[1].id}/output/log`); await p.go(`projects/${pid}/tasks/${ts[1].id}/info-output/metrics/scalar`); await p.shot('e1-scalars');
  await p.go(`projects/${pid}/tasks/${ts[1].id}/artifacts/output`); console.log('ARTIFACTS:', (await p.text()).includes('hello')); await p.shot('e1-artifacts');
  await p.go('datasets'); console.log('REPOS:', (await p.text()).slice(0, 320)); 
  await p.locator('sm-table tbody tr').first().click(); await p.waitForTimeout(1500); console.log('PANEL:', (await p.text()).slice(0, 700)); await p.shot('e1-repos');
  await b.close();
})();
