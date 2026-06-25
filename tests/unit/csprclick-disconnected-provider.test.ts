import { describe, expect, it, vi } from "vitest";

import { getCSPRClickBrowserState } from "@/lib/csprclick-browser";

describe("CSPR.click disconnected provider evidence", () => {
  it("does not expose current provider metadata when no active account is connected", async () => {
    const getProviderInfo = vi.fn(async (provider?: string) => ({
      key: provider ?? "metamask-snap",
      name: "Metamask",
      supports: ["sign-message"],
      version: "2.0.0 - MetaMask/v13.35.1",
    }));

    const state = await getCSPRClickBrowserState(
      {
        csprclick: {
          getActiveAccountAsync: vi.fn().mockResolvedValue(null),
          getProviderInfo,
          signIn: vi.fn(),
          signTypedData: vi.fn(),
        },
      },
      ["csprclick-w3a-google"],
    );

    expect(state).toMatchObject({
      clientAvailable: true,
      connected: false,
      signTypedDataAvailable: true,
      status: "client_available",
    });
    expect(state).not.toHaveProperty("provider");
    expect(state).not.toHaveProperty("providerSupportsTypedData");
    expect(getProviderInfo).toHaveBeenCalledWith("csprclick-w3a-google");
    expect(getProviderInfo).not.toHaveBeenCalledWith(undefined);
  });
});
