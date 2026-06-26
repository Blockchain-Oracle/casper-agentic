export interface FormatAddressOptions {
  /** Leading characters to keep. */
  lead?: number;
  /** Trailing characters to keep. */
  trail?: number;
  /** Optional prefix kept in front of the truncated body (e.g. "account-hash-"). */
  prefix?: string;
  /** Value returned when the input is empty/missing. */
  fallback?: string;
}

const ELLIPSIS = "…"; // …

/**
 * Single source of truth for leading…trailing truncation of addresses, hashes,
 * public keys, and ids. v3 design style: `01a2…ef`, `9c2b…4a` (real ellipsis,
 * no `0x` prefix). Replaces the per-file ad-hoc truncations.
 */
export function formatAddress(value: string | null | undefined, options: FormatAddressOptions = {}): string {
  const { lead = 6, trail = 4, prefix = "", fallback = "unknown" } = options;
  if (!value) return fallback;
  if (value.length <= lead + trail) return `${prefix}${value}`;
  return `${prefix}${value.slice(0, lead)}${ELLIPSIS}${value.slice(-trail)}`;
}

/**
 * Receipt/request id truncation that preserves the `rcpt_`/`req_` prefix segment.
 * e.g. `rcpt_8f3a1b2c3d4e21c9` → `rcpt_8f3a…21c9`.
 */
export function formatReceiptId(id: string | null | undefined): string {
  if (!id) return "unknown";
  const underscore = id.indexOf("_");
  if (underscore === -1 || underscore >= id.length - 1) {
    return formatAddress(id, { lead: 6, trail: 4 });
  }
  const head = id.slice(0, underscore + 1);
  const body = id.slice(underscore + 1);
  return `${head}${formatAddress(body, { lead: 4, trail: 4 })}`;
}
