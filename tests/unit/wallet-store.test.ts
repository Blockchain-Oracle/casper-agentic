import { describe, expect, it } from "vitest";

import { normalizeAgentWalletInput, toAgentWalletView } from "@/server/wallet-store";
import { payerHash, publicKey } from "./browser-x402-signing-fixtures";

const accountHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
const x402Address = `00${accountHash}`;

describe("wallet store helpers", () => {
  it("normalizes wallet profile input without storing signing secrets", () => {
    expect(
      normalizeAgentWalletInput({
        accountHash: `account-hash-${x402Address}`,
        label: " Judge Wallet ",
        network: "casper:casper-test",
        signingMode: "external",
      }),
    ).toEqual({
      accountHash,
      label: "Judge Wallet",
      network: "casper:casper-test",
      publicKey: undefined,
      signingMode: "external",
    });
  });

  it("requires browser-wallet profiles to keep a matching CSPR.click public key", () => {
    expect(
      normalizeAgentWalletInput({
        accountHash: payerHash,
        label: "Browser Wallet",
        network: "casper:casper-test",
        publicKey: `0x${publicKey.toUpperCase()}`,
        signingMode: "browser-wallet",
      }),
    ).toEqual({
      accountHash: payerHash,
      label: "Browser Wallet",
      network: "casper:casper-test",
      publicKey,
      signingMode: "browser-wallet",
    });
  });

  it("rejects unsupported account hashes and signing modes", () => {
    expect(() =>
      normalizeAgentWalletInput({
        accountHash: "not-an-account",
        label: "Wallet",
        network: "casper:casper-test",
        signingMode: "external",
      }),
    ).toThrow("wallet account hash must be a Casper account hash");

    expect(() =>
      normalizeAgentWalletInput({
        accountHash,
        label: "Wallet",
        network: "casper:casper-test",
        signingMode: "custody",
      }),
    ).toThrow("wallet signing mode is not supported");
  });

  it("rejects missing or mismatched browser-wallet public keys", () => {
    expect(() =>
      normalizeAgentWalletInput({
        accountHash: payerHash,
        label: "Browser Wallet",
        network: "casper:casper-test",
        signingMode: "browser-wallet",
      }),
    ).toThrow("browser-wallet profiles require a CSPR.click public key");

    expect(() =>
      normalizeAgentWalletInput({
        accountHash,
        label: "Browser Wallet",
        network: "casper:casper-test",
        publicKey,
        signingMode: "browser-wallet",
      }),
    ).toThrow("wallet public key does not match account hash");
  });

  it("returns wallet views without private material fields", () => {
    const view = toAgentWalletView({
      accountHash,
      createdAt: new Date(),
      id: "wallet-1",
      label: "Judge Wallet",
      network: "casper:casper-test",
      publicKey: null,
      signingMode: "external",
      updatedAt: new Date(),
    });

    expect(view).toEqual({
      accountHash,
      id: "wallet-1",
      label: "Judge Wallet",
      network: "casper:casper-test",
      publicKey: null,
      signingMode: "external",
    });
    expect(view).not.toHaveProperty("privateKey");
  });
});
