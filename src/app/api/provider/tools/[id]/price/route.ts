import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_CASPER_NETWORK, DEFAULT_WCSPR_PACKAGE, getRuntimeConfig } from "@/server/env";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { saveToolPrice } from "@/server/provider-store";
import { buildPaymentRequirements } from "@/server/x402-payment";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const { id } = await context.params;
    const config = getRuntimeConfig();
    const payeeAccountHash = assertServerPaymentDefaults(body, config);
    const requirements = buildPaymentRequirements({ ...config, payeeAccountHash });
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
    return NextResponse.json(
      { error: message },
      { status: isOperatorAccessError(error) ? error.status : 400 },
    );
  }
}

function assertServerPaymentDefaults(body: Record<string, unknown>, config: ReturnType<typeof getRuntimeConfig>) {
  const clientPaymentFields = ["asset", "network", "payTo", "scheme", "maxTimeoutSeconds"].filter(
    (key) => body[key] !== undefined,
  );
  if (clientPaymentFields.length) {
    throw new Error(`payment fields are server-side only: ${clientPaymentFields.join(", ")}`);
  }
  if (config.casperNetwork !== DEFAULT_CASPER_NETWORK) throw new Error("provider pricing requires Casper Testnet");
  if (config.paymentAsset !== DEFAULT_WCSPR_PACKAGE) throw new Error("provider pricing requires WCSPR");
  if (!config.payeeAccountHash) throw new Error("CASPER_PAYEE_ACCOUNT_HASH is required");
  return config.payeeAccountHash;
}
