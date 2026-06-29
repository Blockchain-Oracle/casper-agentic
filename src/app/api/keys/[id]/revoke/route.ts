import { NextResponse } from "next/server";

import { isApiKeyError, requireApiKeyTokenForKey, revokeApiKey } from "@/server/api-keys";
import { isDestructiveActionError } from "@/server/destructive-action-guard";
import { requireKeyOwner } from "@/server/owner-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const apiKeyToken = request.headers.get("x-api-key")?.trim();
    // Three accepted authorizations: possession of the raw token, the owning wallet
    // session, or (for legacy owner-null keys) the admin token via requireKeyOwner.
    if (apiKeyToken) await requireApiKeyTokenForKey(id, apiKeyToken);
    else await requireKeyOwner(request, id);
    await revokeApiKey(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "key_revoke_failed" },
      { status: isApiKeyError(error) || isDestructiveActionError(error) ? error.status : 400 },
    );
  }
}
