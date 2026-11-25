import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * Non-blocking run of tests on KNOWN product bugs (tag `@known-bug`): `npm run test:known-bugs`.
 * The tests check the correct behaviour, so they are red while the bug exists. Separate output folders keep
 * this report apart from the regression report, where any red test is a new problem.
 */
export default defineConfig({
  ...base,
  grep: /@known-bug/,
  outputDir: 'test-results-known-bugs',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-known-bugs' }],
    ['./src/reporters/bug-report.ts', { outputFile: 'bug-reports/KNOWN-BUGS.md', title: 'Відомі баги' }],
  ],
});
