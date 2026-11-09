const {chromium} = require('./node_modules/playwright');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync(process.env.CAIRNML_ENV || require('path').join(__dirname, '../../../../../cairnml-server/deploy/.env'),'utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')), l.slice(l.indexOf('=')+1)]));
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
  const ctx = await browser.newContext({viewport:{width:1600,height:900}});
  const page = await ctx.newPage();
  await page.goto('http://localhost/cairnml/', {waitUntil:'load'});
  await page.waitForTimeout(3000);
  console.log('url after load:', page.url().replace(/\?.*/,''));
  const user = await page.$('#username'); 
  if (user) {
    await page.fill('#username', env.KC_ADMIN || 'cairnadmin');
    await page.fill('#password', env.CAIRNML_ADMIN_PASSWORD);
    await page.click('#kc-login');
    await page.waitForTimeout(5000);
  }
  console.log('url after login:', page.url().replace(/\?.*/,''));
  await ctx.storageState({path: 'state.json'});
  await page.screenshot({path:'dashboard.png'});
  await browser.close();
})().catch(e => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
