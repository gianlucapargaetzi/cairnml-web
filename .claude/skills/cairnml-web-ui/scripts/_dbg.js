const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  const t = (await p.api('tasks.get_by_id', {task: '703333' ? (await p.api('tasks.get_all_ex', {only_fields: ['id','project'], order_by: ['-created']})).data.data.tasks[0].id : ''})).data.data.task;
  const pid = t.project.id || t.project;
  await p.go(`projects/${pid}/tasks/${t.id}/execution`, 4000); await p.mouse.click(1484, 180); await p.waitForTimeout(900); await p.shot('dbg-menu');
  console.log(await p.locator('[role=menuitem]').allInnerTexts());
  await b.close();
})();
