export type Screen =
  | "dashboard"
  | "import"
  | "pricing"
  | "endpoint"
  | "wallet"
  | "console"
  | "settings";

export type ReceiptStatus =
  | "settled"
  | "blocked"
  | "verify_failed"
  | "settle_failed"
  | "upstream_failed"
  | "auth_failed"
  | "raw_proof_unavailable";

export type SourcePhase = "form" | "loading" | "error" | "success";
export type SourceType = "openapi" | "mcp" | "manual";
export type UpstreamAuth = "none" | "static" | "apikey" | "bearer";
export type ConsolePhase = "idle" | "discovered" | "complete";

export interface Tool {
  id: string;
  description: string;
  target: string;
  price: number | null;
  enabled: boolean;
  published: boolean;
  provider: string;
}

export interface WalletProfile {
  id: string;
  account: string;
  fullAccount: string;
  network: string;
  signingMode: string;
  balance: string;
  status: string;
  funded: boolean;
}

export interface Receipt {
  id: string;
  time: string;
  provider: string;
  tool: string;
  wallet: string;
  amount: string;
  asset: string;
  status: ReceiptStatus;
  hash: string | null;
  client: string;
  reason?: string;
}

export interface AuditEvent {
  time: string;
  label: string;
  meta: string;
  kind: "ok" | "block" | "fail" | "info" | "warn";
}

export interface KeyValueRow {
  key: string;
  value: string;
  mono?: boolean;
  tone?: "neutral" | "signal" | "warn" | "danger" | "primary";
}

export interface ReceiptDetail {
  receipt: Receipt;
  gateway: KeyValueRow[];
  policy: KeyValueRow[];
  x402: KeyValueRow[];
  casper: KeyValueRow[];
  policyNote?: string;
  x402Note?: string;
  casperNote?: string;
}
