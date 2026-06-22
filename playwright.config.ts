import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  retries: process.env.CI ? 1 : 0,
  testDir: "tests/browser",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build && pnpm start",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:3000",
  },
  workers: process.env.CI ? 1 : undefined,
});
