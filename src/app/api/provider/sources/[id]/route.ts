import { NextResponse } from "next/server";

import { isDestructiveActionError } from "@/server/destructive-action-guard";
import { requireSourceOwner } from "@/server/owner-guard";
import { deleteProviderSource } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await requireSourceOwner(request, id);
    return NextResponse.json(await deleteProviderSource(id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "provider_source_delete_failed" },
      { status: isDestructiveActionError(error) ? error.status : 400 },
    );
  }
}
