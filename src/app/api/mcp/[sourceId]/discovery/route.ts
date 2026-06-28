import { NextRequest, NextResponse } from "next/server";

import { buildHostedDiscoveryManifest } from "@/server/hosted-discovery";
import { getHostedEndpoint } from "@/server/hosted-endpoint";

export const dynamic = "force-dynamic";

// Public discovery manifest for the hosted MCP server (no auth — published tools
// are public, like /servers). tools/call still requires a casper_ key.
export async function GET(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  try {
    const endpoint = await getHostedEndpoint(sourceId);
    const response = NextResponse.json(buildHostedDiscoveryManifest({ endpoint, requestUrl: request.url }));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "hosted_discovery_failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
