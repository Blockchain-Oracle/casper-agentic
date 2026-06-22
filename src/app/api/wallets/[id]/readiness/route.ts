import { NextResponse } from "next/server";

import { getRuntimeConfig } from "@/server/env";
import { getWalletReadiness } from "@/server/wallet-readiness";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) {
    return NextResponse.json({ error: "CSPR_CLOUD_API_KEY is required" }, { status: 503 });
  }

  const { id } = await context.params;
  try {
    const readiness = await getWalletReadiness(config, id);
    return NextResponse.json(readiness);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wallet_readiness_failed" },
      { status: 502 },
    );
  }
}
