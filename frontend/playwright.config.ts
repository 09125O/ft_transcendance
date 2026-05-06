import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const appProtocol =
  process.env.APP_PROTOCOL === "https" ||
  process.env.FRONTEND_ORIGIN?.startsWith("https://")
    ? "https"
    : "http";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || `${appProtocol}://localhost:3000`;

export default defineConfig({
  testDir: "./tests",
  outputDir: resolve(__dirname, "../.local/playwright/test-results"),
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"]],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
    viewport: {
      width: 1440,
      height: 960,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
  ],
});
