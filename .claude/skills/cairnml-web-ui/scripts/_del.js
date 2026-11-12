const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const ts = (await p.api('tasks.get_all_ex', {only_fields: ['id','name']})).data.data.tasks;
  for (const t of ts) console.log('delete', t.name, (await p.api('tasks.delete', {task: t.id, force: true})).status);
  await b.close();
})();
