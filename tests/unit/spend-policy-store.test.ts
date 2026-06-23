import { describe, expect, it } from "vitest";

import { normalizeSpendPolicyInput } from "@/server/spend-policy-store";

describe("spend policy store helpers", () => {
  it("normalizes policy inputs without accepting secrets or payment scope from clients", () => {
    expect(
      normalizeSpendPolicyInput({
        allowedAsset: "asset",
        allowedNetwork: "casper:casper-test",
        allowedTools: [" get_quote ", "get_quote", "swap"],
        dailyLimit: "1000",
        disabled: false,
        maxPerCall: "50",
        sessionLimit: "200",
        walletId: "wallet-1",
      }),
    ).toEqual({
      allowedAsset: "asset",
      allowedNetwork: "casper:casper-test",
      allowedTools: ["get_quote", "swap"],
      dailyLimit: "1000",
      disabled: false,
      maxPerCall: "50",
      sessionLimit: "200",
      walletId: "wallet-1",
    });
  });

  it("rejects non-atomic policy amounts and malformed tool lists", () => {
    expect(() =>
      normalizeSpendPolicyInput({
        allowedAsset: "asset",
        allowedNetwork: "casper:casper-test",
        allowedTools: ["get_quote"],
        maxPerCall: "1.5",
        walletId: "wallet-1",
      }),
    ).toThrow("max per call must be an integer atomic amount");

    expect(() =>
      normalizeSpendPolicyInput({
        allowedAsset: "asset",
        allowedNetwork: "casper:casper-test",
        allowedTools: "get_quote",
        maxPerCall: "50",
        walletId: "wallet-1",
      }),
    ).toThrow("allowed tools must be an array");
  });
});
