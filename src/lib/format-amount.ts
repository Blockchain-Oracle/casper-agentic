const MOTES_PER_TOKEN = BigInt(1_000_000_000); // CSPR/WCSPR use 9 decimals (motes)
const HASH_LIKE = /^[0-9a-f]{40,}$/i;

/**
 * Display amount for receipt rows. Postgres stores the x402 value as raw motes
 * (e.g. "7500000000"); fixtures store an already-decimal token amount
 * (e.g. "0.250"). A pure-integer string is treated as motes (9 decimals, with
 * trailing zeros trimmed); anything already containing a "." is passed through.
 * This is what stops `7500000000 <64-hex>` from overflowing the AMOUNT column.
 */
export function formatTokenAmount(value: string | null | undefined): string {
  if (!value) return "0";
  const trimmed = value.trim();
  if (trimmed.includes(".") || !/^\d+$/.test(trimmed)) return trimmed;
  const motes = BigInt(trimmed);
  const whole = motes / MOTES_PER_TOKEN;
  const fraction = (motes % MOTES_PER_TOKEN).toString().padStart(9, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

/** Inverse of formatTokenAmount: a decimal token amount ("7.5") → raw motes ("7500000000"). */
export function parseTokenToMotes(value: string): string {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,9})?$/.test(trimmed)) {
    throw new Error("amount must be a positive number with up to 9 decimals");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const motes = BigInt(whole) * MOTES_PER_TOKEN + BigInt((fraction + "000000000").slice(0, 9));
  if (motes <= BigInt(0)) throw new Error("amount must be greater than zero");
  return motes.toString();
}

/**
 * Display symbol for the payment asset. WCSPR is the gateway's only payment
 * asset; Postgres records it as the token contract hash, so a hash-like asset
 * renders as "WCSPR" rather than dumping 64 hex characters into the amount cell.
 * An explicit symbol (already short, non-hash) is passed through unchanged.
 */
export function formatAsset(asset: string | null | undefined): string {
  if (!asset) return "WCSPR";
  return HASH_LIKE.test(asset.trim()) ? "WCSPR" : asset.trim();
}
