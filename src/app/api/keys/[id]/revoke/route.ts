import { NextResponse } from "next/server";

import { isApiKeyError, requireApiKeyTokenForKey, revokeApiKey } from "@/server/api-keys";
import { isDestructiveActionError, requireDestructiveActionToken } from "@/server/destructive-action-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const apiKeyToken = request.headers.get("x-api-key")?.trim();
    if (apiKeyToken) await requireApiKeyTokenForKey(id, apiKeyToken);
    else requireDestructiveActionToken(request);
    await revokeApiKey(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "key_revoke_failed" },
      { status: isApiKeyError(error) || isDestructiveActionError(error) ? error.status : 400 },
    );
  }
}
