import { describe, expect, it } from "vitest";

import { normalizeAgentWalletInput, toAgentWalletView } from "@/server/wallet-store";

const accountHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
const x402Address = `00${accountHash}`;

describe("wallet store helpers", () => {
  it("normalizes wallet profile input without storing signing secrets", () => {
    expect(
      normalizeAgentWalletInput({
        accountHash: `account-hash-${x402Address}`,
        label: " Judge Wallet ",
        network: "casper:casper-test",
        publicKey: "0202",
        signingMode: "external",
      }),
    ).toEqual({
      accountHash,
      label: "Judge Wallet",
      network: "casper:casper-test",
      publicKey: "0202",
      signingMode: "external",
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
