import { NextRequest, NextResponse } from "next/server";

import { createEndpointAccessKey } from "@/server/endpoint-access";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const { id } = await context.params;
    const result = await createEndpointAccessKey({
      label: typeof body.label === "string" ? body.label : "Default client access",
      scope: { sourceId: id, toolIds: body.toolIds },
      sourceId: id,
      walletId: typeof body.walletId === "string" ? body.walletId : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "endpoint_access_key_create_failed";
    return NextResponse.json(
      { error: message },
      { status: isOperatorAccessError(error) ? error.status : 400 },
    );
  }
}
