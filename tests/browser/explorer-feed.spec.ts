import { expect, test } from "@playwright/test";

test("explorer feed links rows to public receipt pages", async ({ page, request }) => {
  const response = await request.get("/api/receipts?page=1&pageSize=1");
  expect(response.ok()).toBeTruthy();
  const receiptId = (await response.json()).receipts?.[0]?.receipt?.id as string | undefined;

  await page.goto("/explorer");
  await expect(page.getByRole("heading", { name: "Explorer" })).toBeVisible();

  if (!receiptId) {
    await expect(page.getByText("No paid calls yet.")).toBeVisible();
    return;
  }

  await expect(page.locator(`a[href="/receipt/${receiptId}"]`).first()).toBeVisible();
});
