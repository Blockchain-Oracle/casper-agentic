import type { getCSPRClickBrowserState } from "@/lib/csprclick-browser";

export interface BrowserSigningState {
  activePublicKey?: string;
  canRequestSignIn: boolean;
  connected: boolean;
  message: string;
  provider?: {
    key?: string;
    name?: string;
    supports: string[];
    version?: string;
  };
  providerCapabilities: {
    key: string;
    name?: string;
    supports: string[];
    typedDataSupport?: boolean;
    version?: string;
  }[];
  providerSupportsTypedData?: boolean;
  ready: boolean;
  signTypedDataAvailable: boolean;
  status: "client_available" | "client_unavailable" | "connected" | "error" | "not_enabled";
}

export const initialBrowserSigningState: BrowserSigningState = {
  canRequestSignIn: false,
  connected: false,
  message: "CSPR.click not enabled.",
  providerCapabilities: [],
  ready: false,
  signTypedDataAvailable: false,
  status: "not_enabled",
};

export function browserStateFromRuntime(status: "error" | "not_enabled"): BrowserSigningState {
  return {
    canRequestSignIn: false,
    connected: false,
    message: status === "not_enabled" ? "CSPR.click not enabled." : "CSPR.click runtime unavailable.",
    providerCapabilities: [],
    ready: false,
    signTypedDataAvailable: false,
    status,
  };
}

export function browserStateFromClient(state: Awaited<ReturnType<typeof getCSPRClickBrowserState>>): BrowserSigningState {
  if (state.status === "connected") {
    return {
      activePublicKey: state.activePublicKey,
      canRequestSignIn: state.signInAvailable,
      connected: true,
      message: connectedMessage(state),
      provider: state.provider,
      providerCapabilities: state.providerCapabilities,
      providerSupportsTypedData: state.providerSupportsTypedData,
      ready: true,
      signTypedDataAvailable: state.signTypedDataAvailable,
      status: "connected",
    };
  }
  if (state.status === "client_available") {
    return {
      canRequestSignIn: state.signInAvailable,
      connected: false,
      message: "Connect CSPR.click before browser approval.",
      provider: state.provider,
      providerCapabilities: state.providerCapabilities,
      providerSupportsTypedData: state.providerSupportsTypedData,
      ready: true,
      signTypedDataAvailable: state.signTypedDataAvailable,
      status: "client_available",
    };
  }
  return {
    canRequestSignIn: false,
    connected: false,
    message: "Use the CSPR.click top bar to sign in; waiting for SDK client.",
    providerCapabilities: [],
    ready: true,
    signTypedDataAvailable: false,
    status: "client_unavailable",
  };
}

function connectedMessage(state: Awaited<ReturnType<typeof getCSPRClickBrowserState>>) {
  if (state.status !== "connected") return "CSPR.click wallet connected.";
  if (!state.signTypedDataAvailable) return "CSPR.click wallet connected, but typed-data signing is unavailable.";
  if (state.providerSupportsTypedData === false) {
    return "CSPR.click wallet connected, but this provider does not advertise typed-data signing.";
  }
  return "CSPR.click wallet connected.";
}
