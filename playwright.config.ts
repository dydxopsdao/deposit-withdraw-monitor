import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envFile = process.env.CI ? ".env" : ".env.local";
dotenv.config({ path: envFile });
console.log(`> Loaded environment from ${envFile}`);

const inDocker =
  process.env.IN_DOCKER === "1" || fs.existsSync("/.dockerenv");

// Defaults that work BOTH locally and in Docker.
// You can still override with REPORT_DIR / OUTPUT_DIR env vars.
const REPORT_DIR = process.env.REPORT_DIR ||
  (inDocker ? "/playwright-report/html" : path.join(process.cwd(), "playwright-report", "html"));
const OUTPUT_DIR = process.env.OUTPUT_DIR ||
  (inDocker ? "/test-results/run" : path.join(process.cwd(), "test-results", "run"));

const HEADFUL = process.env.HEADFUL === "1";
const DEBUG_PORT = process.env.DEBUG_PORT;


export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [["line"], ["html", { outputFolder: REPORT_DIR, open: "never" }]],
  outputDir: OUTPUT_DIR,

  use: {
    headless: !HEADFUL,
    trace: "on",                
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [{
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      launchOptions: {
        ignoreDefaultArgs: DEBUG_PORT
          ? ["--enable-automation", "--remote-debugging-pipe"] 
          : ["--enable-automation"],
        args: [
          "--disable-blink-features=AutomationControlled",
          ...(DEBUG_PORT ? [
            "--remote-debugging-address=0.0.0.0",
            `--remote-debugging-port=${DEBUG_PORT}`,
          ] : []),
        ],
      },
    },
  }],
});
