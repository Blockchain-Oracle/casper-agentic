import { expect, test } from "@playwright/test";

test("app connect button uses embedded CSPR.click runtime without opening a provider tab", async ({ page }) => {
  await page.route("https://cdn.cspr.click/**", async (route) => {
    await route.fulfill({
      body: csprClickRuntimeMock(),
      contentType: "application/javascript",
      status: 200,
    });
  });

  await page.goto("/app");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("CSPR.click configured - connect before signing")).toBeVisible();

  await page.getByRole("button", { name: "Wallets" }).click();
  await expect(page.getByText("Connect CSPR.click before browser approval.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect CSPR.click wallet" })).toBeVisible();

  const pageCountBefore = page.context().pages().length;
  await page.getByRole("button", { name: "Connect CSPR.click wallet" }).click();

  await expect(page.getByText("CSPR.click sign-in requested")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Mock CSPR.click sign-in" })).toBeVisible();
  expect(page.context().pages()).toHaveLength(pageCountBefore);
  await expect.poll(() => page.evaluate(() => window.__casperGwCSPRClickSignInCalls)).toBe(1);
});

function csprClickRuntimeMock() {
  return `
(() => {
  const listeners = new Map();
  window.__casperGwCSPRClickSignInCalls = 0;
  window.csprclick = {
    getActiveAccountAsync: async () => null,
    getActivePublicKey: async () => undefined,
    off: (eventName) => listeners.delete(eventName),
    on: (eventName, handler) => listeners.set(eventName, handler),
    signIn: () => {
      window.__casperGwCSPRClickSignInCalls += 1;
      const existing = document.querySelector('[data-testid="mock-csprclick-modal"]');
      if (existing) return;
      const dialog = document.createElement('section');
      dialog.setAttribute('aria-label', 'Mock CSPR.click sign-in');
      dialog.setAttribute('data-testid', 'mock-csprclick-modal');
      dialog.setAttribute('role', 'dialog');
      dialog.textContent = 'Mock embedded CSPR.click provider chooser';
      document.body.appendChild(dialog);
    },
    signInWithAccount: () => undefined,
    signTypedData: async () => ({ cancelled: true, digest: null, error: 'not used in this smoke', publicKey: null, signatureHex: null })
  };
  window.dispatchEvent(new Event('csprclick:loaded'));
})();
`;
}

declare global {
  interface Window {
    __casperGwCSPRClickSignInCalls: number;
  }
}
