import { loadEnvConfig } from "@next/env";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import { NextRequest } from "next/server";

import { POST } from "../src/app/api/mcp/[sourceId]/route";
import { closeDb } from "../src/db/client";
import { getReceiptDetail } from "../src/server/receipt-store";
import { normalizeCasperAccountHash } from "../src/server/casper-account";
import { createEndpointAccessKey } from "../src/server/endpoint-access";
import { requireIntegrationConfig } from "../src/server/env";
import { discoverMcpTools } from "../src/server/mcp-client";
import {
  createProviderSource,
  persistDiscoveredMcpTools,
  publishProviderTool,
  saveToolPrice,
} from "../src/server/provider-store";
import { createSpendPolicy, getEffectiveSpendPolicyViewForWallet } from "../src/server/spend-policy-store";
import { createAgentWallet, listAgentWallets } from "../src/server/wallet-store";
import { buildPaymentRequirements, createCasperPaymentPayload, getConfiguredSignerAddress } from "../src/server/x402-payment";

loadEnvConfig(process.cwd());

async function main() {
  const config = requireIntegrationConfig();
  const signerHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const wallet = await ensureSignerWallet(signerHash, config.casperNetwork);
  await ensureAllowPolicy(wallet.id, signerHash, config);
  const endpoint = await publishSmokeEndpoint(config);
  const requestUrl = `${hostedSmokeBaseUrl()}/api/mcp/${endpoint.sourceId}`;
  const payment = await createCasperPaymentPayload(config, `${requestUrl}#get_quote`);
  const response = await POST(
    new NextRequest(requestUrl, {
      body: JSON.stringify({
        id: "hosted-smoke-1",
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          arguments: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
          name: "get_quote",
        },
      }),
      headers: {
        authorization: `Bearer ${endpoint.token}`,
        "content-type": "application/json",
        "payment-signature": encodePaymentSignatureHeader(payment.paymentPayload),
      },
      method: "POST",
    }),
    { params: Promise.resolve({ sourceId: endpoint.sourceId }) },
  );
  const body = await response.json();
  const receiptId = response.headers.get("x-casper-gw-receipt-id");
  const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
  const detail = receiptId ? await getReceiptDetail(receiptId) : undefined;
  const result = {
    deployHash: detail?.receipt.hash,
    explorerUrl: detail?.receipt.hash ? `https://testnet.cspr.live/deploy/${detail.receipt.hash}` : undefined,
    httpStatus: response.status,
    paymentResponse: Boolean(paymentResponse),
    receiptId,
    receiptStatus: detail?.receipt.status,
    sourceId: endpoint.sourceId,
    toolId: endpoint.toolId,
  };

  console.log(JSON.stringify(result, null, 2));
  if (
    response.status !== 200 ||
    !paymentResponse ||
    !receiptId ||
    detail?.receipt.status !== "settled" ||
    !detail.receipt.hash ||
    isJsonRpcError(body)
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});

async function publishSmokeEndpoint(config: ReturnType<typeof requireIntegrationConfig>) {
  const source = await createProviderSource({
    authMode: "none",
    endpointUrl: config.mcpUrl,
    name: `Phase 7 hosted smoke ${new Date().toISOString()}`,
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
  const { token } = await createEndpointAccessKey({
    label: "Phase 7 hosted smoke",
    scope: { sourceId: source.id, toolIds: [published.id] },
    sourceId: source.id,
  });
  return { sourceId: source.id, token, toolId: published.id };
}

async function ensureSignerWallet(accountHash: string, network: string) {
  const wallets = await listAgentWallets();
  const existing = wallets.find((wallet) => normalizeCasperAccountHash(wallet.accountHash) === accountHash);
  if (existing) return existing;
  return createAgentWallet({
    accountHash,
    label: "Phase 7 hosted smoke signer",
    network,
    signingMode: "test-signer",
  });
}

async function ensureAllowPolicy(
  walletId: string,
  accountHash: string,
  config: ReturnType<typeof requireIntegrationConfig>,
) {
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

function hostedSmokeBaseUrl() {
  return (process.env.CASPER_GW_HOSTED_SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function isJsonRpcError(body: unknown) {
  return typeof body === "object" && body !== null && "error" in body;
}
