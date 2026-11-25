import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
// Locally the browser window is visible by default; CI always runs headless.
// Override: HEADLESS=1 npm run test:ui
const headless = isCI || process.env.HEADLESS === '1';
// Manual (headed) runs are slowed down so a person can follow each action; headless/CI runs at full speed.
// Override: SLOWMO=800 (slower) | SLOWMO=0 (off, even when headed)
const DEFAULT_MANUAL_SLOWMO_MS = 300;
const slowMo = Number(process.env.SLOWMO ?? (headless ? 0 : DEFAULT_MANUAL_SLOWMO_MS));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // Turns failed tests into Markdown bug reports (see src/reporters/bug-report.ts).
    ['./src/reporters/bug-report.ts', { outputFile: 'bug-reports/BUGS.md' }],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui',
      // Projects share the top-level testDir and are split by testMatch (not per-project testDir):
      // IntelliJ's Playwright runner otherwise resolves every file against the last project's testDir.
      testMatch: 'ui/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless,
        launchOptions: { slowMo },
        baseURL: process.env.UI_BASE_URL ?? 'https://www.saucedemo.com',
        // SauceDemo exposes stable `data-test` attributes on every interactive element.
        testIdAttribute: 'data-test',
      },
    },
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
      use: {
        baseURL: process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com',
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
  ],
});
