import { CsprCloudClient } from "./cspr-cloud";
import { normalizeCasperAccountHash } from "./casper-account";
import { resolveCasperProof } from "./casper-proof";
import { requireIntegrationConfig } from "./env";
import {
  PaidCallInputError,
  redactLiveInput,
  requireLivePaidCallInput,
  type PaidCallInput,
} from "./live-paid-call-input";
import { callMcpTool, discoverMcpTools } from "./mcp-client";
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
  if (endpointUrl !== config.mcpUrl) {
    throw new PaidCallInputError("Paid execution is limited to the configured MCP endpoint");
  }

  const tools = await discoverMcpTools(endpointUrl);
  const tool = tools.find((item) => item.name === toolName);
  if (!tool) throw new Error(`Remote MCP endpoint did not expose ${toolName}`);

  const gatewayHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const requirements = buildPaymentRequirements(config);
  const attempt = await persistAttempt({
    amount: requirements.amount,
    asset: requirements.asset,
    client: input.client ?? "gateway-console",
    network: requirements.network,
    providerName: "CSPR.trade MCP",
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

  const result = await callMcpTool(endpointUrl, toolName, args);
  if (result.isError) {
    await updateAttemptStatus(attempt.id, "upstream_failed", "MCP tool returned an error", { text: result.text });
    return { attemptId: attempt.id, explorerUrl, status: "upstream_failed" as const };
  }

  await updateAttemptStatus(attempt.id, "settled", undefined, { text: result.text });
  return { attemptId: attempt.id, explorerUrl, status: "settled" as const };
}
