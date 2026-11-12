const {open} = require('./_chk');
(async () => {
  const {b, p} = await open('testuser01');
  await p.go('projects'); console.log('PROJECTS:', (await p.text()).slice(0, 260)); await p.shot('e0-projects');
  await p.go('datasets'); console.log('REPOS:', (await p.text()).slice(0, 260)); await p.shot('e0-repos');
  await p.go('settings/access'); console.log('ACCESS:', (await p.text()).slice(0, 300)); await p.shot('e0-access');
  await p.go('settings/devices'); console.log('DEVICES:', (await p.text()).slice(0, 300)); await p.shot('e0-devices');
  const nav = await p.locator('nav, sm-side-nav, .side-nav').first().innerText().catch(() => ''); console.log('NAV:', nav.replace(/\n+/g, ' | '));
  await b.close();
})();
