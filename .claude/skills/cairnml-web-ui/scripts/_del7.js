const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const ts = (await p.api('tasks.get_all_ex', {only_fields: ['id','name','status'], search_text: 'greenhouse workflow'})).data.data.tasks;
  for (const t of ts.filter(t => /#2$/.test(t.name) && t.status !== 'completed')) console.log(t.name, (await p.api('tasks.delete', {task: t.id, force: true})).status);
  await b.close();
})();
