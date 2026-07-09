import { expect, test } from "@playwright/test";

test("nav connect button uses embedded CSPR.click runtime without opening a provider tab", async ({ page }) => {
  await page.route("https://cdn.cspr.click/**", async (route) => {
    await route.fulfill({
      body: csprClickRuntimeMock(),
      contentType: "application/javascript",
      status: 200,
    });
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Connect wallet" })).toBeVisible();

  const pageCountBefore = page.context().pages().length;
  await page.getByRole("button", { name: "Connect wallet" }).click();

  await expect(page.getByText("CSPR.click sign-in requested")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Mock CSPR.click sign-in" })).toBeVisible();
  expect(page.context().pages()).toHaveLength(pageCountBefore);
  await expect.poll(() => page.evaluate(() => window.__casperGwCSPRClickSignInCalls)).toBe(1);
});

test("nav reflects an already connected CSPR.click account", async ({ page }) => {
  await page.route("https://cdn.cspr.click/**", async (route) => {
    await route.fulfill({
      body: csprClickRuntimeMock({ connected: true }),
      contentType: "application/javascript",
      status: 200,
    });
  });

  await page.goto("/");

  await expect(page.getByText("020203...eb8d")).toBeVisible();
  await expect(page.getByRole("button", { name: "Disconnect wallet" })).toBeVisible();
});

function csprClickRuntimeMock(options = { connected: false }) {
  return `
(() => {
  const listeners = new Map();
  window.__casperGwCSPRClickSignInCalls = 0;
  window.__casperGwCSPRClickSwitchAccountCalls = 0;
  window.csprclick = {
    appSettings: {},
    getActiveAccountAsync: async () => ${options.connected
      ? "({ provider: 'casper-wallet', providerSupports: ['sign-message'], public_key: '0202034f22ba451598257c05d09acb9e6b78127659f637a421b27ab321cfe214eb8d' })"
      : "null"},
    getActivePublicKey: async () => ${options.connected
      ? "'0202034f22ba451598257c05d09acb9e6b78127659f637a421b27ab321cfe214eb8d'"
      : "undefined"},
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
      dialog.textContent = 'CSPR.click sign-in requested';
      document.body.appendChild(dialog);
    },
    signInWithAccount: () => undefined,
    signOut: () => undefined,
    signTypedData: async () => ({ cancelled: true, digest: null, error: 'not used in this smoke', publicKey: null, signatureHex: null }),
    switchAccount: async () => {
      window.__casperGwCSPRClickSwitchAccountCalls += 1;
    }
  };
  window.dispatchEvent(new Event('csprclick:loaded'));
})();
`;
}

declare global {
  interface Window {
    __casperGwCSPRClickSignInCalls: number;
    __casperGwCSPRClickSwitchAccountCalls: number;
  }
}
