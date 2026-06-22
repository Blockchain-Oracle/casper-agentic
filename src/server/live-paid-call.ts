import { CsprCloudClient } from "./cspr-cloud";
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
import { getSpendPolicyForWallet } from "./spend-policy-store";
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
  toolName?: string;
}

export async function runLivePaidToolCall(input: PaidCallInput = {}) {
  const config = requireIntegrationConfig();
  const facilitator = new X402FacilitatorClient(config);
  const csprCloud = new CsprCloudClient(config);
  const supported = await facilitator.supported();
  if (!supported.kinds.some((kind) => kind.network === config.casperNetwork && kind.scheme === "exact")) {
    throw new Error(`CSPR.cloud facilitator does not advertise ${config.casperNetwork} exact support`);
  }

  const toolName = input.toolName ?? "get_quote";
  const tools = await discoverMcpTools(config.mcpUrl);
  const tool = tools.find((item) => item.name === toolName);
  if (!tool) throw new Error(`Remote MCP endpoint did not expose ${toolName}`);

  const payer = getConfiguredSignerAddress(config);
  const payerHash = stripAccountPrefix(payer);
  const account = await csprCloud.getAccount(payerHash);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, config.paymentAsset);
  const assetBalance = BigInt(ownerships[0]?.balance ?? "0");
  const gasBalance = BigInt(account.balance ?? "0");
  const paymentRequirements = buildPaymentRequirements(config);
  const attempt = await persistAttempt({
    amount: paymentRequirements.amount,
    asset: paymentRequirements.asset,
    client: "phase-0-console",
    network: paymentRequirements.network,
    providerName: "CSPR.trade MCP",
    redactedInput: redactInput(input.args ?? DEFAULT_GET_QUOTE_ARGS),
    status: "raw_proof_unavailable",
    toolName,
    walletAccountHash: payer,
  });

  const storedPolicy = await getSpendPolicyForWallet(payer);
  const policy = storedPolicy
    ? evaluateSpendPolicy({
        allowedAsset: storedPolicy.allowedAsset,
        allowedNetwork: storedPolicy.allowedNetwork,
        allowedTools: storedPolicy.allowedTools,
        assetBalance,
        disabled: storedPolicy.disabled,
        gasBalance,
        maxPerCall: storedPolicy.maxPerCall,
        network: config.casperNetwork,
        paymentAmount: BigInt(config.paymentAmount),
        paymentAsset: config.paymentAsset,
        toolName,
      })
    : { allowed: false, reason: "no active spend policy for wallet" };
  await persistPolicyDecision(attempt.id, policy.allowed, policy.reason, {
    assetBalance: assetBalance.toString(),
    gasBalance: gasBalance.toString(),
    policyLoaded: Boolean(storedPolicy),
    toolName,
  });

  if (!policy.allowed) {
    await updateAttemptStatus(attempt.id, "blocked", policy.reason);
    await persistAudit(attempt.id, "block", "Spend policy blocked before signing", { reason: policy.reason });
    return { attemptId: attempt.id, policy, status: "blocked" };
  }

  const resourceUrl = `${config.mcpUrl}#${toolName}`;
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

  const deploy = await csprCloud.getDeploy(settleResponse.transaction);
  const ftActions = await csprCloud.getContractPackageTokenActions(config.paymentAsset, settleResponse.transaction);
  const explorerUrl = `https://testnet.cspr.live/deploy/${settleResponse.transaction}`;
  await persistCasperProof({
    attemptId: attempt.id,
    deploy,
    deployHash: deploy.deploy_hash,
    explorerUrl,
    ftAction: ftActions[0],
    proofStatus: deploy.status,
  });

  const result = await callMcpTool(config.mcpUrl, toolName, input.args ?? DEFAULT_GET_QUOTE_ARGS);
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

function stripAccountPrefix(accountHash: string) {
  return accountHash.startsWith("00") && accountHash.length === 66 ? accountHash.slice(2) : accountHash;
}

function redactInput(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : value]),
  );
}
