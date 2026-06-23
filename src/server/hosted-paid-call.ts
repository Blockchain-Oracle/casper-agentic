import { decodePaymentSignatureHeader } from "@x402/core/http";
import type { PaymentPayload, PaymentRequirements, VerifyResponse } from "@x402/core/types";

import { normalizeCasperAccountHash } from "./casper-account";
import { completeSettledHostedCall } from "./hosted-paid-call-completion";
import { evaluateHostedPolicy } from "./hosted-paid-call-policy";
import { requireHostedSettlementConfig, type HostedSettlementConfig } from "./hosted-settlement-config";
import type { HostedEndpointTool, HostedEndpointView } from "./hosted-endpoint";
import {
  persistAttempt,
  persistAudit,
  persistPolicyDecision,
  persistX402Record,
  updateAttemptStatus,
} from "./receipt-store";
import { X402FacilitatorClient } from "./x402-facilitator";

export interface HostedPaidToolCallInput {
  args: Record<string, unknown>;
  endpoint: HostedEndpointView;
  paymentHeader: string;
  requestUrl: string;
  tool: HostedEndpointTool;
}

export type HostedPaidToolCallOutput =
  | {
      attemptId?: string;
      code: number;
      data?: Record<string, unknown>;
      kind: "error";
      message: string;
      paymentResponseHeader?: string;
      status: number;
    }
  | {
      attemptId: string;
      kind: "success";
      paymentResponseHeader: string;
      result: unknown;
    };

export async function runHostedPaidToolCall(input: HostedPaidToolCallInput): Promise<HostedPaidToolCallOutput> {
  const config = requireHostedSettlementConfig();
  const requirements = requirePaymentRequirements(input.tool);
  const resourceUrl = `${input.requestUrl}#${input.tool.name}`;
  const paymentPayload = decodePaymentHeader(input.paymentHeader);
  const payerHint = payerFromPayload(paymentPayload) ?? "unverified";

  if (paymentPayload.resource?.url !== resourceUrl) {
    return persistVerifyFailure(input, {
      config,
      invalidMessage: `payload.resource.url must match ${resourceUrl}`,
      invalidReason: "resource_mismatch",
      payer: payerHint,
      paymentPayload,
      requirements,
    });
  }

  const facilitator = new X402FacilitatorClient(config);
  const verifyResponse = await facilitator.verify({ paymentPayload, paymentRequirements: requirements });
  const payer = payerFromVerify(verifyResponse) ?? payerHint;
  const normalizedPayer = normalizePayer(payer);
  if (!normalizedPayer) {
    return persistVerifyFailure(input, {
      config,
      invalidMessage: "verified payment did not include a usable Casper payer",
      invalidReason: "payer_unavailable",
      payer,
      paymentPayload,
      requirements,
      verifyResponse,
    });
  }

  const attempt = await persistAttempt({
    amount: requirements.amount,
    asset: requirements.asset,
    client: "hosted-mcp-endpoint",
    network: requirements.network,
    providerName: input.endpoint.source.name,
    redactedInput: redactInput(input.args),
    status: verifyResponse.isValid ? "policy_pending" : "verify_failed",
    toolName: input.tool.name,
    walletAccountHash: normalizedPayer,
  });
  await persistX402Record({
    attemptId: attempt.id,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload,
    paymentRequirements: requirements,
    verifyResponse,
  });

  if (!verifyResponse.isValid) {
    const reason = verifyResponse.invalidReason ?? "verify_failed";
    await persistAudit(attempt.id, "fail", "Hosted x402 verify failed", { reason });
    return paymentError(402, -32013, "payment verification failed", {
      attemptId: attempt.id,
      reason,
      status: "verify_failed",
    });
  }

  const policy = await evaluateHostedPolicy({
    config,
    payer: normalizedPayer,
    requirements,
    toolName: input.tool.name,
  });
  await persistPolicyDecision(attempt.id, policy.allowed, policy.reason, policy.evidence);
  if (!policy.allowed) {
    await updateAttemptStatus(attempt.id, "blocked", policy.reason);
    await persistAudit(attempt.id, "block", "Hosted spend policy blocked before settlement", {
      reason: policy.reason,
    });
    return paymentError(403, -32014, "spend policy blocked settlement", {
      attemptId: attempt.id,
      reason: policy.reason,
      status: "blocked",
    });
  }

  const settleResponse = await facilitator.settle({ paymentPayload, paymentRequirements: requirements });
  await persistX402Record({
    attemptId: attempt.id,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload,
    paymentRequirements: requirements,
    settleResponse,
    verifyResponse,
  });

  if (!settleResponse.success || !settleResponse.transaction) {
    const reason = settleResponse.errorReason ?? "settle_failed";
    await updateAttemptStatus(attempt.id, "settle_failed", reason);
    await persistAudit(attempt.id, "fail", "Hosted x402 settle failed", { reason });
    return paymentError(402, -32015, "payment settlement failed", {
      attemptId: attempt.id,
      reason,
      status: "settle_failed",
    });
  }

  return completeSettledHostedCall(input, { attemptId: attempt.id, config, requirements, settleResponse });
}

function decodePaymentHeader(paymentHeader: string) {
  try {
    return decodePaymentSignatureHeader(paymentHeader);
  } catch {
    throw new HostedPaidCallInputError("invalid payment signature header");
  }
}

export class HostedPaidCallInputError extends Error {
  readonly status = 400;
  readonly code = -32012;
}

function requirePaymentRequirements(tool: HostedEndpointTool) {
  if (!tool.paymentRequirements) throw new HostedPaidCallInputError("published tool is missing payment requirements");
  return tool.paymentRequirements;
}

async function persistVerifyFailure(
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
    redactedInput: redactInput(input.args),
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

function paymentError(
  status: number,
  code: number,
  message: string,
  data: Record<string, unknown>,
  paymentResponseHeader?: string,
): HostedPaidToolCallOutput {
  return { code, data, kind: "error", message, paymentResponseHeader, status };
}

function payerFromVerify(verifyResponse: VerifyResponse) {
  return typeof verifyResponse.payer === "string" ? verifyResponse.payer : undefined;
}

function payerFromPayload(paymentPayload: PaymentPayload) {
  const authorization = asRecord(asRecord(paymentPayload.payload).authorization);
  return typeof authorization.from === "string" ? authorization.from : undefined;
}

function normalizePayer(value: string | undefined) {
  if (!value) return undefined;
  try {
    return normalizeCasperAccountHash(value, "payment payer");
  } catch {
    return undefined;
  }
}

function redactInput(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : value]),
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
