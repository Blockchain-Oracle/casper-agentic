import { NextRequest, NextResponse } from "next/server";

import { createEndpointAccessKey } from "@/server/endpoint-access";
import { isDestructiveActionError } from "@/server/destructive-action-guard";
import { requireSourceOwner } from "@/server/owner-guard";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    const { id } = await context.params;
    await requireSourceOwner(request, id);
    const result = await createEndpointAccessKey({
      label: typeof body.label === "string" ? body.label : "Default client access",
      scope: { sourceId: id, toolIds: body.toolIds },
      sourceId: id,
      walletId: typeof body.walletId === "string" ? body.walletId : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "endpoint_access_key_create_failed";
    return NextResponse.json({ error: message }, { status: isDestructiveActionError(error) ? error.status : 400 });
  }
}
