import { NextRequest, NextResponse } from "next/server";

import { claimCsprDeposit } from "@/server/claim-deposit";

export const dynamic = "force-dynamic";

// Credit a native CSPR deposit to a key by deploy hash. Idempotent — claiming the
// same deploy twice returns already_claimed and credits nothing further.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const keyId = typeof body.keyId === "string" ? body.keyId.trim() : "";
  const deployHash = typeof body.deployHash === "string" ? body.deployHash.trim() : "";
  if (!keyId || !deployHash) {
    return NextResponse.json({ error: "keyId and deployHash are required" }, { status: 400 });
  }
  try {
    const result = await claimCsprDeposit(keyId, deployHash);
    const status = result.status === "credited" || result.status === "already_claimed" ? 200 : 422;
    return NextResponse.json(result, { status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "claim_failed" }, { status: 500 });
  }
}
