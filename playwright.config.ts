import { defineConfig, devices } from '@playwright/test';
import { API_URL, BASE_URL } from './src/env';

// Playwright runs the accessibility tests. Performance tests are k6 (see k6/).
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // One browser at a time locally: axe scans are memory-heavy and my PC has little free RAM.
  workers: process.env.CI ? '50%' : 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  // A full axe scan of a big page (the register form has 249 countries) can take ~20s.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'api', testDir: './tests/api', use: { baseURL: API_URL } },
    { name: 'chromium', testDir: './tests/web', use: { ...devices['Desktop Chrome'] } },
    // Small screens show a different layout (hamburger menu, filter toggle), so scan it too.
    { name: 'mobile', testDir: './tests/web', use: { ...devices['Pixel 7'] } },
  ],
});
