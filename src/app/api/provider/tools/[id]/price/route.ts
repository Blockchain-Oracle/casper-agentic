import { NextRequest, NextResponse } from "next/server";

import { getRuntimeConfig } from "@/server/env";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { saveToolPrice } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const { id } = await context.params;
    const config = getRuntimeConfig();
    const price = await saveToolPrice({
      amount: body.amount ?? config.paymentAmount,
      asset: body.asset ?? config.paymentAsset,
      maxTimeoutSeconds: body.maxTimeoutSeconds ?? config.paymentTimeoutSeconds,
      network: body.network ?? config.casperNetwork,
      payTo: body.payTo ?? config.payeeAccountHash,
      scheme: body.scheme ?? "exact",
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
