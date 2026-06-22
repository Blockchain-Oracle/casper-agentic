import { NextRequest, NextResponse } from "next/server";
import type { ReceiptStatus } from "@/lib/types";
import { listReceiptDetails } from "@/server/receipt-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status") as ReceiptStatus | null;
  const rows = await listReceiptDetails();
  const filtered = status ? rows.filter((detail) => detail.receipt.status === status) : rows;

  return NextResponse.json({
    network: "casper:casper-test",
    receipts: filtered,
  });
}
