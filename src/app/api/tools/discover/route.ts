import { NextRequest, NextResponse } from "next/server";

import { getRuntimeConfig } from "@/server/env";
import { discoverMcpTools } from "@/server/mcp-client";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const config = getRuntimeConfig();
  const endpointUrl = typeof body.endpointUrl === "string" && body.endpointUrl ? body.endpointUrl : config.mcpUrl;

  try {
    requireOperatorRequest(request);
    const tools = await discoverMcpTools(endpointUrl);
    return NextResponse.json({ endpointUrl, tools });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "tool_discovery_failed" },
      { status: isOperatorAccessError(error) ? error.status : 502 },
    );
  }
}
