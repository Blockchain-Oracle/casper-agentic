import { NextResponse } from "next/server";

import { hasDatabaseUrl } from "@/db/client";
import { getIntegrationConfigStatus, getRuntimeConfig } from "@/server/env";
import { X402FacilitatorClient } from "@/server/x402-facilitator";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getRuntimeConfig();
  const required = getIntegrationConfigStatus(config);
  const facilitator = await checkFacilitator(config);

  return NextResponse.json({
    casper: {
      network: config.casperNetwork,
      paymentAsset: config.paymentAsset,
      paymentAssetSymbol: config.paymentAssetSymbol,
      restBaseUrl: config.csprCloudRestBaseUrl,
    },
    database: { configured: hasDatabaseUrl() },
    facilitator,
    required,
  });
}

async function checkFacilitator(config: ReturnType<typeof getRuntimeConfig>) {
  if (!config.csprCloudApiKey) return { configured: false, reachable: false, supported: false };
  try {
    const supported = await new X402FacilitatorClient(config).supported();
    return {
      configured: true,
      reachable: true,
      supported: supported.kinds.some(
        (kind) => kind.network === config.casperNetwork && kind.scheme === "exact",
      ),
    };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "facilitator_check_failed",
      reachable: false,
      supported: false,
    };
  }
}
