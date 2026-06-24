import { NextRequest, NextResponse } from "next/server";

import { isEndpointAccessError, requireEndpointAccess } from "@/server/endpoint-access";
import { buildHostedDiscoveryManifest } from "@/server/hosted-discovery";
import { getHostedEndpoint } from "@/server/hosted-endpoint";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  try {
    const access = await requireEndpointAccess(sourceId, request.headers.get("authorization"));
    const endpoint = await getHostedEndpoint(sourceId, access.scope.toolIds);
    const response = NextResponse.json(buildHostedDiscoveryManifest({
      endpoint,
      requestUrl: request.url,
      scope: access.scope,
    }));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "hosted_discovery_failed";
    return NextResponse.json(
      { error: message },
      { status: isEndpointAccessError(error) ? error.status : 404 },
    );
  }
}
