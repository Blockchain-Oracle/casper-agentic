export interface WalletRecord {
  accountHash: string;
  id: string;
  label: string;
  network: string;
  publicKey?: string | null;
  signingMode: string;
}

export interface WalletReadiness {
  accountHash: string;
  assetBalance: string;
  gasBalance: string;
  network: string;
  paymentAsset: string;
  ready: boolean;
  reason: string;
}

export interface WalletPolicy {
  allowedAsset: string;
  allowedNetwork: string;
  allowedTools: string[];
  dailyLimit: string | null;
  disabled: boolean;
  id: string;
  maxPerCall: string;
  sessionLimit: string | null;
  walletId: string | null;
}
