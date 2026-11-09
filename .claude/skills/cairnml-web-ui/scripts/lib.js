const {chromium} = require('./node_modules/playwright');
const EXE = process.env.CHROMIUM || undefined; // default: the browser Playwright installed
async function open(opts = {}) {
  const browser = await chromium.launch(EXE ? {executablePath: EXE} : {});
  const ctx = await browser.newContext({viewport: {width: opts.width || 1600, height: opts.height || 900}, storageState: 'state.json', colorScheme: opts.dark ? 'dark' : 'light'});
  const page = await ctx.newPage();
  return {browser, ctx, page};
}
async function settle(page, ms = 2500) {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(ms);
  // the first-run welcome dialog
  const start = await page.$('button:has-text("Get started")');
  if (start) { await start.click().catch(() => {}); await page.waitForTimeout(600); }
}
module.exports = {open, settle};
