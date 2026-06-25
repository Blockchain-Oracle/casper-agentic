import { describe, expect, it } from "vitest";

import {
  csprClickProviderInfo,
  csprClickProviderSupportsTypedData,
  normalizeCSPRClickSupports,
} from "@/lib/csprclick-provider-info";

describe("CSPR.click provider info helpers", () => {
  it("normalizes advertised capabilities and detects typed-data support", () => {
    const supports = normalizeCSPRClickSupports(["sign-message", "SIGN-TYPED-DATA-EIP712", "sign-message"]);

    expect(supports).toEqual(["sign-message", "sign-typed-data-eip712"]);
    expect(csprClickProviderSupportsTypedData(supports)).toBe(true);
    expect(csprClickProviderSupportsTypedData(["sign-message"])).toBe(false);
    expect(csprClickProviderSupportsTypedData([])).toBeUndefined();
  });

  it("builds provider evidence without emitting undefined optional fields", () => {
    expect(csprClickProviderInfo({
      accountProvider: "casper-wallet",
      provider: { name: "Casper Wallet", supports: ["sign-message"], version: "2.4.2-extension" },
      supports: ["sign-message"],
    })).toEqual({
      key: "casper-wallet",
      name: "Casper Wallet",
      supports: ["sign-message"],
      version: "2.4.2-extension",
    });

    expect(csprClickProviderInfo({ supports: [] })).toBeUndefined();
  });
});
