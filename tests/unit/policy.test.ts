import { describe, expect, it } from "vitest";

import { evaluateSpendPolicy, type SpendPolicyInput } from "@/server/policy";

const basePolicy: SpendPolicyInput = {
  allowedAsset: "asset",
  allowedNetwork: "casper:casper-test",
  allowedTools: ["get_quote"],
  assetBalance: BigInt(100),
  gasBalance: BigInt(1),
  maxPerCall: BigInt(50),
  network: "casper:casper-test",
  paymentAmount: BigInt(50),
  paymentAsset: "asset",
  toolName: "get_quote",
};

describe("spend policy", () => {
  it("allows a ready wallet and allowlisted tool", () => {
    expect(evaluateSpendPolicy(basePolicy)).toEqual({
      allowed: true,
      reason: "policy allowed before signing/payment",
    });
  });

  it("blocks before payment when the tool is not allowlisted", () => {
    expect(evaluateSpendPolicy({ ...basePolicy, toolName: "swap" })).toEqual({
      allowed: false,
      reason: "tool swap is not allowed",
    });
  });

  it("blocks before payment when the payment amount exceeds max per call", () => {
    expect(evaluateSpendPolicy({ ...basePolicy, paymentAmount: BigInt(51) })).toEqual({
      allowed: false,
      reason: "payment amount exceeds max per call",
    });
  });

  it("blocks before payment when asset balance is insufficient", () => {
    expect(evaluateSpendPolicy({ ...basePolicy, assetBalance: BigInt(49) })).toEqual({
      allowed: false,
      reason: "wallet lacks enough CEP-18 payment asset",
    });
  });
});
