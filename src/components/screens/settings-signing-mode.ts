import type { BrowserSigningState } from "./browser-signing-state";

export function browserWalletSigningLabel(state: BrowserSigningState) {
  switch (state.status) {
    case "connected":
      return "CSPR.click connected - policy pre-check still required";
    case "client_available":
      return "CSPR.click configured - connect before signing";
    case "client_unavailable":
      return "CSPR.click configured - waiting for SDK";
    case "error":
      return "CSPR.click runtime unavailable";
    case "not_enabled":
      return "CSPR.click not enabled";
  }
}
