import { NextRequest, NextResponse } from "next/server";

import { isDestructiveActionError } from "@/server/destructive-action-guard";
import { requireToolOwner } from "@/server/owner-guard";
import { setProviderToolStatus } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await requireToolOwner(request, id);
    return NextResponse.json({ tool: await setProviderToolStatus(id, "selected") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_tool_select_failed";
    return NextResponse.json({ error: message }, { status: isDestructiveActionError(error) ? error.status : 400 });
  }
}
