// Fails when a generated API service method has no caller in src/app.
// A method counts as used when its name appears in a file other than the service that defines it.
// Run from the repository root: node scripts/check-unused-api-methods.mjs
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';

const services = execFileSync('git', ['ls-files', 'src/app/business-logic/api-services/*.service.ts'], {encoding: 'utf8'})
  .split('\n').filter(f => f && existsSync(f));
const sources = execFileSync('git', ['ls-files', 'src/app'], {encoding: 'utf8'})
  .split('\n').filter(f => /\.(ts|html)$/.test(f) && existsSync(f));

const unused = [];
for (const service of services) {
  const methods = [...readFileSync(service, 'utf8').matchAll(/public (\w+)\(/g)].map(m => m[1]);
  const others = sources.filter(f => f !== service).map(f => ({path: f, text: readFileSync(f, 'utf8')}));
  for (const method of methods) {
    const pattern = new RegExp(`\\b${method}\\b`);
    if (!others.some(o => pattern.test(o.text))) {
      unused.push(`${service}: ${method}`);
    }
  }
}

if (unused.length) {
  console.error(`Generated API methods without a caller (${unused.length}):`);
  for (const line of unused) console.error(`  ${line}`);
  console.error('Delete the method and its model files, or add a caller.');
  process.exit(1);
}
console.log('Every generated API method has a caller.');
