import type { WalletProfile } from "@/lib/types";

export function isBrowserApprovalRunDisabled(input: {
  baseRunDisabled: boolean;
  browserSigningState: {
    connected: boolean;
    providerSupportsTypedData?: boolean;
    signTypedDataAvailable: boolean;
  };
  selectedWallet?: Pick<WalletProfile, "signingMode">;
}) {
  return (
    input.baseRunDisabled ||
    !input.browserSigningState.connected ||
    !input.browserSigningState.signTypedDataAvailable ||
    input.browserSigningState.providerSupportsTypedData === false ||
    input.selectedWallet?.signingMode !== "browser-wallet"
  );
}
