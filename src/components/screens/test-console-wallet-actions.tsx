import type { WalletProfile } from "@/lib/types";
import type { BrowserSigningState } from "./browser-signing-state";
import { BrowserSigningProviderNotice } from "./browser-signing-evidence";

export function TestConsoleWalletActions({
  activeWalletId,
  browserRunDisabled,
  browserSigningState,
  busy,
  onConnectBrowser,
  onRunBrowser,
  onRunSigner,
  runDisabled,
  selectedWallet,
}: {
  activeWalletId: string;
  browserRunDisabled: boolean;
  browserSigningState: BrowserSigningState;
  busy: boolean;
  onConnectBrowser: () => void;
  onRunBrowser: () => void;
  onRunSigner: () => void;
  runDisabled: boolean;
  selectedWallet?: WalletProfile;
}) {
  return (
    <div className="stack tight">
      <div className={selectedWallet?.funded ? "notice signal" : "notice"}>
        {activeWalletId
          ? selectedWallet?.funded
            ? "Policy pre-check can run before wallet signing."
            : "Wallet is not ready; a real run must stop before signing/payment."
          : "Select a real wallet profile before running a paid call."}
      </div>
      {browserSigningState.canRequestSignIn && !browserSigningState.connected ? (
        <button className="secondaryButton" disabled={busy} onClick={onConnectBrowser} type="button">
          Connect CSPR.click wallet
        </button>
      ) : null}
      <div className="muted">
        {browserSigningState.connected
          ? `Active CSPR.click public key: ${shortKey(browserSigningState.activePublicKey)}`
          : browserSigningState.message}
      </div>
      <BrowserSigningProviderNotice state={browserSigningState} />
      <button className="primaryButton" disabled={browserRunDisabled} onClick={onRunBrowser} type="button">
        Run with CSPR.click approval
      </button>
      <button className="secondaryButton" disabled={runDisabled} onClick={onRunSigner} type="button">
        Run integration signer path
      </button>
      {busy ? <div className="muted">Waiting for the current console request.</div> : null}
    </div>
  );
}

function shortKey(value: string | undefined) {
  return value ? `${value.slice(0, 10)}...${value.slice(-8)}` : "unknown";
}
