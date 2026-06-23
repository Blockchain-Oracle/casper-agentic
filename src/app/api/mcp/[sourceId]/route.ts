import { NextRequest, NextResponse } from "next/server";

import { isEndpointAccessError, requireEndpointAccess } from "@/server/endpoint-access";
import { getHostedEndpoint } from "@/server/hosted-endpoint";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  try {
    const access = await requireEndpointAccess(sourceId, request.headers.get("authorization"));
    const endpoint = await getHostedEndpoint(sourceId);
    return NextResponse.json({
      access,
      endpoint: {
        source: endpoint.source,
        tools: endpoint.tools,
      },
      transport: "streamable-http",
      x402: { protected: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "hosted_endpoint_failed";
    return NextResponse.json(
      { error: message },
      { status: isEndpointAccessError(error) ? error.status : 404 },
    );
  }
}
