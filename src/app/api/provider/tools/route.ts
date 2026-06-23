import { NextRequest, NextResponse } from "next/server";

import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { listProviderTools } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireOperatorRequest(request);
    const sourceId = request.nextUrl.searchParams.get("sourceId") ?? undefined;
    return NextResponse.json({ tools: await listProviderTools(sourceId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_tools_failed";
    return NextResponse.json(
      { error: message },
      { status: isOperatorAccessError(error) ? error.status : 400 },
    );
  }
}
