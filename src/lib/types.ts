export type Screen =
  | "dashboard"
  | "import"
  | "pricing"
  | "endpoint"
  | "wallet"
  | "console"
  | "settings";

export const receiptStatuses = [
  "policy_pending",
  "settled",
  "blocked",
  "verify_failed",
  "settle_failed",
  "upstream_failed",
  "auth_failed",
  "raw_proof_unavailable",
  "external_proof",
] as const;

export type ReceiptStatus = (typeof receiptStatuses)[number];

export type SourcePhase = "form" | "loading" | "error" | "success";
export type SourceType = "openapi" | "mcp" | "manual";
export type UpstreamAuth = "none" | "static" | "apikey" | "bearer";
export type ConsolePhase = "idle" | "discovered" | "complete";

export interface Tool {
  id: string;
  description: string;
  target: string;
  price: number | null;
  priceAmount?: string | null;
  recordId?: string;
  enabled: boolean;
  published: boolean;
  provider: string;
  status?: ProviderToolStatus;
}

export type ProviderToolStatus = "draft" | "selected" | "priced" | "published" | "unpublished" | "unsupported";

export interface ProviderSource {
  authMode: UpstreamAuth;
  credentialConfigured: boolean;
  endpointUrl: string;
  id: string;
  name: string;
  sourceType: SourceType;
}

export interface ProviderToolPrice {
  amount: string;
  asset: string;
  extra: unknown;
  maxTimeoutSeconds: number;
  network: string;
  payTo: string;
  scheme: "exact";
  toolId: string;
}

export interface ProviderTool {
  description: string | null;
  id: string;
  inputSchema: unknown;
  name: string;
  outputSchema: unknown;
  price?: ProviderToolPrice | null;
  sourceId: string;
  status: ProviderToolStatus;
  upstreamTarget: string;
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

export interface ReceiptHistoryFilters {
  from?: string;
  network?: string;
  provider?: string;
  q?: string;
  status?: ReceiptStatus;
  to?: string;
  tool?: string;
  wallet?: string;
}

export interface ReceiptHistoryPagination {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type ReceiptFeedSource = "fixture" | "postgres";

export interface ReceiptHistoryResult {
  filters: ReceiptHistoryFilters;
  network: string;
  pagination: ReceiptHistoryPagination;
  receipts: ReceiptDetail[];
  source: ReceiptFeedSource;
}

export type ExternalAccountHistorySource = "cspr_cloud" | "not_found" | "unconfigured" | "upstream_error";

export interface ExternalAccountHistoryResult {
  accountHash: string;
  detail?: ReceiptDetail;
  matches: ReceiptDetail[];
  message: string;
  network: string;
  pagination: ReceiptHistoryPagination;
  source: ExternalAccountHistorySource;
}

export type ExternalActionFeedSource = "cspr_cloud" | "rate_limited" | "unconfigured" | "upstream_error";
export interface ExternalActionFeedCacheMeta { generatedAt: string; status: "hit" | "miss" | "stale"; ttlSeconds: number; }
export interface ExternalActionFeedRateLimitMeta { limited: boolean; remaining: number; resetAt: string; }

export interface ExternalActionFeedResult {
  cache?: ExternalActionFeedCacheMeta;
  detail?: ReceiptDetail;
  matches: ReceiptDetail[];
  message: string;
  network: string;
  pagination: ReceiptHistoryPagination;
  rateLimit?: ExternalActionFeedRateLimitMeta;
  source: ExternalActionFeedSource;
}

export type ExplorerSearchSource =
  | "casper_gw_account"
  | "casper_gw_receipt"
  | "external_account_proof"
  | "external_casper_proof"
  | "not_found"
  | "upstream_error"
  | "unconfigured";

export interface ExplorerSearchResult {
  detail?: ReceiptDetail;
  externalAccount?: ExternalAccountHistoryResult;
  matches?: ReceiptDetail[];
  message: string;
  query: string;
  source: ExplorerSearchSource;
}
