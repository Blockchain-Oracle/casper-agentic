import type { Receipt, Tool } from "@/lib/types";
import type { WalletPolicy, WalletReadiness, WalletRecord } from "@/lib/wallet-control-types";

export interface WalletScreenProps {
  copied: string | null;
  dailyLimit: string;
  errorMessage: string | null;
  loading: boolean;
  onCopy: (value: string) => void;
  onCreateWallet: () => void;
  onDailyLimit: (value: string) => void;
  onLoadWallets: () => void;
  onOpenReceipt: (receipt: Receipt) => void;
  onPolicyAmount: (amount: string) => void;
  onPolicyDisabled: (disabled: boolean) => void;
  onPolicyTool: (tool: string) => void;
  onRefreshReadiness: () => void;
  onSavePolicy: () => void;
  onSelectWallet: (walletId: string) => void;
  onSessionLimit: (value: string) => void;
  onWalletAccountHash: (value: string) => void;
  onWalletLabel: (value: string) => void;
  onWalletSigningMode: (value: string) => void;
  operatorConnected: boolean;
  policy: WalletPolicy | null;
  policyAmount: string;
  policyDisabled: boolean;
  policyTool: string;
  policyTools: Tool[];
  readiness: WalletReadiness | null;
  selectedWallet: WalletRecord | null;
  selectedWalletId: string;
  sessionLimit: string;
  statusMessage: string;
  walletAccountHash: string;
  walletLabel: string;
  wallets: WalletRecord[];
  walletSigningMode: string;
}

export function walletRows(wallet: WalletRecord | null, readiness: WalletReadiness | null) {
  if (!wallet) return [{ key: "wallet", value: "none selected" }];
  return [
    { key: "account", value: `account-hash-${wallet.accountHash}`, mono: true },
    { key: "network", value: wallet.network, mono: true },
    { key: "signing mode", value: wallet.signingMode },
    { key: "CSPR gas", value: readiness?.gasBalance ?? "not checked", mono: true },
    { key: "WCSPR balance", value: readiness?.assetBalance ?? "not checked", mono: true },
    { key: "readiness", value: readiness?.ready ? "ready" : readiness?.reason ?? "not checked" },
  ];
}

export function policyRows(policy: WalletPolicy | null) {
  if (!policy) return [{ key: "policy", value: "none saved" }];
  return [
    { key: "max per call", value: policy.maxPerCall, mono: true },
    { key: "day limit", value: policy.dailyLimit ?? "unset", mono: true },
    { key: "session limit", value: policy.sessionLimit ?? "unset", mono: true },
    { key: "allowed tools", value: policy.allowedTools.join(", ") || "none" },
    { key: "allowed network", value: policy.allowedNetwork, mono: true },
    { key: "allowed asset", value: policy.allowedAsset, mono: true },
  ];
}

export function getToolOptions(tools: Tool[], selected: string) {
  const names = tools.map((tool) => tool.id);
  return Array.from(new Set([selected || "get_quote", ...names]));
}

export function shortHash(hash: string) {
  return `0x${hash.slice(0, 6)}...${hash.slice(-6)}`;
}
