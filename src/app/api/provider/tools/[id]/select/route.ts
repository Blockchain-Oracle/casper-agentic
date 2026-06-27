import { NextRequest, NextResponse } from "next/server";

import { setProviderToolStatus } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ tool: await setProviderToolStatus(id, "selected") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_tool_select_failed";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
