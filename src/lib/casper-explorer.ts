// Casper Testnet explorer links. Accounts use /account/, deploys use /deploy/
// (NOT EVM-style /address//tx/). Mainnet is a future config change.
const BASE = "https://testnet.cspr.live";

export function casperExplorerUrl(value: string, kind: "account" | "deploy") {
  return `${BASE}/${kind}/${value}`;
}

/** Truncate a hash/address for display (full value stays copyable/linkable). */
export function truncateHash(value: string | null | undefined, lead = 8, trail = 6) {
  if (!value) return "—";
  return value.length <= lead + trail + 1 ? value : `${value.slice(0, lead)}…${value.slice(-trail)}`;
}
