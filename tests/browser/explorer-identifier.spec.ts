import { expect, test } from "@playwright/test";

test("explorer no longer exposes the old inline search controls", async ({ page }) => {
  await page.goto("/explorer");

  await expect(page.getByRole("heading", { name: "Explorer" })).toBeVisible();
  await expect(page.getByLabel(/Search receipt id, deploy hash, account hash, public key, or CSPR.name/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open external WCSPR feed" })).toHaveCount(0);
});
