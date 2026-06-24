import { NextRequest, NextResponse } from "next/server";

import { getExternalActionFeed } from "@/server/external-action-feed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = await getExternalActionFeed({
    page: request.nextUrl.searchParams.get("page"),
    pageSize: request.nextUrl.searchParams.get("pageSize"),
  });
  const status = result.source === "unconfigured" || result.source === "upstream_error" ? 503 : 200;
  return NextResponse.json(result, { status });
}
