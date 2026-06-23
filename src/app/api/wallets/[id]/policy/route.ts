import { NextResponse } from "next/server";

import { getRuntimeConfig } from "@/server/env";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";
import { createSpendPolicy, getLatestSpendPolicyForWalletId } from "@/server/spend-policy-store";
import { getAgentWalletRecord } from "@/server/wallet-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireOperatorRequest(request);
    const wallet = await resolveWallet(context);
    const policy = await getLatestSpendPolicyForWalletId(wallet.id);
    return NextResponse.json({ policy, wallet: walletView(wallet) });
  } catch (error) {
    return policyError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const config = getRuntimeConfig();
    const wallet = await resolveWallet(context);
    rejectClientPaymentScope(body, config.casperNetwork, config.paymentAsset);
    const policy = await createSpendPolicy({
      allowedAsset: config.paymentAsset,
      allowedNetwork: config.casperNetwork,
      allowedTools: body.allowedTools ?? [],
      dailyLimit: body.dailyLimit,
      disabled: body.disabled,
      maxPerCall: body.maxPerCall,
      sessionLimit: body.sessionLimit,
      walletId: wallet.id,
    });
    return NextResponse.json({ policy, wallet: walletView(wallet) }, { status: 201 });
  } catch (error) {
    return policyError(error);
  }
}

async function resolveWallet(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const wallet = await getAgentWalletRecord(id);
  if (!wallet) throw new PolicyRouteError("wallet profile not found", 404);
  return wallet;
}

function rejectClientPaymentScope(body: Record<string, unknown>, network: string, asset: string) {
  if (body.allowedNetwork !== undefined && body.allowedNetwork !== network) {
    throw new PolicyRouteError("allowed network is server-owned for this phase", 400);
  }
  if (body.allowedAsset !== undefined && body.allowedAsset !== asset) {
    throw new PolicyRouteError("allowed asset is server-owned for this phase", 400);
  }
}

function walletView(wallet: Awaited<ReturnType<typeof getAgentWalletRecord>>) {
  if (!wallet) return null;
  return {
    accountHash: wallet.accountHash,
    id: wallet.id,
    label: wallet.label,
    signingMode: wallet.signingMode,
  };
}

function policyError(error: unknown) {
  const message = error instanceof Error ? error.message : "wallet_policy_failed";
  const status = error instanceof PolicyRouteError ? error.status : isOperatorAccessError(error) ? error.status : 400;
  return NextResponse.json({ error: message }, { status });
}

class PolicyRouteError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
