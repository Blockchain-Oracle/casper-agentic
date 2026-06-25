import { expect, test, type APIRequestContext } from "@playwright/test";

test("public explorer is public and separate from the app shell", async ({ page }, testInfo) => {
  await page.goto("/explorer");

  await expect(page.getByRole("heading", { name: "Casper x402 Explorer" })).toBeVisible();
  if (!testInfo.project.name.includes("mobile")) {
    await expect(page.getByRole("navigation", { name: "Public" })).toBeVisible();
  }
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  await expect(page.getByText("No sign-in required")).toBeVisible();
  await expect(page.getByLabel(/Search receipt id, deploy hash, account hash, public key, or CSPR.name/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Search explorer" })).toBeVisible();
  await expect(page.getByLabel("Filter receipt history")).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await expect(page.getByText(/\d+ results - page 1 of \d+/)).toBeVisible();
  await expect(page.getByText("External proof is limited")).toBeVisible();
  await expect(page.getByText(/Sample receipts|Gateway receipts/)).toBeVisible();
});

test("public explorer history browsing clears exact lookup state", async ({ page, request }) => {
  const settledReceiptId = await firstReceiptId(request, "status=settled");
  const blockedReceiptId = await firstReceiptId(request, "status=blocked");
  if (!settledReceiptId || !blockedReceiptId) {
    test.skip(true, "fixture or database needs settled and blocked receipts");
    return;
  }

  await page.goto(`/explorer?receipt=${encodeURIComponent(settledReceiptId)}`);
  await expect(page.getByText(`${settledReceiptId} receipt`)).toBeVisible();

  await page.getByLabel(/Search receipt id, deploy hash, account hash, public key, or CSPR.name/).fill(`receipt:${settledReceiptId}`);
  await page.getByRole("button", { name: "Search explorer" }).click();
  await expect(page.getByText(`${settledReceiptId} receipt`)).toBeVisible();

  await page.getByRole("button", { name: "Blocked", exact: true }).click();
  await expect(page.getByText(`${blockedReceiptId} receipt`)).toBeVisible();
  await expect(page.getByText(`${settledReceiptId} receipt`)).toHaveCount(0);
});

test("public explorer pages external account history controls", async ({ page }) => {
  const accountHash = "bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12";

  await page.route("**/api/explorer/search?**", async (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("externalPage") ?? "1");
    await route.fulfill({
      body: JSON.stringify(externalAccountSearchResult(accountHash, pageNumber)),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/explorer");
  await page.getByLabel(/Search receipt id, deploy hash, account hash, public key, or CSPR.name/).fill(`account:${accountHash}`);
  await page.getByRole("button", { name: "Search explorer" }).click();

  await expect(page.getByText("CSPR.cloud account history")).toBeVisible();
  await expect(page.getByText("6 external actions - page 1 of 3")).toBeVisible();
  await expect(page.getByText("External Casper account", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next external page" }).click();
  await expect(page.getByText("6 external actions - page 2 of 3")).toBeVisible();
});

test("operator app exposes the paid tool console without changing public explorer", async ({ page }) => {
  await page.goto("/app");

  await page.getByRole("button", { name: "Open test console" }).click();
  await expect(page.getByRole("heading", { name: "Paid Tool Test Console" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Discover endpoint tools" })).toBeVisible();
  await expect(page.getByText("Design fixture")).toHaveCount(0);
  await expect(page.getByText("CSPR.click browser approval")).toBeVisible();
});

test("provider wiring avoids fake hosted credentials", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "mobile nav switching is covered separately");

  await page.goto("/app");
  await page.getByRole("button", { name: "Start provider flow" }).click();
  await expect(page.getByRole("heading", { name: "Source Import" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Discover Remote MCP" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load provider records" })).toBeVisible();

  await page.getByRole("button", { name: "Endpoint" }).click();
  await expect(page.getByText("/api/mcp/{sourceId}", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/client-access-token/).first()).toBeVisible();
  await expect(page.getByText("gw.casper-gateway.io")).toHaveCount(0);
});

test("wallet screen exposes real readiness and policy controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "desktop wallet controls are the Phase 2 smoke target");

  await page.goto("/app");
  await page.getByRole("button", { name: "Wallets" }).click();
  await expect(page.getByRole("heading", { name: "Wallet Control Plane" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load wallet records" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save wallet profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save spend policy" })).toBeVisible();
  await expect(page.getByText("ready fixture")).toHaveCount(0);
  await expect(page.getByText("Hosted encrypted signer")).toHaveCount(0);
});

test("settings keep signing boundaries explicit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "desktop settings controls are enough for signing-boundary copy");

  await page.goto("/app");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings & Audit" })).toBeVisible();
  await expect(page.getByText("Testnet signer integration path")).toBeVisible();
  await expect(page.getByText("integration verification only")).toBeVisible();
  await expect(page.getByText("CSPR.click not enabled")).toBeVisible();
  await expect(page.getByText("Hosted encrypted signer")).toHaveCount(0);
});

test("integration health reports preflight state without secret values", async ({ request }) => {
  const response = await request.get("/api/health/integrations");
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.casper.network).toBe("casper:casper-test");
  expect(Array.isArray(body.required.missing)).toBeTruthy();
  expect(body.walletSigning.browserWallet.status).toBe("not_enabled");
  expect(JSON.stringify(body)).not.toContain("PRIVATE KEY");
});

test("paid-call API fails closed before live payment", async ({ request }) => {
  const response = await request.post("/api/paid-calls/run", { data: { toolName: "get_quote" } });
  const body = await response.json();

  expect([403, 503]).toContain(response.status());
  expect(body.error).toMatch(/CASPER_GW_OPERATOR_TOKEN is required|operator access required|HTTP signing endpoint is disabled/);
  expect(JSON.stringify(body)).not.toContain("PRIVATE KEY");
});

async function firstReceiptId(request: APIRequestContext, query: string) {
  const response = await request.get(`/api/receipts?page=1&pageSize=1&${query}`);
  if (!response.ok()) return undefined;
  const body = await response.json();
  return body.receipts?.[0]?.receipt?.id as string | undefined;
}

function externalAccountSearchResult(accountHash: string, page: number) {
  const deployHash = `${String(page).repeat(64)}`.slice(0, 64);
  const detail = {
    casper: [
      { key: "account hash", mono: true, value: accountHash },
      { key: "action page", mono: true, value: `${page} of 3` },
    ],
    gateway: [{ key: "result source", value: "External Casper account proof" }],
    policy: [{ key: "status", tone: "warn", value: "unavailable" }],
    receipt: {
      amount: "7500000000",
      asset: "WCSPR",
      client: "external-account-lookup",
      hash: deployHash,
      id: `external-account:${accountHash}:${deployHash}:${page}`,
      provider: "External Casper account",
      status: "external_proof",
      time: "2026-06-23T21:34:47Z",
      tool: "payment token action",
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
      message: "Resolved 6 external WCSPR actions for this account through CSPR.cloud.",
      network: "casper:casper-test",
      pagination: { hasNextPage: page < 3, hasPreviousPage: page > 1, page, pageSize: 4, totalCount: 6, totalPages: 3 },
      source: "cspr_cloud",
    },
    matches: [detail],
    message: "Resolved 6 external WCSPR actions for this account through CSPR.cloud.",
    query: accountHash,
    source: "external_account_proof",
  };
}
