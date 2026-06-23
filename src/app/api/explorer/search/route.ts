import { NextRequest, NextResponse } from "next/server";

import { searchExplorer } from "@/server/explorer-search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const result = await searchExplorer(query);
  const status = result.source === "unconfigured" ? 503 : result.source === "not_found" ? 404 : 200;
  return NextResponse.json(result, { status });
}
