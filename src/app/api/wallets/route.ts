import { NextRequest, NextResponse } from "next/server";

import { getRuntimeConfig } from "@/server/env";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { createAgentWallet, listAgentWallets } from "@/server/wallet-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireOperatorRequest(request);
    return NextResponse.json({ wallets: await listAgentWallets() });
  } catch (error) {
    return walletError(error, "wallets_failed");
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const config = getRuntimeConfig();
    rejectNetworkOverride(body, config.casperNetwork);
    const wallet = await createAgentWallet({
      accountHash: body.accountHash,
      label: body.label,
      network: config.casperNetwork,
      publicKey: body.publicKey,
      signingMode: body.signingMode ?? "external",
    });
    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error) {
    return walletError(error, "wallet_create_failed");
  }
}

function rejectNetworkOverride(body: Record<string, unknown>, network: string) {
  if (body.network !== undefined && body.network !== network) {
    throw new Error("wallet network is server-owned for this phase");
  }
}

function walletError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json(
    { error: message },
    { status: isOperatorAccessError(error) ? error.status : 400 },
  );
}
