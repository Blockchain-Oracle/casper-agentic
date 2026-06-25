import type { WalletProfile } from "@/lib/types";

export function TestConsoleWalletActions({
  activeWalletId,
  browserRunDisabled,
  browserSigningReady,
  busy,
  onRunBrowser,
  onRunSigner,
  runDisabled,
  selectedWallet,
}: {
  activeWalletId: string;
  browserRunDisabled: boolean;
  browserSigningReady: boolean;
  busy: boolean;
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
      <button className="primaryButton" disabled={browserRunDisabled} onClick={onRunBrowser} type="button">
        Run with CSPR.click approval
      </button>
      {!browserSigningReady ? <div className="muted">CSPR.click not enabled.</div> : null}
      <button className="secondaryButton" disabled={runDisabled} onClick={onRunSigner} type="button">
        Run integration signer path
      </button>
      {busy ? <div className="muted">Waiting for the current console request.</div> : null}
    </div>
  );
}
