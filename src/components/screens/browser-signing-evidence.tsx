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
