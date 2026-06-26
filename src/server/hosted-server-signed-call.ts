import { normalizeCasperAccountHash } from "./casper-account";
import { requireIntegrationConfig } from "./env";
import { completeSettledHostedCall } from "./hosted-paid-call-completion";
import { evaluateHostedPolicy } from "./hosted-paid-call-policy";
import { paymentError, redactHostedInput, requirePaymentRequirements, settlePayment } from "./hosted-paid-call-support";
import type { HostedPaidToolCallInput, HostedPaidToolCallOutput } from "./hosted-paid-call-types";
import {
  persistAttempt,
  persistAudit,
  persistPolicyDecision,
  persistX402Record,
  updateAttemptStatus,
} from "./receipt-store";
import { buildSignerForWallet } from "./wallet-signer";
import { getAgentWalletRecord } from "./wallet-store";
import { X402FacilitatorClient } from "./x402-facilitator";
import { signPaymentPayload, type ClientCasperSigner } from "./x402-payment";

// Server-signs has no caller payment header — the Gateway constructs the payload.
export type ServerSignedToolCallInput = Omit<HostedPaidToolCallInput, "paymentHeader">;

/**
 * Autonomous "agent + API key" trigger: the Gateway server-signs an x402 payment
 * with the token-bound hosted wallet. Unlike the caller-signs path, policy runs
 * BEFORE signing (the payer is known up front), so a blocked call creates no
 * signature and no x402 record — the negative smoke proves policy-before-sign.
 */
export async function runHostedServerSignedToolCall(
  input: ServerSignedToolCallInput,
  walletId: string,
): Promise<HostedPaidToolCallOutput> {
  const config = requireIntegrationConfig();
  const requirements = requirePaymentRequirements(input.tool);
  const resourceUrl = `${input.requestUrl}#${input.tool.name}`;

  const wallet = await getAgentWalletRecord(walletId);
  if (!wallet) {
    return paymentError(403, -32018, "bound wallet not found", { reason: "wallet_not_found", status: "blocked" });
  }
  const payer = normalizeCasperAccountHash(wallet.accountHash);

  const attempt = await persistAttempt({
    amount: requirements.amount,
    asset: requirements.asset,
    client: "hosted-agent-key",
    network: requirements.network,
    providerName: input.endpoint.source.name,
    redactedInput: redactHostedInput(input.args),
    status: "policy_pending",
    toolName: input.tool.name,
    walletAccountHash: payer,
  });

  const blocked = async (reason: string, audit: string, code = -32014) => {
    await updateAttemptStatus(attempt.id, "blocked", reason);
    await persistAudit(attempt.id, "block", audit, { reason });
    return paymentError(403, code, "spend policy blocked settlement", { attemptId: attempt.id, reason, status: "blocked" });
  };

  // Policy BEFORE signing — a block here writes NO x402 record (no signature created).
  const policy = await evaluateHostedPolicy({ config, payer, requirements, toolName: input.tool.name });
  await persistPolicyDecision(attempt.id, policy.allowed, policy.reason, policy.evidence);
  if (!policy.allowed) return blocked(policy.reason, "Server-signed spend policy blocked before signing");

  let signer: ClientCasperSigner;
  try {
    signer = await buildSignerForWallet(config, wallet);
  } catch (error) {
    return blocked(
      error instanceof Error ? error.message : "bound wallet cannot sign server-side",
      "Bound wallet cannot sign server-side",
      -32018,
    );
  }
  if (normalizeCasperAccountHash(signer.accountAddress()) !== payer) {
    return blocked("bound wallet signer mismatch", "Bound wallet signer mismatch", -32018);
  }

  const payment = await signPaymentPayload(requirements, resourceUrl, signer);
  const facilitator = new X402FacilitatorClient(config);
  const verifyResponse = await facilitator.verify({ paymentPayload: payment.paymentPayload, paymentRequirements: requirements });
  await persistX402Record({
    attemptId: attempt.id,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload: payment.paymentPayload,
    paymentRequirements: requirements,
    verifyResponse,
  });
  if (!verifyResponse.isValid) {
    const reason = verifyResponse.invalidReason ?? "verify_failed";
    await updateAttemptStatus(attempt.id, "verify_failed", reason);
    await persistAudit(attempt.id, "fail", "Server-signed x402 verify failed", { reason });
    return paymentError(402, -32013, "payment verification failed", { attemptId: attempt.id, reason, status: "verify_failed" });
  }

  const settleResponse = await settlePayment(facilitator, {
    paymentPayload: payment.paymentPayload,
    paymentRequirements: requirements,
  });
  if (!settleResponse.response) {
    const reason = "settle_request_failed";
    await updateAttemptStatus(attempt.id, "settle_failed", reason);
    await persistX402Record({
      attemptId: attempt.id,
      facilitatorUrl: config.facilitatorUrl,
      paymentPayload: payment.paymentPayload,
      paymentRequirements: requirements,
      settleResponse: { errorMessage: settleResponse.error, errorReason: reason, success: false },
      verifyResponse,
    });
    await persistAudit(attempt.id, "fail", "Server-signed x402 settle request failed", { error: settleResponse.error, reason });
    return paymentError(502, -32015, "payment settlement failed", { attemptId: attempt.id, reason, status: "settle_failed" });
  }
  await persistX402Record({
    attemptId: attempt.id,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload: payment.paymentPayload,
    paymentRequirements: requirements,
    settleResponse: settleResponse.response,
    verifyResponse,
  });
  if (!settleResponse.response.success || !settleResponse.response.transaction) {
    const reason = settleResponse.response.errorReason ?? "settle_failed";
    await updateAttemptStatus(attempt.id, "settle_failed", reason);
    await persistAudit(attempt.id, "fail", "Server-signed x402 settle failed", { reason });
    return paymentError(402, -32015, "payment settlement failed", { attemptId: attempt.id, reason, status: "settle_failed" });
  }

  return completeSettledHostedCall(
    { ...input, paymentHeader: "" },
    { attemptId: attempt.id, config, requirements, settleResponse: settleResponse.response },
  );
}
