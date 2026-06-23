import { NextRequest, NextResponse } from "next/server";

import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { saveToolPrice } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const { id } = await context.params;
    const price = await saveToolPrice({
      amount: body.amount,
      asset: body.asset,
      maxTimeoutSeconds: body.maxTimeoutSeconds,
      network: body.network,
      payTo: body.payTo,
      scheme: body.scheme,
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
