import { defineConfig, devices } from '@playwright/test';

// Use default production port (react-router-serve defaults to 3000)
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const baseURL = `http://localhost:${port}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright-tests',
  testMatch: /.*\.spec\.ts$/,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  /* Don't exit on first failure */
  maxFailures: undefined,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: process.env.CI
    ? [
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'Google Chrome',
          use: {
            ...devices['Desktop Chrome'],
            channel: 'chrome',
            contextOptions: {
              permissions: ['clipboard-read', 'clipboard-write'],
            },
          },
        },
      ]
    : [
        {
          name: 'Google Chrome',
          use: {
            ...devices['Desktop Chrome'],
            channel: 'chrome',
            contextOptions: {
              permissions: ['clipboard-read', 'clipboard-write'],
            },
          },
        },
      ],

  /* Run the built production server before starting the tests */
  webServer: {
    command: 'pnpm start',
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
