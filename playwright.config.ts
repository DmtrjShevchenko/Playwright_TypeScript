import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
// Locally the browser window is visible by default; CI always runs headless.
// Override: HEADLESS=1 npm run test:ui   |   slow down actions: SLOWMO=500 npm run test:ui
const headless = isCI || process.env.HEADLESS === '1';
const slowMo = Number(process.env.SLOWMO ?? 0);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
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
      testDir: './tests/api',
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
