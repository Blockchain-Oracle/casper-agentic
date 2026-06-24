import { expect, test } from "@playwright/test";

test("public explorer searches CSPR.name identifiers", async ({ page }) => {
  const accountHash = "b383c7cc23d18bc1b42406a1b2d29fc8dba86425197b6f553d7fd61375b5e446";

  await page.route("**/api/explorer/search?**", async (route) => {
    await route.fulfill({
      body: JSON.stringify(externalAccountSearchResult(accountHash)),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/explorer");
  await page.getByLabel(/Search receipt id, deploy hash, account hash, public key, or CSPR.name/).fill("faucet.cspr");
  await page.getByRole("button", { name: "Search explorer" }).click();

  await expect(page.getByText("Resolved faucet.cspr to a Casper account.")).toBeVisible();
  await expect(page.getByText("External Casper account", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
});

function externalAccountSearchResult(accountHash: string) {
  const detail = {
    casper: [
      { key: "account hash", mono: true, value: accountHash },
      { key: "public key", mono: true, value: "018afa98ca4be12d613617f7339a2d576950a2f9a92102ca4d6508ee31b54d2c02" },
    ],
    gateway: [{ key: "result source", value: "External Casper account proof" }],
    policy: [{ key: "status", tone: "warn", value: "unavailable" }],
    receipt: {
      amount: "0",
      asset: "WCSPR",
      client: "external-account-lookup",
      hash: null,
      id: `account:${accountHash}:page:1`,
      provider: "External Casper account",
      status: "external_proof",
      time: "unavailable",
      tool: "unavailable",
      wallet: accountHash,
    },
    x402: [{ key: "status", tone: "warn", value: "unavailable" }],
  };
  return {
    detail,
    externalAccount: {
      accountHash,
      detail,
      matches: [detail],
      message: "Resolved 0 external WCSPR actions for this account through CSPR.cloud.",
      network: "casper:casper-test",
      pagination: { hasNextPage: false, hasPreviousPage: false, page: 1, pageSize: 4, totalCount: 0, totalPages: 1 },
      source: "cspr_cloud",
    },
    matches: [detail],
    message: "Resolved faucet.cspr to a Casper account. Resolved 0 external WCSPR actions for this account through CSPR.cloud.",
    query: accountHash,
    source: "external_account_proof",
  };
}
