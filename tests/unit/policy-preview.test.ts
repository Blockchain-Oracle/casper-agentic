import { describe, expect, it } from "vitest";

import { previewPolicy } from "@/lib/policy-preview";
import type { WalletPolicy } from "@/lib/wallet-control-types";

const policy: WalletPolicy = {
  allowedAsset: "wcspr-package",
  allowedNetwork: "casper:casper-test",
  allowedTools: ["weather.fetch", "geocode.lookup"],
  dailyLimit: null,
  disabled: false,
  id: "p1",
  maxPerCall: "500000000",
  sessionLimit: null,
  walletId: "w1",
};

describe("previewPolicy", () => {
  it("passes an allowed tool within the per-call cap", () => {
    expect(previewPolicy(policy, { tool: "weather.fetch", amount: "250000000" })).toEqual({
      pass: true,
      reason: "Within max/call, asset & network match, tool allowed.",
    });
  });

  it("blocks an amount over max per call", () => {
    expect(previewPolicy(policy, { tool: "weather.fetch", amount: "800000000" }).pass).toBe(false);
  });

  it("blocks a tool that is not on the allowlist", () => {
    const result = previewPolicy(policy, { tool: "image.generate", amount: "100000000" });
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("allowlist");
  });

  it("blocks when the kill switch is on", () => {
    expect(previewPolicy({ ...policy, disabled: true }, { tool: "weather.fetch", amount: "1" }).pass).toBe(false);
  });

  it("blocks on network mismatch", () => {
    const result = previewPolicy(policy, { tool: "weather.fetch", amount: "1", network: "casper:casper" });
    expect(result.pass).toBe(false);
  });

  it("blocks when there is no policy", () => {
    expect(previewPolicy(null, { tool: "weather.fetch", amount: "1" }).pass).toBe(false);
  });
});
