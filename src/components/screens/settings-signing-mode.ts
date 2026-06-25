import type { BrowserSigningState } from "./browser-signing-state";

export function browserWalletSigningLabel(state: BrowserSigningState) {
  switch (state.status) {
    case "connected":
      if (!state.signTypedDataAvailable) return "CSPR.click connected - typed-data method unavailable";
      if (state.providerSupportsTypedData === false) return "CSPR.click connected - provider lacks typed-data support";
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

export function browserProviderLabel(state: BrowserSigningState) {
  if (!state.provider) return "not connected";
  const name = state.provider.name ?? state.provider.key ?? "connected provider";
  return state.provider.version ? `${name} ${state.provider.version}` : name;
}

export function browserTypedDataSupportLabel(state: BrowserSigningState) {
  if (!state.signTypedDataAvailable) return "SDK method unavailable";
  if (state.providerSupportsTypedData === true) return "provider advertises sign-typed-data-eip712";
  if (state.providerSupportsTypedData === false) return "provider does not advertise sign-typed-data-eip712";
  return "unproven until provider reports capabilities or signs";
}
