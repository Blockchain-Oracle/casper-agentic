import type { getCSPRClickBrowserState } from "@/lib/csprclick-browser";

export interface BrowserSigningState {
  activePublicKey?: string;
  canRequestSignIn: boolean;
  connected: boolean;
  message: string;
  ready: boolean;
  status: "client_available" | "client_unavailable" | "connected" | "error" | "not_enabled";
}

export const initialBrowserSigningState: BrowserSigningState = {
  canRequestSignIn: false,
  connected: false,
  message: "CSPR.click not enabled.",
  ready: false,
  status: "not_enabled",
};

export function browserStateFromRuntime(status: "error" | "not_enabled"): BrowserSigningState {
  return {
    canRequestSignIn: false,
    connected: false,
    message: status === "not_enabled" ? "CSPR.click not enabled." : "CSPR.click runtime unavailable.",
    ready: false,
    status,
  };
}

export function browserStateFromClient(state: Awaited<ReturnType<typeof getCSPRClickBrowserState>>): BrowserSigningState {
  if (state.status === "connected") {
    return {
      activePublicKey: state.activePublicKey,
      canRequestSignIn: state.signInAvailable,
      connected: true,
      message: "CSPR.click wallet connected.",
      ready: true,
      status: "connected",
    };
  }
  if (state.status === "client_available") {
    return {
      canRequestSignIn: state.signInAvailable,
      connected: false,
      message: "Connect CSPR.click before browser approval.",
      ready: true,
      status: "client_available",
    };
  }
  return {
    canRequestSignIn: false,
    connected: false,
    message: "Use the CSPR.click top bar to sign in; waiting for SDK client.",
    ready: true,
    status: "client_unavailable",
  };
}
