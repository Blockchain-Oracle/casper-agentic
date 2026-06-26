import type { WalletPolicy } from "@/lib/wallet-control-types";

export interface PolicyPreviewInput {
  /** Tool id, e.g. "weather.fetch". */
  tool: string;
  /** Payment amount as an atomic integer string (same units as policy.maxPerCall). */
  amount: string;
  network?: string;
  asset?: string;
}

export interface PolicyPreviewResult {
  pass: boolean;
  reason: string;
}

/**
 * UI-side "would this call pass?" preview. Mirrors the policy-only checks of the
 * server's evaluateSpendPolicy (disabled / network / asset / allowlist / maxPerCall)
 * at atomic precision. It does NOT check live balances — those are evaluated
 * server-side at call time; this is a guidance preview only.
 */
export function previewPolicy(policy: WalletPolicy | null, input: PolicyPreviewInput): PolicyPreviewResult {
  if (!policy) return { pass: false, reason: "No spend policy saved." };
  if (policy.disabled) return { pass: false, reason: "Policy is disabled (kill switch on)." };
  if (input.network && input.network !== policy.allowedNetwork) {
    return { pass: false, reason: `Network ${input.network} is not allowed.` };
  }
  if (input.asset && input.asset !== policy.allowedAsset) {
    return { pass: false, reason: "Payment asset is not allowed." };
  }
  if (!policy.allowedTools.includes(input.tool)) {
    return { pass: false, reason: `Tool ${input.tool} is not on the allowlist.` };
  }
  if (toBig(input.amount) > toBig(policy.maxPerCall)) {
    return { pass: false, reason: "Exceeds max per call." };
  }
  return { pass: true, reason: "Within max/call, asset & network match, tool allowed." };
}

function toBig(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    return BigInt(0);
  }
}
