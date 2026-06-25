import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TestConsoleWalletActions } from "@/components/screens/test-console-wallet-actions";
import { isBrowserApprovalRunDisabled } from "@/components/screens/test-console-browser-gate";
import type { BrowserSigningState } from "@/components/screens/browser-signing-state";
import type { WalletProfile } from "@/lib/types";

describe("paid-console browser signing gate", () => {
  it("fails closed when the provider explicitly lacks typed-data support", () => {
    expect(gate({ providerSupportsTypedData: false })).toBe(true);
  });

  it("allows browser approval when typed-data support is true or still unknown", () => {
    expect(gate({ providerSupportsTypedData: true })).toBe(false);
    expect(gate({ providerSupportsTypedData: undefined })).toBe(false);
  });

  it("renders the provider warning next to the browser run button", () => {
    const html = renderToStaticMarkup(createElement(TestConsoleWalletActions, {
      activeWalletId: "wallet-1",
      browserRunDisabled: true,
      browserSigningState: browserState({ providerSupportsTypedData: false }),
      busy: false,
      onConnectBrowser: vi.fn(),
      onRunBrowser: vi.fn(),
      onRunSigner: vi.fn(),
      runDisabled: false,
      selectedWallet: wallet,
    }));

    expect(html).toContain("Casper Wallet 2.4.2-extension");
    expect(html).toContain("provider does not advertise sign-typed-data-eip712");
    expect(html).toContain("disabled");
  });
});

const wallet: WalletProfile = {
  account: "0xwallet",
  balance: "15 WCSPR",
  fullAccount: "account-hash-abc",
  funded: true,
  id: "wallet-1",
  network: "casper:casper-test",
  signingMode: "browser-wallet",
  status: "ready",
};

function gate(input: { providerSupportsTypedData?: boolean }) {
  return isBrowserApprovalRunDisabled({
    baseRunDisabled: false,
    browserSigningState: browserState(input),
    selectedWallet: wallet,
  });
}

function browserState(input: { providerSupportsTypedData?: boolean }): BrowserSigningState {
  return {
    activePublicKey: "0202034f22ba451598257c05d09acb9e6b78127659f637a421b27ab321cfe214eb8d",
    canRequestSignIn: true,
    connected: true,
    message: "CSPR.click wallet connected.",
    provider: {
      key: "casper-wallet",
      name: "Casper Wallet",
      supports: input.providerSupportsTypedData === false ? ["sign-message"] : ["sign-typed-data-eip712"],
      version: "2.4.2-extension",
    },
    providerSupportsTypedData: input.providerSupportsTypedData,
    ready: true,
    signTypedDataAvailable: true,
    status: "connected",
  };
}
