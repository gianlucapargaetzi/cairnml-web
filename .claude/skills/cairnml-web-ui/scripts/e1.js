const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01', 1600, 900);
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 300))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.go('projects/faea3b436d8444ea801852b286ce3b35/overview', 5000);
  console.log((await p.locator('[data-id=errorBoundary]').innerText().catch(() => 'no boundary')).slice(0, 300).replace(/\n/g, ' | '));
  console.log(errs.slice(0, 5).join('\n'));
  await b.close();
})();
