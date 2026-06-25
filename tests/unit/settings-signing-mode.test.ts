import { describe, expect, it } from "vitest";

import {
  browserTypedDataSupportLabel,
  browserWalletSigningLabel,
} from "@/components/screens/settings-signing-mode";
import type { BrowserSigningState } from "@/components/screens/browser-signing-state";

describe("settings signing mode label", () => {
  it.each([
    ["not_enabled", "CSPR.click not enabled"],
    ["client_unavailable", "CSPR.click configured - waiting for SDK"],
    ["client_available", "CSPR.click configured - connect before signing"],
    ["connected", "CSPR.click connected - policy pre-check still required"],
    ["error", "CSPR.click runtime unavailable"],
  ] as const)("renders %s without claiming live settlement", (status, label) => {
    expect(browserWalletSigningLabel(state(status))).toBe(label);
  });

  it("calls out connected providers that lack typed-data support", () => {
    const unsupported = state("connected", { providerSupportsTypedData: false });

    expect(browserWalletSigningLabel(unsupported)).toBe("CSPR.click connected - provider lacks typed-data support");
    expect(browserTypedDataSupportLabel(unsupported)).toBe("provider does not advertise sign-typed-data-eip712");
  });
});

function state(status: BrowserSigningState["status"], overrides: Partial<BrowserSigningState> = {}): BrowserSigningState {
  return {
    canRequestSignIn: status === "client_available" || status === "connected",
    connected: status === "connected",
    message: status,
    ready: status !== "not_enabled",
    signTypedDataAvailable: status === "connected",
    status,
    ...overrides,
  };
}
