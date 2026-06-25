import { describe, expect, it } from "vitest";

import { browserWalletSigningLabel } from "@/components/screens/settings-signing-mode";
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
});

function state(status: BrowserSigningState["status"]): BrowserSigningState {
  return {
    canRequestSignIn: status === "client_available" || status === "connected",
    connected: status === "connected",
    message: status,
    ready: status !== "not_enabled",
    status,
  };
}
