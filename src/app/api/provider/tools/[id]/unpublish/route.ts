import { NextRequest, NextResponse } from "next/server";

import { unpublishProviderTool } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ tool: await unpublishProviderTool(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_tool_unpublish_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
