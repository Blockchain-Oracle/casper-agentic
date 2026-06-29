import { NextResponse } from "next/server";

import { isDestructiveActionError } from "@/server/destructive-action-guard";
import { requireSourceOwner } from "@/server/owner-guard";
import { rediscoverSource } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await requireSourceOwner(request, id);
    return NextResponse.json(await rediscoverSource(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "rediscover_failed";
    return NextResponse.json({ error: message }, { status: isDestructiveActionError(error) ? error.status : 502 });
  }
}
