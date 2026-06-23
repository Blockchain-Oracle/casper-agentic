import { NextResponse } from "next/server";

import { getRuntimeConfig } from "@/server/env";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { getAgentWalletRecord } from "@/server/wallet-store";
import { getWalletReadiness } from "@/server/wallet-readiness";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireOperatorRequest(request);
    const config = getRuntimeConfig();
    if (!config.csprCloudApiKey) {
      return NextResponse.json({ error: "CSPR_CLOUD_API_KEY is required" }, { status: 503 });
    }

    const { id } = await context.params;
    const wallet = await getAgentWalletRecord(id);
    const readiness = await getWalletReadiness(config, wallet?.accountHash ?? id);
    return NextResponse.json({
      ...readiness,
      wallet: wallet
        ? {
            id: wallet.id,
            label: wallet.label,
            signingMode: wallet.signingMode,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wallet_readiness_failed" },
      { status: isOperatorAccessError(error) ? error.status : 502 },
    );
  }
}
