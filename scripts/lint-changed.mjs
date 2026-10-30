// Fails when a pull request adds ESLint errors to the files it changes.
//
// The repository has a large lint backlog, so the gate does not require a clean lint.
// For each changed file, the number of errors per rule is counted on the base commit and on
// the head commit. The check fails when a rule has more errors on the head than on the base.
//
// Usage: node scripts/lint-changed.mjs <base-checkout-dir> <file>...
// Paths are relative to the repository root. Files that do not exist on the base are new,
// so every error in them counts as new. The base checkout must have node_modules available.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const headRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [baseRoot, ...files] = process.argv.slice(2);

if (!baseRoot) {
  console.error('usage: node scripts/lint-changed.mjs <base-checkout-dir> <file>...');
  process.exit(2);
}

if (files.length === 0) {
  console.log('No changed TypeScript or HTML files to lint.');
  process.exit(0);
}

function lint(root, relativeFiles) {
  const existing = relativeFiles.filter((file) => existsSync(join(root, file)));
  if (existing.length === 0) {
    return [];
  }
  const eslintBin = join(headRoot, 'node_modules', '.bin', 'eslint');
  const run = spawnSync(eslintBin, ['--format', 'json', '--no-warn-ignored', ...existing], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (run.error || !run.stdout) {
    console.error(`ESLint failed in ${root}: ${run.error ?? run.stderr}`);
    process.exit(2);
  }
  return JSON.parse(run.stdout);
}

// Counts the errors per "file | rule" key. Warnings are not counted.
function countErrors(root, results) {
  const counts = new Map();
  for (const result of results) {
    const file = relative(root, result.filePath);
    for (const message of result.messages) {
      if (message.severity !== 2) {
        continue;
      }
      const key = `${file} | ${message.ruleId ?? 'parse'}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

const head = countErrors(headRoot, lint(headRoot, files));
const base = countErrors(baseRoot, lint(baseRoot, files));

const regressions = [];
for (const [key, count] of head) {
  const before = base.get(key) ?? 0;
  if (count > before) {
    regressions.push({ key, before, after: count });
  }
}

const headTotal = [...head.values()].reduce((sum, n) => sum + n, 0);
const baseTotal = [...base.values()].reduce((sum, n) => sum + n, 0);
console.log(`Changed files: ${files.length}. ESLint errors in them: ${baseTotal} on base, ${headTotal} on head.`);

if (regressions.length > 0) {
  console.error('New ESLint errors in changed files (file | rule: base -> head):');
  for (const { key, before, after } of regressions) {
    console.error(`  ${key}: ${before} -> ${after}`);
  }
  console.error('Fix the new errors in the files this change touches.');
  process.exit(1);
}

console.log('No new ESLint errors in the changed files.');
