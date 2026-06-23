import { describe, expect, it } from "vitest";

import { paymentRequirementsFromPrice } from "@/server/hosted-endpoint";

describe("hosted endpoint model", () => {
  it("builds Casper x402 requirements from persisted tool pricing", () => {
    expect(
      paymentRequirementsFromPrice({
        amount: "7500000000",
        asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
        extra: { decimals: "9", symbol: "WCSPR" },
        maxTimeoutSeconds: 900,
        network: "casper:casper-test",
        payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
        scheme: "exact",
      }),
    ).toEqual({
      amount: "7500000000",
      asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
      extra: { decimals: "9", symbol: "WCSPR" },
      maxTimeoutSeconds: 900,
      network: "casper:casper-test",
      payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
      scheme: "exact",
    });
  });
});
