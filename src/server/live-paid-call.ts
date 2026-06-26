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
import { evaluateLivePaidCallPolicy } from "./live-paid-call-policy";
import { callMcpTool, discoverMcpTools } from "./mcp-client";
import {
  persistAttempt,
  persistAudit,
  persistCasperProof,
  persistPolicyDecision,
  persistX402Record,
  updateAttemptStatus,
} from "./receipt-store";
import { buildSignerForWallet } from "./wallet-signer";
import { getAgentWalletRecord } from "./wallet-store";
import { X402FacilitatorClient } from "./x402-facilitator";
import { buildPaymentRequirements, createCasperPaymentPayload, type ClientCasperSigner } from "./x402-payment";

export { PaidCallInputError, isPaidCallInputError } from "./live-paid-call-input";
export type { PaidCallInput } from "./live-paid-call-input";

export async function runLivePaidToolCall(input: PaidCallInput) {
  const config = requireIntegrationConfig();
  const facilitator = new X402FacilitatorClient(config);
  const csprCloud = new CsprCloudClient(config);
  const supported = await facilitator.supported();
  if (!supported.kinds.some((kind) => kind.network === config.casperNetwork && kind.scheme === "exact")) {
    throw new Error(`CSPR.cloud facilitator does not advertise ${config.casperNetwork} exact support`);
  }

  const { args, endpointUrl, toolName, walletId } = requireLivePaidCallInput(input);
  if (endpointUrl !== config.mcpUrl) {
    throw new PaidCallInputError("Phase 3 paid execution is limited to the configured MCP endpoint");
  }

  const tools = await discoverMcpTools(endpointUrl);
  const tool = tools.find((item) => item.name === toolName);
  if (!tool) throw new Error(`Remote MCP endpoint did not expose ${toolName}`);

  const selectedWallet = await getAgentWalletRecord(walletId);
  if (!selectedWallet) throw new PaidCallInputError("selected wallet not found");
  const walletAccountHash = normalizeCasperAccountHash(selectedWallet.accountHash);
  const paymentRequirements = buildPaymentRequirements(config);
  const attempt = await persistAttempt({
    amount: paymentRequirements.amount,
    asset: paymentRequirements.asset,
    client: "phase-3-console",
    network: paymentRequirements.network,
    providerName: "CSPR.trade MCP",
    redactedInput: redactLiveInput(args),
    status: "policy_pending",
    toolName,
    walletAccountHash,
  });

  const blockAttempt = async (reason: string, audit: string, evidence: Record<string, unknown> = {}) => {
    await persistPolicyDecision(attempt.id, false, reason, {
      selectedWalletId: input.walletId,
      signingMode: selectedWallet.signingMode,
      walletAccountHash,
      ...evidence,
    });
    await updateAttemptStatus(attempt.id, "blocked", reason);
    await persistAudit(attempt.id, "block", audit, { reason, selectedWalletId: input.walletId });
    return { attemptId: attempt.id, policy: { allowed: false, reason }, status: "blocked" as const };
  };

  // Signer for the selected wallet: hosted = its own decrypted key, test-signer = env PEM.
  // The signer's account hash must equal the selected wallet — replaces the old single-signer gate.
  let signer: ClientCasperSigner;
  try {
    signer = await buildSignerForWallet(config, selectedWallet);
  } catch (error) {
    return blockAttempt(
      error instanceof Error ? error.message : "selected wallet cannot sign server-side",
      "Selected wallet cannot sign server-side",
    );
  }
  const signerHash = normalizeCasperAccountHash(signer.accountAddress());
  if (signerHash !== walletAccountHash) {
    return blockAttempt("signer key does not match the selected wallet", "Signer key does not match selected wallet", {
      signerAccountHash: signerHash,
    });
  }

  const account = await csprCloud.getAccount(walletAccountHash);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, config.paymentAsset);
  const assetBalance = BigInt(ownerships[0]?.balance ?? "0");
  const gasBalance = BigInt(account.balance ?? "0");

  const { evidence, policy } = await evaluateLivePaidCallPolicy({
    assetBalance,
    config,
    gasBalance,
    toolName,
    walletAccountHash,
  });
  await persistPolicyDecision(attempt.id, policy.allowed, policy.reason, evidence);

  if (!policy.allowed) {
    await updateAttemptStatus(attempt.id, "blocked", policy.reason);
    await persistAudit(attempt.id, "block", "Spend policy blocked before signing", { reason: policy.reason });
    return { attemptId: attempt.id, policy, status: "blocked" };
  }

  const resourceUrl = `${endpointUrl}#${toolName}`;
  const payment = await createCasperPaymentPayload(config, resourceUrl, signer);
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
    await persistAudit(attempt.id, "fail", "x402 verify failed", { reason });
    return { attemptId: attempt.id, status: "verify_failed", verifyResponse };
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
    await persistAudit(attempt.id, "fail", "x402 settle failed", { reason });
    return { attemptId: attempt.id, settleResponse, status: "settle_failed" };
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
    await persistAudit(attempt.id, "warn", "Casper proof pending after settlement", {
      deployHash: settleResponse.transaction,
      reason: proof.error,
    });
    return { attemptId: attempt.id, explorerUrl, status: "raw_proof_unavailable" };
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
    await persistAudit(attempt.id, "fail", "Upstream MCP tool failed after settlement", { toolName });
    return { attemptId: attempt.id, explorerUrl, status: "upstream_failed" };
  }

  await updateAttemptStatus(attempt.id, "settled", undefined, { text: result.text });
  await persistAudit(attempt.id, "ok", "Paid tool call settled with Casper proof", {
    deployHash: settleResponse.transaction,
    toolName,
  });
  return { attemptId: attempt.id, explorerUrl, status: "settled" };
}
