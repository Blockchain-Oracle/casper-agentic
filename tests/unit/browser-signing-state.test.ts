import { describe, expect, it } from "vitest";

import { browserStateFromClient } from "@/components/screens/browser-signing-state";

describe("browser signing state mapping", () => {
  it("keeps disconnected CSPR.click state free of current-provider metadata", () => {
    const state = browserStateFromClient({
      clientAvailable: true,
      connected: false,
      providerCapabilities: [
        {
          key: "csprclick-w3a-google",
          name: "Google",
          supports: ["sign-typed-data-eip712"],
          typedDataSupport: true,
          version: "web3auth",
        },
      ],
      signInAvailable: true,
      signTypedDataAvailable: true,
      status: "client_available",
    });

    expect(state).toMatchObject({
      connected: false,
      message: "Connect CSPR.click before browser approval.",
      status: "client_available",
    });
    expect(state).not.toHaveProperty("provider");
    expect(state).not.toHaveProperty("providerSupportsTypedData");
  });
});
