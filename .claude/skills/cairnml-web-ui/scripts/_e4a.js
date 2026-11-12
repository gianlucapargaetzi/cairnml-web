const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  for (const id of ['742b40', '1b33a7', 'ae94f9', '0c6031']) {
    const t = (await p.api('tasks.get_all_ex', {only_fields: ['id']})).data.data.tasks.find(x => x.id.startsWith(id));
    if (t) { await p.api('tasks.stop', {task: t.id, force: true}); console.log('del', id, (await p.api('tasks.delete', {task: t.id, force: true})).status); }
  }
  await p.go('workers-and-queues/workers'); console.log('WORKERS:', (await p.text()).slice(0, 360)); await p.shot('e4-workers');
  await p.go('workers-and-queues/queues'); console.log('QUEUES:', (await p.text()).slice(0, 360)); await p.shot('e4-queues');
  const t = (await p.api('tasks.get_all_ex', {only_fields: ['id','project','name','status'], order_by: ['-created']})).data.data.tasks.find(x => x.id.startsWith('160ac9'));
  const pid = t.project.id || t.project;
  await p.go(`projects/${pid}/tasks/${t.id}/execution`, 3500); const tx = await p.text();
  console.log('EXEC:', /cairnml-private-demo/.test(tx), /938f51a/.test(tx), (/Read with[^|]*|No credential assigned|Access refused/.exec(tx) || [''])[0]); await p.shot('e4-exec');
  await p.go(`projects/${pid}/tasks/${t.id}/output/log`, 3500); const lg = await p.text(); console.log('LOG has clone:', /clon/i.test(lg), 'epoch lines:', (lg.match(/epoch/gi) || []).length); await p.shot('e4-console');
  await b.close();
})();
