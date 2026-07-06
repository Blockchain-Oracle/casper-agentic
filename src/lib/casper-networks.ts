// Single source of truth for Casper network identity. PUBLIC facts only — no signer
// keys, no API tokens (those live server-side in env.ts, resolved per network). Safe
// to import from client components. Network is CAIP-2: casper:casper-test | casper:casper.

export type CasperNetworkId = "casper:casper-test" | "casper:casper";

export interface CasperNetwork {
  id: CasperNetworkId;
  /** Casper chain name used in deploys/transactions (not CAIP-2). */
  chainName: "casper-test" | "casper";
  /** Human label for badges/toggles. */
  label: string;
  isTestnet: boolean;
  /** cspr.live base for deploy/account links on this network. */
  explorerBaseUrl: string;
}

export const CASPER_NETWORKS: Record<CasperNetworkId, CasperNetwork> = {
  "casper:casper-test": {
    chainName: "casper-test",
    explorerBaseUrl: "https://testnet.cspr.live",
    id: "casper:casper-test",
    isTestnet: true,
    label: "Testnet",
  },
  "casper:casper": {
    chainName: "casper",
    explorerBaseUrl: "https://cspr.live",
    id: "casper:casper",
    isTestnet: false,
    label: "Mainnet",
  },
};

export const DEFAULT_NETWORK_ID: CasperNetworkId = "casper:casper-test";

/** Ordered for UI (testnet first — it's the default settling network today). */
export const NETWORK_ORDER: CasperNetworkId[] = ["casper:casper-test", "casper:casper"];

export function isCasperNetworkId(value: unknown): value is CasperNetworkId {
  return value === "casper:casper-test" || value === "casper:casper";
}

/** Coerce any stored/query value to a known network id, falling back to testnet. */
export function normalizeNetworkId(value: unknown): CasperNetworkId {
  return isCasperNetworkId(value) ? value : DEFAULT_NETWORK_ID;
}

export function getCasperNetwork(value: unknown): CasperNetwork {
  return CASPER_NETWORKS[normalizeNetworkId(value)];
}

export function isTestnetNetwork(value: unknown): boolean {
  return getCasperNetwork(value).isTestnet;
}

/** Build a cspr.live link on the RIGHT network. Accounts use /account/, deploys /deploy/. */
export function casperExplorerUrl(value: string, kind: "account" | "deploy", network?: unknown): string {
  return `${getCasperNetwork(network).explorerBaseUrl}/${kind}/${value}`;
}

/** Truncate a hash/address for display (full value stays copyable/linkable). */
export function truncateHash(value: string | null | undefined, lead = 8, trail = 6): string {
  if (!value) return "—";
  return value.length <= lead + trail + 1 ? value : `${value.slice(0, lead)}…${value.slice(-trail)}`;
}
