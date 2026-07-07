import { NextRequest, NextResponse } from "next/server";

import { normalizeCasperAccountHash } from "@/server/casper-account";
import { DEFAULT_CASPER_NETWORK, DEFAULT_WCSPR_PACKAGE, getRuntimeConfig } from "@/server/env";
import { isDestructiveActionError } from "@/server/destructive-action-guard";
import { requireToolOwner } from "@/server/owner-guard";
import { saveToolPrice } from "@/server/provider-store";
import type { OwnerIdentity } from "@/server/wallet-session";
import { buildPaymentRequirements } from "@/server/x402-payment";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    const { id } = await context.params;
    // The provider must be signed in to price their tool; their wallet is the default payout.
    const owner = await requireToolOwner(request, id);
    const config = getRuntimeConfig();
    assertServerPaymentDefaults(body, config);
    const payTo = resolvePayTo(body.payTo, owner, config);
    const requirements = buildPaymentRequirements({ ...config, payeeAccountHash: payTo });
    const price = await saveToolPrice({
      amount: body.amount ?? requirements.amount,
      asset: requirements.asset,
      extra: requirements.extra,
      maxTimeoutSeconds: requirements.maxTimeoutSeconds,
      network: requirements.network,
      payTo: requirements.payTo,
      scheme: "exact",
      toolId: id,
    });
    return NextResponse.json({ price });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_tool_price_failed";
    return NextResponse.json({ error: message }, { status: isDestructiveActionError(error) ? error.status : 400 });
  }
}

// Payout recipient (MCPay-parity): the provider earns to THEIR wallet, not a global
// account. Priority: an explicit payout override → the signed-in owner's wallet →
// the gateway env default (seeded/demo tools). All coerced to the casper-x402
// "00"+account-hash form the facilitator settles WCSPR to.
function resolvePayTo(input: unknown, owner: OwnerIdentity | null, config: ReturnType<typeof getRuntimeConfig>): string {
  const override = typeof input === "string" ? input.trim() : "";
  if (override) return `00${normalizeCasperAccountHash(override, "payout wallet")}`;
  if (owner?.accountHash) return `00${normalizeCasperAccountHash(owner.accountHash, "owner wallet")}`;
  if (config.payeeAccountHash) return config.payeeAccountHash;
  throw new Error("Connect a wallet to set your payout address (or configure CASPER_PAYEE_ACCOUNT_HASH)");
}

// asset/network/scheme/timeout stay server-side. payTo is now a first-class provider
// input (their payout wallet), so it is NOT rejected here.
function assertServerPaymentDefaults(body: Record<string, unknown>, config: ReturnType<typeof getRuntimeConfig>) {
  const clientPaymentFields = ["asset", "network", "scheme", "maxTimeoutSeconds"].filter(
    (key) => body[key] !== undefined,
  );
  if (clientPaymentFields.length) {
    throw new Error(`payment fields are server-side only: ${clientPaymentFields.join(", ")}`);
  }
  if (config.casperNetwork !== DEFAULT_CASPER_NETWORK) throw new Error("provider pricing requires Casper Testnet");
  if (config.paymentAsset !== DEFAULT_WCSPR_PACKAGE) throw new Error("provider pricing requires WCSPR");
}
