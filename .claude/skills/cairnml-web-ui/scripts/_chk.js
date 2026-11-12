const {chromium} = require('./node_modules/playwright');
const out = '/home/parg/Documents/mlops/ui-evidence/examples/';
require('fs').mkdirSync(out, {recursive: true});
async function open(user, w = 1600, h = 900, scheme = 'light') {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: w, height: h}, colorScheme: scheme}); const p = await ctx.newPage();
  await p.goto('http://localhost/cairnml/'); await p.waitForTimeout(2500);
  if (await p.$('#username')) { await p.fill('#username', user); await p.fill('#password', user); await p.click('#kc-login'); await p.waitForTimeout(4500); }
  p.api = (n, body = {}) => p.evaluate(async ([n, bd]) => { const r = await fetch('/cairnml/api/v2.8/' + n, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(bd), credentials: 'same-origin'}); const t = await r.text(); try { return {status: r.status, data: JSON.parse(t)}; } catch { return {status: r.status, data: t.slice(0, 200)}; } }, [n, body]);
  p.shot = (name) => p.screenshot({path: out + name + '.png'});
  p.text = async () => (await p.locator('body').innerText()).replace(/\n+/g, ' | ');
  p.go = async (path, wait = 3000) => { await p.goto('http://localhost/cairnml/' + path, {waitUntil: 'load'}); await p.waitForTimeout(wait); };
  return {b, p};
}
module.exports = {open};
