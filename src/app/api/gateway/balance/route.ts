import { NextResponse } from "next/server";

import { getGatewayBalance } from "@/server/gateway-balance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getGatewayBalance());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "balance_failed" }, { status: 500 });
  }
}
