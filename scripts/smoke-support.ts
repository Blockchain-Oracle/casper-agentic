import { createEndpointAccessKey } from "../src/server/endpoint-access";
import type { requireIntegrationConfig } from "../src/server/env";
import { normalizeCasperAccountHash } from "../src/server/casper-account";
import { discoverMcpTools } from "../src/server/mcp-client";
import {
  createProviderSource,
  persistDiscoveredMcpTools,
  publishProviderTool,
  saveToolPrice,
} from "../src/server/provider-store";
import { createSpendPolicy, getEffectiveSpendPolicyViewForWallet } from "../src/server/spend-policy-store";
import { createAgentWallet, listAgentWallets } from "../src/server/wallet-store";
import { buildPaymentRequirements } from "../src/server/x402-payment";

type SmokeConfig = ReturnType<typeof requireIntegrationConfig>;

// Shared setup for the live payment smokes: a funded test-signer wallet, an
// allow policy, and a published CSPR.trade get_quote endpoint. An access key is
// only minted (and optionally wallet-bound) when a label is supplied.
export async function ensureSignerWallet(accountHash: string, network: string) {
  const wallets = await listAgentWallets();
  const existing = wallets.find((wallet) => normalizeCasperAccountHash(wallet.accountHash) === accountHash);
  if (existing) return existing;
  return createAgentWallet({ accountHash, label: "live smoke signer", network, signingMode: "test-signer" });
}

export async function ensureAllowPolicy(walletId: string, accountHash: string, config: SmokeConfig) {
  const current = await getEffectiveSpendPolicyViewForWallet(accountHash);
  const paymentAmount = BigInt(config.paymentAmount);
  const currentMax = current ? BigInt(current.maxPerCall) : BigInt(0);
  const acceptsTool = current?.allowedTools.includes("get_quote") ?? false;
  if (current && !current.disabled && currentMax >= paymentAmount && acceptsTool) return current;

  return createSpendPolicy({
    allowedAsset: config.paymentAsset,
    allowedNetwork: config.casperNetwork,
    allowedTools: ["get_quote"],
    maxPerCall: config.paymentAmount,
    walletId,
  });
}

export async function publishSmokeEndpoint(config: SmokeConfig, options: { keyLabel?: string; walletId?: string } = {}) {
  const source = await createProviderSource({
    authMode: "none",
    endpointUrl: config.mcpUrl,
    name: `live smoke ${new Date().toISOString()}`,
    sourceType: "mcp",
  });
  const quoteTool = (await discoverMcpTools(config.mcpUrl)).find((tool) => tool.name === "get_quote");
  if (!quoteTool) throw new Error("CSPR.trade MCP did not expose get_quote");

  const [tool] = await persistDiscoveredMcpTools(source.id, config.mcpUrl, [quoteTool]);
  const requirements = buildPaymentRequirements(config);
  await saveToolPrice({
    amount: requirements.amount,
    asset: requirements.asset,
    extra: requirements.extra,
    maxTimeoutSeconds: requirements.maxTimeoutSeconds,
    network: requirements.network,
    payTo: requirements.payTo,
    scheme: "exact",
    toolId: tool.id,
  });
  const published = await publishProviderTool(tool.id);

  let token: string | undefined;
  if (options.keyLabel) {
    ({ token } = await createEndpointAccessKey({
      label: options.keyLabel,
      scope: { sourceId: source.id, toolIds: [published.id] },
      sourceId: source.id,
      walletId: options.walletId ?? null,
    }));
  }
  return { sourceId: source.id, toolId: published.id, token, walletId: options.walletId };
}

export function smokeBaseUrl() {
  return (process.env.CASPER_GW_HOSTED_SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function isJsonRpcError(body: unknown) {
  return typeof body === "object" && body !== null && "error" in body;
}
