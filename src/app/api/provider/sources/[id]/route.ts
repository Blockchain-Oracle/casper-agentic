import { NextResponse } from "next/server";

import { isDestructiveActionError, requireDestructiveActionToken } from "@/server/destructive-action-guard";
import { deleteProviderSource } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireDestructiveActionToken(request);
    const { id } = await context.params;
    return NextResponse.json(await deleteProviderSource(id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "provider_source_delete_failed" },
      { status: isDestructiveActionError(error) ? error.status : 400 },
    );
  }
}
