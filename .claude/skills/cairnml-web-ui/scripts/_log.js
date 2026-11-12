const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const id = (await p.api('tasks.get_all_ex', {id: [process.argv[2]]})).data.data.tasks[0].id;
  const r = (await p.api('events.get_task_log', {task: id, batch_size: 500, order: 'desc'})).data.data.events || [];
  console.log(r.reverse().map(e => e.msg).join('\n').slice(-3500));
  await b.close();
})();
