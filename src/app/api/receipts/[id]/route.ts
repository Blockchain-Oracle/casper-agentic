import { NextResponse } from "next/server";

import { getReceiptDetail } from "@/server/receipt-store";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const receipt = await getReceiptDetail(id);
  if (!receipt) return NextResponse.json({ error: "receipt_not_found" }, { status: 404 });
  return NextResponse.json({ receipt });
}
