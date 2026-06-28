import { verifyApiKey } from "./api-keys";
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
import { getSourceByEndpoint, getToolByName } from "./provider-store";
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

/**
 * Run a paid tool call settled by the GATEWAY's own Testnet wallet (the env PEM
 * signer). The API key authorizes the caller; the gateway pays. No per-user
 * wallet selection and no spend policy — the funding-readiness guard below is the
 * only pre-settlement gate. Proven verify → settle → Casper proof flow.
 */
export async function runGatewayPaidCall(input: PaidCallInput) {
  const config = requireIntegrationConfig();
  const facilitator = new X402FacilitatorClient(config);
  const csprCloud = new CsprCloudClient(config);
  const supported = await facilitator.supported();
  if (!supported.kinds.some((kind) => kind.network === config.casperNetwork && kind.scheme === "exact")) {
    throw new Error(`CSPR.cloud facilitator does not advertise ${config.casperNetwork} exact support`);
  }

  const { args, endpointUrl, toolName } = requireLivePaidCallInput(input);

  // Resolve the registered source to dispatch the tool execution: MCP sources are
  // discovered + called over JSON-RPC; OpenAPI sources run a REST call from the
  // operation stored at register time. Settlement (x402) is identical either way.
  const source = await getSourceByEndpoint(endpointUrl);
  const providerName = source?.name ?? "MCP source";
  let execute: () => Promise<{ isError: boolean; text?: string }>;
  if (source?.sourceType === "openapi") {
    const toolRow = await getToolByName(source.id, toolName);
    const operation = toolRow ? parseRestOperation(toolRow.upstreamTarget) : null;
    if (!operation) throw new Error(`OpenAPI source did not expose ${toolName}`);
    execute = () => callRestTool(operation, args);
  } else {
    const tools = await discoverMcpTools(endpointUrl);
    if (!tools.some((item) => item.name === toolName)) {
      throw new Error(`Remote MCP endpoint did not expose ${toolName}`);
    }
    execute = () => callMcpTool(endpointUrl, toolName, args);
  }

  const gatewayHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const requirements = buildPaymentRequirements(config);

  // API-key path: an agent presents a casper_ key. Verify scope (allowed tools,
  // spend cap, expiry) BEFORE settling, and charge the call to that key. A rejected
  // key (revoked/expired/over-cap/out-of-scope) throws an ApiKeyError with no settlement.
  let client = input.client ?? "gateway-console";
  if (input.apiKey) {
    const keyId = await verifyApiKey(input.apiKey, { amountMotes: requirements.amount, toolName });
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
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, config.paymentAsset);
  const assetBalance = BigInt(ownerships[0]?.balance ?? "0");
  const gasBalance = BigInt(account.balance ?? "0");
  if (assetBalance < BigInt(requirements.amount)) {
    return blocked("Gateway settlement wallet is low on WCSPR — top up or wrap CSPR.");
  }
  if (gasBalance < MIN_GAS_MOTES) {
    return blocked("Gateway settlement wallet is low on CSPR for gas.");
  }

  const resourceUrl = `${endpointUrl}#${toolName}`;
  const payment = await createCasperPaymentPayload(config, resourceUrl);
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
  const proof = await resolveCasperProof(csprCloud, {
    asset: config.paymentAsset,
    deployHash: settleResponse.transaction,
  });

  if (!proof.deploy) {
    await persistCasperProof({
      attemptId: attempt.id,
      deployHash: settleResponse.transaction,
      explorerUrl,
      proofStatus: "pending_indexing",
    });
    await updateAttemptStatus(attempt.id, "raw_proof_unavailable", "Casper proof pending CSPR.cloud indexing");
    return { attemptId: attempt.id, explorerUrl, status: "raw_proof_unavailable" as const };
  }

  await persistCasperProof({
    attemptId: attempt.id,
    deploy: proof.deploy,
    deployHash: proof.deploy.deploy_hash,
    explorerUrl,
    ftAction: proof.ftAction,
    proofStatus: proof.deploy.status,
  });

  const result = await execute();
  if (result.isError) {
    await updateAttemptStatus(attempt.id, "upstream_failed", "MCP tool returned an error", { text: result.text });
    return { attemptId: attempt.id, explorerUrl, status: "upstream_failed" as const };
  }

  await updateAttemptStatus(attempt.id, "settled", undefined, { text: result.text });
  return { attemptId: attempt.id, explorerUrl, status: "settled" as const };
}
