import { NextRequest, NextResponse } from "next/server";

import { discoverMcpTools } from "@/server/mcp-client";
import { discoverOpenApiTools } from "@/server/openapi-discovery";
import { getProviderSourceRecord, persistDiscoveredMcpTools, persistOpenApiTools } from "@/server/provider-store";
import { toProviderSourceView } from "@/server/provider-model";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const source = await getProviderSourceRecord(id);
    if (!source) return NextResponse.json({ error: "provider_source_not_found" }, { status: 404 });

    if (source.sourceType === "openapi") {
      const discovered = await discoverOpenApiTools(source.endpointUrl);
      const tools = await persistOpenApiTools(source.id, discovered);
      return NextResponse.json({ source: toProviderSourceView(source), tools });
    }

    const discovered = await discoverMcpTools(source.endpointUrl);
    const tools = await persistDiscoveredMcpTools(source.id, source.endpointUrl, discovered);
    return NextResponse.json({ source: toProviderSourceView(source), tools });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_source_discovery_failed";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
