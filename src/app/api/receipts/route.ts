import { NextRequest, NextResponse } from "next/server";
import { listReceiptHistory } from "@/server/receipt-history";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const history = await listReceiptHistory({
    from: params.get("from") ?? undefined,
    network: params.get("network") ?? undefined,
    page: params.get("page"),
    pageSize: params.get("pageSize"),
    provider: params.get("provider") ?? undefined,
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    to: params.get("to") ?? undefined,
    tool: params.get("tool") ?? undefined,
    wallet: params.get("wallet") ?? undefined,
  });

  return NextResponse.json(history);
}
