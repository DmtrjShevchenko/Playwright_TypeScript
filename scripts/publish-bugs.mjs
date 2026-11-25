// Runs the full suite and publishes the generated bug reports to /BUGS.md (committed copy for README).
// Usage: npm run bugs:publish
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

const SOURCE = 'bug-reports/BUGS.md';
const TARGET = 'BUGS.md';

// Failing tests are expected while bugs exist — the exit code is not a reason to stop.
const run = spawnSync('npx', ['playwright', 'test'], {
  stdio: 'inherit',
  shell: true,
  // Published copy is read on GitHub: local attachment paths would be dead links there.
  env: { ...process.env, BUG_REPORT_PUBLISH: '1' },
});

if (!existsSync(SOURCE)) {
  console.error(`\n${SOURCE} was not generated (exit code ${run.status}). Nothing published.`);
  process.exit(1);
}
copyFileSync(SOURCE, TARGET);
console.log(`\nPublished ${SOURCE} → ${TARGET}`);
