import { CsprCloudClient } from "./cspr-cloud";
import { normalizeCasperAccountHash } from "./casper-account";
import { resolveCasperProof } from "./casper-proof";
import { requireIntegrationConfig } from "./env";
import { callMcpTool, discoverMcpTools } from "./mcp-client";
import { evaluateSpendPolicy } from "./policy";
import {
  persistAttempt,
  persistAudit,
  persistCasperProof,
  persistPolicyDecision,
  persistX402Record,
  updateAttemptStatus,
} from "./receipt-store";
import { getSpendPolicyForWallet, getWalletDailySpend } from "./spend-policy-store";
import { getAgentWalletRecord } from "./wallet-store";
import { X402FacilitatorClient } from "./x402-facilitator";
import { buildPaymentRequirements, createCasperPaymentPayload, getConfiguredSignerAddress } from "./x402-payment";

const DEFAULT_GET_QUOTE_ARGS = {
  amount: "1",
  token_in: "CSPR",
  token_out: "WCSPR",
  type: "exact_in",
};

export interface PaidCallInput {
  args?: Record<string, unknown>;
  endpointUrl?: string;
  toolName?: string;
  walletId?: string;
}

export async function runLivePaidToolCall(input: PaidCallInput = {}) {
  const config = requireIntegrationConfig();
  const facilitator = new X402FacilitatorClient(config);
  const csprCloud = new CsprCloudClient(config);
  const supported = await facilitator.supported();
  if (!supported.kinds.some((kind) => kind.network === config.casperNetwork && kind.scheme === "exact")) {
    throw new Error(`CSPR.cloud facilitator does not advertise ${config.casperNetwork} exact support`);
  }

  const endpointUrl = input.endpointUrl?.trim() || config.mcpUrl;
  const toolName = input.toolName?.trim() || "get_quote";
  const tools = await discoverMcpTools(endpointUrl);
  const tool = tools.find((item) => item.name === toolName);
  if (!tool) throw new Error(`Remote MCP endpoint did not expose ${toolName}`);

  const signer = getConfiguredSignerAddress(config);
  const signerHash = normalizeCasperAccountHash(signer);
  const selectedWallet = input.walletId ? await getAgentWalletRecord(input.walletId) : null;
  if (input.walletId && !selectedWallet) throw new Error("selected wallet not found");
  const walletAccountHash = selectedWallet ? normalizeCasperAccountHash(selectedWallet.accountHash) : signerHash;
  const paymentRequirements = buildPaymentRequirements(config);
  const attempt = await persistAttempt({
    amount: paymentRequirements.amount,
    asset: paymentRequirements.asset,
    client: "phase-3-console",
    network: paymentRequirements.network,
    providerName: "CSPR.trade MCP",
    redactedInput: redactInput(input.args ?? DEFAULT_GET_QUOTE_ARGS),
    status: "policy_pending",
    toolName,
    walletAccountHash,
  });

  if (walletAccountHash !== signerHash) {
    const reason = "selected wallet is not the configured local Testnet signer";
    await persistPolicyDecision(attempt.id, false, reason, {
      selectedWalletId: input.walletId,
      signerAccountHash: signerHash,
      signingMode: selectedWallet?.signingMode,
      walletAccountHash,
    });
    await updateAttemptStatus(attempt.id, "blocked", reason);
    await persistAudit(attempt.id, "block", "Selected wallet cannot sign through local Testnet signer", {
      reason,
      selectedWalletId: input.walletId,
    });
    return { attemptId: attempt.id, policy: { allowed: false, reason }, status: "blocked" };
  }

  const account = await csprCloud.getAccount(walletAccountHash);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, config.paymentAsset);
  const assetBalance = BigInt(ownerships[0]?.balance ?? "0");
  const gasBalance = BigInt(account.balance ?? "0");

  const storedPolicy = await getSpendPolicyForWallet(walletAccountHash);
  const dailySpent = storedPolicy?.dailyLimit
    ? await getWalletDailySpend(walletAccountHash, config.paymentAsset, config.casperNetwork)
    : BigInt(0);
  const policy = storedPolicy
    ? evaluateSpendPolicy({
        allowedAsset: storedPolicy.allowedAsset,
        allowedNetwork: storedPolicy.allowedNetwork,
        allowedTools: storedPolicy.allowedTools,
        assetBalance,
        dailyLimit: storedPolicy.dailyLimit,
        dailySpent,
        disabled: storedPolicy.disabled,
        gasBalance,
        maxPerCall: storedPolicy.maxPerCall,
        network: config.casperNetwork,
        paymentAmount: BigInt(config.paymentAmount),
        paymentAsset: config.paymentAsset,
        sessionLimit: storedPolicy.sessionLimit,
        sessionSpent: BigInt(0),
        toolName,
      })
    : { allowed: false, reason: "no active spend policy for wallet" };
  await persistPolicyDecision(attempt.id, policy.allowed, policy.reason, {
    assetBalance: assetBalance.toString(),
    dailyLimit: storedPolicy?.dailyLimit?.toString(),
    dailySpent: dailySpent.toString(),
    gasBalance: gasBalance.toString(),
    policyLoaded: Boolean(storedPolicy),
    sessionLimit: storedPolicy?.sessionLimit?.toString(),
    toolName,
  });

  if (!policy.allowed) {
    await updateAttemptStatus(attempt.id, "blocked", policy.reason);
    await persistAudit(attempt.id, "block", "Spend policy blocked before signing", { reason: policy.reason });
    return { attemptId: attempt.id, policy, status: "blocked" };
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

  const result = await callMcpTool(endpointUrl, toolName, input.args ?? DEFAULT_GET_QUOTE_ARGS);
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

function redactInput(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : value]),
  );
}
