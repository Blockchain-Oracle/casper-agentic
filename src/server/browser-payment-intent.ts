import { PublicKey } from "casper-js-sdk";

import { hasDatabaseUrl } from "@/db/client";

import { buildCSPRClickPaymentIntentParams } from "./browser-payment-intent-typed-data";
import { normalizeCasperAccountHash } from "./casper-account";
import { CsprCloudClient } from "./cspr-cloud";
import { getRuntimeConfig, type RuntimeConfig } from "./env";
import { redactLiveInput } from "./live-paid-call-input";
import { evaluateLivePaidCallPolicy } from "./live-paid-call-policy";
import { discoverMcpTools } from "./mcp-client";
import { hashPaidCallInput } from "./paid-call-input-hash";
import { persistAttempt, persistAudit, persistPolicyDecision, updateAttemptStatus } from "./receipt-store";
import { getAgentWalletRecord } from "./wallet-store";
import { buildPaymentRequirements } from "./x402-payment";

export interface BrowserPaymentIntentInput {
  args: Record<string, unknown>;
  endpointUrl: string;
  toolName: string;
  walletId: string;
}

export class BrowserPaymentIntentInputError extends Error {
  readonly status = 400;
}

export function isBrowserPaymentIntentInputError(error: unknown): error is BrowserPaymentIntentInputError {
  return error instanceof BrowserPaymentIntentInputError;
}

export async function createBrowserPaymentIntent(input: BrowserPaymentIntentInput) {
  const config = requireBrowserPaymentIntentConfig();
  const { args, endpointUrl, toolName, walletId } = requireIntentInput(input);
  if (endpointUrl !== config.mcpUrl) {
    throw new BrowserPaymentIntentInputError("browser payment intent is limited to the configured MCP endpoint");
  }

  const tools = await discoverMcpTools(endpointUrl);
  if (!tools.some((tool) => tool.name === toolName)) throw new Error(`Remote MCP endpoint did not expose ${toolName}`);

  const wallet = await getAgentWalletRecord(walletId);
  if (!wallet) throw new BrowserPaymentIntentInputError("selected wallet not found");

  const walletAccountHash = normalizeCasperAccountHash(wallet.accountHash);
  const paymentRequirements = buildPaymentRequirements(config);
  const inputHash = hashPaidCallInput(args);
  const attempt = await persistAttempt({
    amount: paymentRequirements.amount,
    asset: paymentRequirements.asset,
    client: "csprclick-browser-intent",
    network: paymentRequirements.network,
    providerName: "CSPR.trade MCP",
    redactedInput: redactLiveInput(args),
    status: "policy_pending",
    toolName,
    walletAccountHash,
  });

  const hardBlock = browserWalletBlock(wallet, walletAccountHash, config);
  if (hardBlock) return blockIntent(attempt.id, hardBlock.reason, { evidence: hardBlock.evidence });

  const csprCloud = new CsprCloudClient(config);
  const account = await csprCloud.getAccount(walletAccountHash);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, config.paymentAsset);
  const { evidence, policy } = await evaluateLivePaidCallPolicy({
    assetBalance: BigInt(ownerships[0]?.balance ?? "0"),
    config,
    gasBalance: BigInt(account.balance ?? "0"),
    toolName,
    walletAccountHash,
  });
  await persistPolicyDecision(attempt.id, policy.allowed, policy.reason, {
    ...evidence,
    browserPaymentIntent: { inputHash },
  });

  if (!policy.allowed) return blockIntent(attempt.id, policy.reason, { recordPolicyDecision: false });

  await persistAudit(attempt.id, "info", "Browser payment intent ready after policy", {
    signingMode: wallet.signingMode,
    toolName,
    walletId: wallet.id,
  });

  const resourceUrl = `${endpointUrl}#${toolName}`;
  return {
    attemptId: attempt.id,
    paymentRequirements,
    policy,
    resource: { url: resourceUrl },
    signing: {
      expectedAccountHash: walletAccountHash,
      expectedPublicKey: wallet.publicKey?.toLowerCase(),
      signTypedDataParams: buildCSPRClickPaymentIntentParams({
        payerAccountHash: walletAccountHash,
        paymentRequirements,
      }),
    },
    status: "ready_for_signature" as const,
    wallet: {
      accountHash: walletAccountHash,
      id: wallet.id,
      publicKey: wallet.publicKey?.toLowerCase(),
    },
    x402Version: 2,
  };
}

type BrowserPaymentIntentConfig = RuntimeConfig & { csprCloudApiKey: string; payeeAccountHash: string };

function requireBrowserPaymentIntentConfig(): BrowserPaymentIntentConfig {
  const config = getRuntimeConfig();
  const missing = [];
  if (!config.csprCloudApiKey) missing.push("CSPR_CLOUD_API_KEY");
  if (!hasDatabaseUrl()) missing.push("DATABASE_URL");
  if (!config.payeeAccountHash) missing.push("CASPER_PAYEE_ACCOUNT_HASH");
  if (missing.length) throw new Error(`Missing browser payment-intent configuration: ${missing.join(", ")}`);
  return config as BrowserPaymentIntentConfig;
}

function browserWalletBlock(
  wallet: Awaited<ReturnType<typeof getAgentWalletRecord>>,
  walletAccountHash: string,
  config: BrowserPaymentIntentConfig,
) {
  if (!wallet) return { evidence: {}, reason: "selected wallet not found" };
  if (wallet.network !== config.casperNetwork) {
    return { evidence: { walletNetwork: wallet.network }, reason: "selected wallet network does not match payment network" };
  }
  if (wallet.signingMode !== "browser-wallet") {
    return { evidence: { signingMode: wallet.signingMode }, reason: "selected wallet is not configured for browser signing" };
  }
  if (!wallet.publicKey) return { evidence: { walletId: wallet.id }, reason: "selected wallet public key is required" };
  if (publicKeyAccountHash(wallet.publicKey) !== walletAccountHash) {
    return { evidence: { walletId: wallet.id }, reason: "selected wallet public key does not match account hash" };
  }
  return null;
}

async function blockIntent(
  attemptId: string,
  reason: string,
  options: { evidence?: Record<string, unknown>; recordPolicyDecision?: boolean } = {},
) {
  if (options.recordPolicyDecision !== false) {
    await persistPolicyDecision(attemptId, false, reason, options.evidence ?? {});
  }
  await updateAttemptStatus(attemptId, "blocked", reason);
  await persistAudit(attemptId, "block", "Spend policy blocked before browser signing", { reason });
  return { attemptId, policy: { allowed: false, reason }, status: "blocked" as const };
}

function publicKeyAccountHash(publicKey: string) {
  try {
    return PublicKey.fromHex(publicKey).accountHash().toHex().toLowerCase();
  } catch {
    return null;
  }
}

function requireIntentInput(input: BrowserPaymentIntentInput) {
  const args = input.args && typeof input.args === "object" && !Array.isArray(input.args) ? input.args : null;
  if (!args) throw new BrowserPaymentIntentInputError("args object is required");
  return {
    args,
    endpointUrl: requireText(input.endpointUrl, "endpointUrl"),
    toolName: requireText(input.toolName, "toolName"),
    walletId: requireText(input.walletId, "walletId"),
  };
}

function requireText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new BrowserPaymentIntentInputError(`${label} is required`);
  return text;
}
