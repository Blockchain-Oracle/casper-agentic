import { NextRequest, NextResponse } from "next/server";
import { receipts } from "@/lib/fixtures";
import { buildReceiptDetail } from "@/lib/receipt-detail";
import type { ReceiptStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status") as ReceiptStatus | null;
  const rows = status ? receipts.filter((receipt) => receipt.status === status) : receipts;

  return NextResponse.json({
    network: "casper:casper-test",
    receipts: rows.map((receipt) => buildReceiptDetail(receipt)),
  });
}
