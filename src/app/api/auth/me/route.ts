import { NextResponse } from "next/server";

import { ownerSessionsEnabled } from "@/server/wallet-session";
import { readOwnerFromRequest } from "@/server/owner-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return NextResponse.json({
    enabled: ownerSessionsEnabled(),
    identity: readOwnerFromRequest(request),
  });
}
