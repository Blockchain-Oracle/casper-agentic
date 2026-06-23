import { NextRequest, NextResponse } from "next/server";

import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { createProviderSource, listProviderSources } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireOperatorRequest(request);
    return NextResponse.json({ sources: await listProviderSources() });
  } catch (error) {
    return providerError(error, "provider_sources_failed");
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const source = await createProviderSource({
      authMode: body.authMode,
      credentialRef: body.credentialRef,
      endpointUrl: body.endpointUrl,
      name: body.name,
      sourceType: body.sourceType,
    });
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return providerError(error, "provider_source_create_failed");
  }
}

function providerError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json(
    { error: message },
    { status: isOperatorAccessError(error) ? error.status : 400 },
  );
}
