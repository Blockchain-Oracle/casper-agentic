import { NextResponse } from "next/server";

import { createNonce } from "@/server/wallet-session";

export const dynamic = "force-dynamic";

// Issue a server-signed nonce + the human message the wallet will sign.
export async function POST() {
  const issued = createNonce();
  if (!issued) {
    return NextResponse.json({ error: "owner sessions are not configured" }, { status: 503 });
  }
  return NextResponse.json(issued);
}
