import { verifyApiKey, verifySelectedApiKey } from "./api-keys";
import { CsprCloudClient } from "./cspr-cloud";
import { normalizeCasperAccountHash } from "./casper-account";
import { resolveCasperProof } from "./casper-proof";
import { requireIntegrationConfig } from "./env";
import {
  redactLiveInput,
  requireLivePaidCallInput,
  type PaidCallInput,
} from "./live-paid-call-input";
import { callMcpTool, discoverMcpTools } from "./mcp-client";
import { getProviderSourceRecord, getSourceByEndpoint, getToolByName } from "./provider-store";
import { callRestTool, parseRestOperation } from "./rest-tool";
import {
  persistAttempt,
  persistCasperProof,
  persistX402Record,
  updateAttemptStatus,
} from "./receipt-store";
import { X402FacilitatorClient } from "./x402-facilitator";
import {
  buildPaymentRequirements,
  createCasperPaymentPayload,
  getConfiguredSignerAddress,
} from "./x402-payment";

export { PaidCallInputError, isPaidCallInputError } from "./live-paid-call-input";
export type { PaidCallInput } from "./live-paid-call-input";

/** Gas floor (motes) the gateway wallet must keep to cover a settle deploy. */
const MIN_GAS_MOTES = BigInt("5000000000");
type ResolvedTool = NonNullable<Awaited<ReturnType<typeof getToolByName>>>;
type ToolPrice = NonNullable<ResolvedTool["price"]>;

/**
 * Run a paid tool call settled by the GATEWAY's own Testnet wallet (the env PEM
 * signer). The API key authorizes the caller; the gateway pays. No per-user
 * wallet selection and no spend policy — the funding-readiness guard below is the
 * only pre-settlement gate. Proven verify → settle → Casper proof flow.
 */
export async function runGatewayPaidCall(input: PaidCallInput) {
  const { args, endpointUrl, sourceId, toolName } = requireLivePaidCallInput(input);

  // Resolve the registered source to dispatch the tool execution: MCP sources are
  // discovered + called over JSON-RPC; OpenAPI sources run a REST call from the
  // operation stored at register time. Settlement (x402) is identical either way.
  // Prefer the explicit source id (multiple sources can share one endpoint URL).
  const source = sourceId ? await getProviderSourceRecord(sourceId) : await getSourceByEndpoint(endpointUrl);
  const providerName = source?.name ?? "MCP source";
  const registeredTool = source ? await getToolByName(source.id, toolName) : null;
  if (source && (!registeredTool || registeredTool.status !== "published")) {
    throw new Error(`Tool ${toolName} is not published for ${source.name}`);
  }

  let execute: () => Promise<{ isError: boolean; text?: string; result?: unknown }>;
  if (source?.sourceType === "openapi") {
    const operation = registeredTool ? parseRestOperation(registeredTool.upstreamTarget) : null;
    if (!operation) throw new Error(`OpenAPI source did not expose ${toolName}`);
    execute = async () => {
      const rest = await callRestTool(operation, args);
      // Shape a REST response as an MCP CallToolResult so the hosted MCP server can return it.
      return { isError: rest.isError, result: { content: [{ text: rest.text, type: "text" }] }, text: rest.text };
    };
  } else {
    const tools = await discoverMcpTools(endpointUrl);
    if (!tools.some((item) => item.name === toolName)) {
      throw new Error(`Remote MCP endpoint did not expose ${toolName}`);
    }
    execute = () => callMcpTool(endpointUrl, toolName, args);
  }

  if (registeredTool && !registeredTool.price) {
    const result = await execute();
    if (result.isError) {
      return { reason: "tool returned an error", result: result.result, status: "upstream_failed" as const };
    }
    return { result: result.result, status: "free" as const };
  }

  const config = requireIntegrationConfig();
  const requirements = registeredTool?.price ? paymentRequirementsFromPrice(registeredTool.price) : buildPaymentRequirements(config);
  const facilitator = new X402FacilitatorClient(config);
  const csprCloud = new CsprCloudClient(config);
  const supported = await facilitator.supported();
  if (!supported.kinds.some((kind) => kind.network === requirements.network && kind.scheme === requirements.scheme)) {
    throw new Error(`CSPR.cloud facilitator does not advertise ${requirements.network} ${requirements.scheme} support`);
  }

  const gatewayHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));

  // API-key path: an agent presents a casper_ key. Verify scope (allowed tools,
  // spend cap, expiry) BEFORE settling, and charge the call to that key. A rejected
  // key (revoked/expired/over-cap/out-of-scope) throws an ApiKeyError with no settlement.
  let client = input.client ?? "gateway-console";
  if (input.apiKey) {
    const keyId = await verifyApiKey(input.apiKey, { amountMotes: requirements.amount, toolName });
    client = `key:${keyId}`;
  } else if (input.apiKeyId) {
    const keyId = await verifySelectedApiKey(input.apiKeyId, { amountMotes: requirements.amount, toolName });
    client = `key:${keyId}`;
  }

  const attempt = await persistAttempt({
    amount: requirements.amount,
    asset: requirements.asset,
    client,
    network: requirements.network,
    providerName,
    redactedInput: redactLiveInput(args),
    status: "policy_pending",
    toolName,
    walletAccountHash: gatewayHash,
  });

  const blocked = async (reason: string) => {
    await updateAttemptStatus(attempt.id, "blocked", reason);
    return { attemptId: attempt.id, reason, status: "blocked" as const };
  };

  // Funding readiness — the gateway wallet must hold WCSPR (asset) + CSPR (gas).
  const account = await csprCloud.getAccount(gatewayHash);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, requirements.asset);
  const assetBalance = BigInt(ownerships[0]?.balance ?? "0");
  const gasBalance = BigInt(account.balance ?? "0");
  if (assetBalance < BigInt(requirements.amount)) {
    return blocked("This gateway cannot settle paid calls right now: the gateway payment account needs WCSPR.");
  }
  if (gasBalance < MIN_GAS_MOTES) {
    return blocked("This gateway cannot settle paid calls right now: the gateway payment account needs CSPR gas.");
  }

  const resourceUrl = `${endpointUrl}#${toolName}`;
  const payment = await createCasperPaymentPayload(config, resourceUrl, undefined, requirements);
  const verifyResponse = await facilitator.verify({
    paymentPayload: payment.paymentPayload,
    paymentRequirements: payment.paymentRequirements,
  });
  await persistX402Record({
    attemptId: attempt.id,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload: payment.paymentPayload,
    paymentRequirements: payment.paymentRequirements,
    verifyResponse,
  });
  if (!verifyResponse.isValid) {
    const reason = verifyResponse.invalidReason ?? "verify_failed";
    await updateAttemptStatus(attempt.id, "verify_failed", reason);
    return { attemptId: attempt.id, status: "verify_failed" as const, verifyResponse };
  }

  const settleResponse = await facilitator.settle({
    paymentPayload: payment.paymentPayload,
    paymentRequirements: payment.paymentRequirements,
  });
  await persistX402Record({
    attemptId: attempt.id,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload: payment.paymentPayload,
    paymentRequirements: payment.paymentRequirements,
    settleResponse,
    verifyResponse,
  });
  if (!settleResponse.success || !settleResponse.transaction) {
    const reason = settleResponse.errorReason ?? "settle_failed";
    await updateAttemptStatus(attempt.id, "settle_failed", reason);
    return { attemptId: attempt.id, settleResponse, status: "settle_failed" as const };
  }

  const explorerUrl = `https://testnet.cspr.live/deploy/${settleResponse.transaction}`;

  // Payment settled on-chain — run the upstream tool NOW, independent of explorer
  // proof indexing, so the caller always gets the result they paid for.
  const result = await execute();

  // Resolve + persist the Casper proof (best-effort; indexing can lag the settle).
  const proof = await resolveCasperProof(csprCloud, {
    asset: requirements.asset,
    deployHash: settleResponse.transaction,
  });
  if (proof.deploy) {
    await persistCasperProof({
      attemptId: attempt.id,
      deploy: proof.deploy,
      deployHash: proof.deploy.deploy_hash,
      explorerUrl,
      ftAction: proof.ftAction,
      proofStatus: proof.deploy.status,
    });
  } else {
    await persistCasperProof({
      attemptId: attempt.id,
      deployHash: settleResponse.transaction,
      explorerUrl,
      proofStatus: "pending_indexing",
    });
  }

  if (result.isError) {
    await updateAttemptStatus(attempt.id, "upstream_failed", "tool returned an error", { text: result.text });
    return { attemptId: attempt.id, explorerUrl, result: result.result, status: "upstream_failed" as const };
  }
  if (!proof.deploy) {
    await updateAttemptStatus(attempt.id, "raw_proof_unavailable", "Casper proof pending CSPR.cloud indexing", { text: result.text });
    return { attemptId: attempt.id, explorerUrl, result: result.result, status: "raw_proof_unavailable" as const };
  }
  await updateAttemptStatus(attempt.id, "settled", undefined, { text: result.text });
  return { attemptId: attempt.id, explorerUrl, result: result.result, status: "settled" as const };
}

function paymentRequirementsFromPrice(price: ToolPrice) {
  return {
    amount: price.amount,
    asset: price.asset,
    extra: isRecord(price.extra) ? price.extra : {},
    maxTimeoutSeconds: price.maxTimeoutSeconds,
    network: price.network as `${string}:${string}`,
    payTo: price.payTo,
    scheme: price.scheme as "exact",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
