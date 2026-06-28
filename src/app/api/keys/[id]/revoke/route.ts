import { NextResponse } from "next/server";

import { revokeApiKey } from "@/server/api-keys";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await revokeApiKey(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "key_revoke_failed" }, { status: 400 });
  }
}
