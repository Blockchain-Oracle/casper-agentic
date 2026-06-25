import { describe, expect, it, vi } from "vitest";

import { getCSPRClickBrowserState } from "@/lib/csprclick-browser";
import { getCSPRClickProviderCapabilities } from "@/lib/csprclick-provider-capabilities";

describe("CSPR.click configured provider capability probe", () => {
  it("queries configured providers without signing and marks typed-data support only when advertised", async () => {
    const getProviderInfo = vi.fn(async (provider?: string) => {
      if (provider === "casper-wallet") {
        return { key: "casper-wallet", name: "Casper Wallet", supports: ["sign-message"], version: "2.4.2" };
      }
      if (provider === "csprclick-w3a-google") {
        return {
          key: "csprclick-w3a-google",
          name: "Google",
          supports: ["sign-typed-data-eip712"],
          version: "web3auth",
        };
      }
      return undefined;
    });

    await expect(getCSPRClickProviderCapabilities(
      { getProviderInfo },
      ["casper-wallet", " ", "casper-wallet", "csprclick-w3a-google", "ledger"],
    )).resolves.toEqual([
      {
        key: "casper-wallet",
        name: "Casper Wallet",
        supports: ["sign-message"],
        typedDataSupport: false,
        version: "2.4.2",
      },
      {
        key: "csprclick-w3a-google",
        name: "Google",
        supports: ["sign-typed-data-eip712"],
        typedDataSupport: true,
        version: "web3auth",
      },
      { key: "ledger", supports: [] },
    ]);
    expect(getProviderInfo).toHaveBeenCalledTimes(3);
  });

  it("carries configured provider capability evidence in browser state", async () => {
    const signTypedData = vi.fn();
    await expect(getCSPRClickBrowserState(
      {
        csprclick: {
          getActiveAccountAsync: vi.fn().mockResolvedValue(null),
          getProviderInfo: vi.fn(async (provider?: string) => ({
            key: provider ?? "casper-wallet",
            name: provider ?? "Casper Wallet",
            supports: provider === "csprclick-w3a-google" ? ["sign-typed-data-eip712"] : ["sign-message"],
          })),
          signIn: vi.fn(),
          signTypedData,
        },
      },
      ["csprclick-w3a-google", "casper-wallet"],
    )).resolves.toMatchObject({
      connected: false,
      providerCapabilities: [
        { key: "csprclick-w3a-google", typedDataSupport: true },
        { key: "casper-wallet", typedDataSupport: false },
      ],
      signTypedDataAvailable: true,
      status: "client_available",
    });
    expect(signTypedData).not.toHaveBeenCalled();
  });
});
