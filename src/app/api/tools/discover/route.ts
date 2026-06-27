import { NextRequest, NextResponse } from "next/server";

import { getRuntimeConfig } from "@/server/env";
import { discoverMcpTools } from "@/server/mcp-client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const config = getRuntimeConfig();
  const endpointUrl = typeof body.endpointUrl === "string" && body.endpointUrl ? body.endpointUrl : config.mcpUrl;

  try {
    const tools = await discoverMcpTools(endpointUrl);
    return NextResponse.json({ endpointUrl, tools });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "tool_discovery_failed" },
      { status: 502 },
    );
  }
}
