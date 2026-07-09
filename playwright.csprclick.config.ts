import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;
const publicEnv =
  "NEXT_PUBLIC_CSPR_CLICK_APP_ID=csprclick-template " +
  "NEXT_PUBLIC_CSPR_CLICK_APP_NAME='Casper GW' " +
  "NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE=iframe " +
  "NEXT_PUBLIC_CSPR_CLICK_PROVIDERS=csprclick-w3a-google,csprclick-w3a-apple,casper-wallet,ledger,metamask-snap " +
  "NEXT_PUBLIC_CASPER_CHAIN_NAME=casper-test";

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  outputDir: "test-results-csprclick",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  testDir: "tests/browser-csprclick",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `env ${publicEnv} pnpm build && env PORT=${port} ${publicEnv} pnpm start`,
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
});
