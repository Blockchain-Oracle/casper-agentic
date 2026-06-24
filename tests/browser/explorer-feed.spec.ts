import { expect, test } from "@playwright/test";

test("public explorer browses external WCSPR feed as proof-only", async ({ page }) => {
  await page.route("**/api/explorer/actions?**", async (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") ?? "1");
    await route.fulfill({
      body: JSON.stringify(externalFeedResult(pageNumber)),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/explorer");
  await page.getByRole("button", { name: "Open external WCSPR feed" }).click();

  await expect(page.getByText("6 WCSPR actions - page 1 of 2")).toBeVisible();
  await expect(page.getByText("cache hit")).toBeVisible();
  await expect(page.getByText("External WCSPR action", { exact: true })).toBeVisible();
  await expect(page.getByText("External WCSPR action feed")).toBeVisible();
  await expect(page.getByText("The chain/indexer row proves a configured-token action only.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);

  await page.getByRole("button", { name: "Next WCSPR page" }).click();
  await expect(page.getByText("6 WCSPR actions - page 2 of 2")).toBeVisible();
});

function externalFeedResult(page: number) {
  const deployHash = `${String(page).repeat(64)}`.slice(0, 64);
  const detail = {
    casper: [
      { key: "network", mono: true, value: "casper:casper-test" },
      { key: "deploy hash", mono: true, value: deployHash },
      { key: "action page", mono: true, value: `${page} of 2` },
    ],
    casperNote: "CSPR.cloud returned this configured payment-token action from Casper Testnet.",
    gateway: [
      { key: "result source", tone: "primary", value: "External WCSPR action feed" },
      { key: "gateway receipt", value: "not found" },
    ],
    policy: [{ key: "status", tone: "warn", value: "unavailable" }],
    policyNote: "External WCSPR feed rows do not include Casper GW wallet-policy context.",
    receipt: {
      amount: "7500000000",
      asset: "WCSPR",
      client: "external-wcspr-feed",
      hash: deployHash,
      id: `external-action:${deployHash}:${page}`,
      provider: "External WCSPR action",
      reason: "This token action was resolved from CSPR.cloud, not from Casper GW receipt records.",
      status: "external_proof",
      time: "2026-06-23T21:34:47Z",
      tool: "payment token action",
      wallet: "bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12",
    },
    x402: [{ key: "status", tone: "warn", value: "unavailable" }],
    x402Note: "The chain/indexer row proves a configured-token action only.",
  };
  return {
    cache: { generatedAt: "2026-06-24T10:00:00.000Z", status: "hit", ttlSeconds: 30 },
    detail,
    matches: [detail],
    message: "Resolved 6 external WCSPR actions for the configured payment asset through CSPR.cloud.",
    network: "casper:casper-test",
    pagination: { hasNextPage: page < 2, hasPreviousPage: page > 1, page, pageSize: 4, totalCount: 6, totalPages: 2 },
    rateLimit: { limited: false, remaining: 29, resetAt: "2026-06-24T10:00:00.000Z" },
    source: "cspr_cloud",
  };
}
