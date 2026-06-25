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
  await expect(page.getByText("Google (csprclick-w3a-google)")).toBeVisible();
  await expect(page.getByText("advertises sign-typed-data-eip712")).toBeVisible();
  await expect(page.getByText("Casper Wallet (casper-wallet)")).toBeVisible();
  await expect(page.getByText("does not advertise sign-typed-data-eip712").first()).toBeVisible();

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
    getProviderInfo: async (provider) => {
      const providers = {
        'casper-wallet': { key: 'casper-wallet', name: 'Casper Wallet', supports: ['sign-message'], version: '2.4.2-extension' },
        'csprclick-w3a-apple': { key: 'csprclick-w3a-apple', name: 'Apple', supports: ['sign-message'], version: 'web3auth' },
        'csprclick-w3a-google': { key: 'csprclick-w3a-google', name: 'Google', supports: ['sign-typed-data-eip712'], version: 'web3auth' },
        'ledger': { key: 'ledger', name: 'Ledger', supports: ['sign-deploy'], version: 'hardware' },
        'metamask-snap': { key: 'metamask-snap', name: 'MetaMask Snap', supports: ['sign-message'], version: 'snap' }
      };
      return providers[provider];
    },
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
