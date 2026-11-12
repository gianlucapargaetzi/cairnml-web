const {chromium} = require('./node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.goto(process.argv[2]); await p.waitForTimeout(2500);
  console.log('url', p.url().replace(/\?.*/,''), await p.title());
  if (await p.$('#username')) { await p.fill('#username', process.argv[3]); await p.fill('#password', process.argv[3]); await p.click('#kc-login'); await p.waitForTimeout(3000); }
  console.log('url2', p.url().replace(/\?.*/,''));
  console.log((await p.locator('body').innerText()).slice(0, 300).replace(/\n+/g,' | '));
  const btn = p.getByRole('button', {name: /yes|confirm|continue|submit|sign in/i}).first();
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(2500); console.log('after', (await p.locator('body').innerText()).slice(0,200).replace(/\n+/g,' | ')); }
  await b.close();
})();
