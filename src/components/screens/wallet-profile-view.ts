import type { WalletProfile } from "@/lib/types";
import type { WalletReadiness, WalletRecord } from "@/lib/wallet-control-types";

export function toWalletProfile(wallet: WalletRecord, readiness: WalletReadiness | null): WalletProfile {
  const active = readiness?.accountHash === wallet.accountHash ? readiness : null;
  return {
    account: `0x${wallet.accountHash.slice(0, 4)}...${wallet.accountHash.slice(-4)}`,
    balance: active?.assetBalance ?? "unavailable",
    fullAccount: `account-hash-${wallet.accountHash}`,
    funded: Boolean(active?.ready),
    id: wallet.id,
    network: wallet.network,
    signingMode: wallet.signingMode,
    status: active?.ready ? "ready" : "not ready",
  };
}
