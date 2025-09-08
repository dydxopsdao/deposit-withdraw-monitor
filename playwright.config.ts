import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const envFile = process.env.CI ? ".env" : ".env.local";
dotenv.config({ path: envFile });
console.log(`> Loaded environment from ${envFile}`);

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./src/tests",

  // Initialize resources required for all tests
  globalSetup: "./global-setup.ts",

  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* We handle tracing manually in the tests */
    trace: "off"
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        launchOptions: {
          ignoreDefaultArgs: ["--enable-automation"],
          args: [
            "--disable-blink-features=AutomationControlled",
            ...(process.env.CI ? [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu",
              "--disable-infobars",
              "--disable-blink-features=AutomationControlled",
            ] : [])
          ],
        },
      },
    },
  ],
});
