import type { PaymentPayload, PaymentRequirements, VerifyResponse } from "@x402/core/types";

import type { HostedSettlementConfig } from "./hosted-settlement-config";
import { normalizePayer, paymentError, redactHostedInput } from "./hosted-paid-call-support";
import type { HostedPaidToolCallInput } from "./hosted-paid-call-types";
import { persistAttempt, persistAudit, persistX402Record } from "./receipt-store";

export async function persistHostedVerifyFailure(
  input: HostedPaidToolCallInput,
  context: {
    config: HostedSettlementConfig;
    invalidMessage: string;
    invalidReason: string;
    payer?: string;
    paymentPayload: PaymentPayload;
    requirements: PaymentRequirements;
    verifyResponse?: VerifyResponse;
  },
) {
  const attempt = await persistAttempt({
    amount: context.requirements.amount,
    asset: context.requirements.asset,
    client: "hosted-mcp-endpoint",
    network: context.requirements.network,
    providerName: input.endpoint.source.name,
    redactedInput: redactHostedInput(input.args),
    status: "verify_failed",
    toolName: input.tool.name,
    walletAccountHash: normalizePayer(context.payer) ?? "unverified",
  });
  const verifyResponse = context.verifyResponse ?? {
    invalidMessage: context.invalidMessage,
    invalidReason: context.invalidReason,
    isValid: false,
    payer: context.payer,
  };
  await persistX402Record({
    attemptId: attempt.id,
    facilitatorUrl: context.config.facilitatorUrl,
    paymentPayload: context.paymentPayload,
    paymentRequirements: context.requirements,
    verifyResponse,
  });
  await persistAudit(attempt.id, "fail", "Hosted x402 verify failed", {
    reason: context.invalidReason,
  });
  return paymentError(402, -32013, "payment verification failed", {
    attemptId: attempt.id,
    reason: context.invalidReason,
    status: "verify_failed",
  });
}
