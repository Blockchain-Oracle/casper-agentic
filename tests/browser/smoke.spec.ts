import { expect, test } from "@playwright/test";

test("public explorer is public and separate from the app shell", async ({ page }, testInfo) => {
  await page.goto("/explorer");

  await expect(page.getByRole("heading", { name: "Casper x402 Explorer" })).toBeVisible();
  if (!testInfo.project.name.includes("mobile")) {
    await expect(page.getByRole("navigation", { name: "Public" })).toBeVisible();
  }
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  await expect(page.getByText("No sign-in required")).toBeVisible();
});

test("operator app exposes the paid tool console without changing public explorer", async ({ page }) => {
  await page.goto("/app");

  await page.getByRole("button", { name: "Open test console" }).click();
  await expect(page.getByRole("heading", { name: "Paid Tool Test Console" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Discover endpoint tools" })).toBeVisible();
});

test("integration health reports preflight state without secret values", async ({ request }) => {
  const response = await request.get("/api/health/integrations");
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.casper.network).toBe("casper:casper-test");
  expect(Array.isArray(body.required.missing)).toBeTruthy();
  expect(JSON.stringify(body)).not.toContain("PRIVATE KEY");
});

test("paid-call API fails closed when credential preflight is missing", async ({ request }) => {
  const response = await request.post("/api/paid-calls/run", { data: { toolName: "get_quote" } });
  const body = await response.json();

  expect(response.status()).toBe(503);
  expect(body.error).toContain("CASPER_GW_OPERATOR_TOKEN is required");
  expect(JSON.stringify(body)).not.toContain("PRIVATE KEY");
});
