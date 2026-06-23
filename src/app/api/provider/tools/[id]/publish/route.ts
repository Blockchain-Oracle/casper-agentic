import { NextRequest, NextResponse } from "next/server";

import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { publishProviderTool } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireOperatorRequest(request);
    const { id } = await context.params;
    return NextResponse.json({ tool: await publishProviderTool(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_tool_publish_failed";
    return NextResponse.json(
      { error: message },
      { status: isOperatorAccessError(error) ? error.status : 400 },
    );
  }
}
