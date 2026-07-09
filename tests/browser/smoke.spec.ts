import { expect, test, type APIRequestContext } from "@playwright/test";

test("public explorer shows the current payment feed", async ({ page }, testInfo) => {
  await page.goto("/explorer");

  await expect(page.getByRole("heading", { name: "Explorer" })).toBeVisible();
  await expect(page.getByText("Every x402 payment settled through the gateway on Casper. Public")).toBeVisible();
  if (!testInfo.project.name.includes("mobile")) {
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  }
  await expect(page.getByText("PAID CALLS")).toBeVisible();
  await expect(page.getByText("SETTLED", { exact: true })).toBeVisible();
  await expect(page.getByText("WCSPR SETTLED")).toBeVisible();
  await expect(page.getByText("Tool · Provider")).toBeVisible();
  await expect(page.getByText("Amount")).toBeVisible();
});

test("public receipt detail is reachable without sign-in", async ({ page, request }) => {
  const receiptId = await firstReceiptId(request);
  if (!receiptId) {
    test.skip(true, "fixture or database needs at least one receipt");
    return;
  }

  await page.goto(`/receipt/${receiptId}`);

  await expect(page.getByText("Public receipt · no sign-in")).toBeVisible();
  await expect(page.getByRole("heading", { name: receiptId })).toBeVisible();
  await expect(page.getByText("Casper x402 payment proof")).toBeVisible();
});

test("servers and register pages are public", async ({ page }) => {
  await page.goto("/servers");
  await expect(page.getByRole("heading", { name: "Servers" })).toBeVisible();
  await expect(page.getByText("MCP servers published on the gateway.")).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Register a tool" })).toBeVisible();
  await expect(page.getByText("Point the gateway at an MCP server or an OpenAPI spec.")).toBeVisible();
});

test("integration health reports preflight state without secret values", async ({ request }) => {
  const response = await request.get("/api/health/integrations");
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.casper.network).toBe("casper:casper-test");
  expect(Array.isArray(body.required.missing)).toBeTruthy();
  expect(["configured", "not_enabled"]).toContain(body.walletSigning.browserWallet.status);
  expect(JSON.stringify(body)).not.toContain("PRIVATE KEY");
});

test("paid-call API validates input before live payment", async ({ request }) => {
  const response = await request.post("/api/paid-calls/run", { data: { toolName: "get_quote" } });
  const body = await response.json();

  expect(response.status()).toBe(400);
  expect(body.error).toMatch(/args object is required/);
  expect(JSON.stringify(body)).not.toContain("PRIVATE KEY");
});

async function firstReceiptId(request: APIRequestContext) {
  const response = await request.get("/api/receipts?page=1&pageSize=1");
  if (!response.ok()) return undefined;
  const body = await response.json();
  return body.receipts?.[0]?.receipt?.id as string | undefined;
}
