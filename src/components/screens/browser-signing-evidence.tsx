import { KeyValueList } from "@/components/ui";

import type { BrowserSigningState } from "./browser-signing-state";
import { browserProviderLabel, browserTypedDataSupportLabel } from "./settings-signing-mode";

export function BrowserSigningConnectionNotice({ state }: { state: BrowserSigningState }) {
  return (
    <div className={state.connected ? "notice signal" : "notice"}>
      {state.connected ? (
        <span>
          Active CSPR.click public key: {shortPublicKey(state.activePublicKey)}
          <br />
          {state.message}
        </span>
      ) : state.message}
    </div>
  );
}

export function BrowserSigningProviderEvidence({ state }: { state: BrowserSigningState }) {
  if (!state.connected) return null;
  return (
    <KeyValueList
      rows={[
        { key: "browser provider", value: browserProviderLabel(state) },
        { key: "typed-data support", value: browserTypedDataSupportLabel(state) },
      ]}
    />
  );
}

export function BrowserSigningProviderCapabilities({ state }: { state: BrowserSigningState }) {
  if (!state.providerCapabilities.length) return null;
  return (
    <KeyValueList
      rows={state.providerCapabilities.map((provider) => ({
        key: providerCapabilityKey(provider),
        value: providerCapabilityLabel(provider),
      }))}
    />
  );
}

export function BrowserSigningProviderNotice({ state }: { state: BrowserSigningState }) {
  if (!state.connected) return null;
  return (
    <div className={state.providerSupportsTypedData === false ? "notice warn" : "notice"}>
      {browserProviderLabel(state)} - {browserTypedDataSupportLabel(state)}
    </div>
  );
}

function shortPublicKey(value: string | undefined) {
  return value ? `${value.slice(0, 10)}...${value.slice(-8)}` : "unknown";
}

function providerCapabilityLabel(provider: BrowserSigningState["providerCapabilities"][number]) {
  const suffix = provider.reportedKey ? `; SDK reported ${provider.reportedKey}` : "";
  if (provider.typedDataSupport === true) return `advertises sign-typed-data-eip712${suffix}`;
  if (provider.typedDataSupport === false) return `does not advertise sign-typed-data-eip712${suffix}`;
  return provider.supports.length
    ? `reported: ${provider.supports.join(", ")}${suffix}`
    : `capability evidence unavailable${suffix}`;
}

function providerCapabilityKey(provider: BrowserSigningState["providerCapabilities"][number]) {
  const label = configuredProviderLabel(provider.key) ?? provider.name ?? "CSPR.click provider";
  return `${label} (${provider.key})`;
}

function configuredProviderLabel(key: string) {
  return {
    "casper-wallet": "Casper Wallet",
    "csprclick-w3a-apple": "CSPR.click Web Wallet - Apple",
    "csprclick-w3a-google": "CSPR.click Web Wallet - Google",
    ledger: "Ledger",
    "metamask-snap": "MetaMask Snap",
  }[key];
}
