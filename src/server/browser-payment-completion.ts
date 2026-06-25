import type { PaymentPayload } from "@x402/core/types";

import { hasDatabaseUrl } from "@/db/client";

import {
  completeBrowserProofAndToolCall,
  failBrowserPolicy,
  failBrowserSettle,
  failBrowserVerify,
  type BrowserCompletionConfig,
  type ParsedBrowserPaymentCompletionInput,
} from "./browser-payment-completion-outcomes";
import { browserCompletionPolicyBlock } from "./browser-payment-completion-policy";
import { normalizeCasperAccountHash } from "./casper-account";
import { getRuntimeConfig } from "./env";
import { normalizePayer, payerFromPayload, payerFromVerify, settlePayment } from "./hosted-paid-call-support";
import { getPaidCallAttempt } from "./paid-call-attempt-store";
import { persistAudit, persistX402Record } from "./receipt-store";
import { auditSigningEvidence } from "./browser-signing-evidence";
import { X402FacilitatorClient } from "./x402-facilitator";
import { buildPaymentRequirements } from "./x402-payment";

export interface BrowserPaymentCompletionInput {
  args: Record<string, unknown>;
  attemptId: string;
  endpointUrl: string;
  paymentPayload: PaymentPayload;
  signingEvidence?: Record<string, unknown>;
  toolName: string;
}

export class BrowserPaymentCompletionInputError extends Error {
  readonly status = 400;
}

export function isBrowserPaymentCompletionInputError(error: unknown): error is BrowserPaymentCompletionInputError {
  return error instanceof BrowserPaymentCompletionInputError;
}

export async function completeBrowserSignedPayment(input: BrowserPaymentCompletionInput) {
  const config = requireBrowserCompletionConfig();
  const parsed = requireCompletionInput(input);
  const attempt = await getPaidCallAttempt(parsed.attemptId);
  if (!attempt) throw new BrowserPaymentCompletionInputError("browser payment intent attempt not found");
  assertCompletableAttempt(attempt, parsed);
  const signingEvidence = auditSigningEvidence(parsed.signingEvidence);
  if (signingEvidence) {
    await persistAudit(parsed.attemptId, "info", "Browser CSPR.click signing evidence received", signingEvidence);
  }
  const policyBlockReason = await browserCompletionPolicyBlock({ attempt, config, paymentInput: parsed });
  if (policyBlockReason) return failBrowserPolicy(parsed.attemptId, policyBlockReason);

  const requirements = buildPaymentRequirements(config);
  const resourceUrl = `${parsed.endpointUrl}#${parsed.toolName}`;
  if (parsed.paymentPayload.resource?.url !== resourceUrl) {
    return failBrowserVerify(parsed.attemptId, "resource_mismatch", config, parsed.paymentPayload, requirements);
  }

  const facilitator = new X402FacilitatorClient(config);
  const verifyResponse = await facilitator.verify({ paymentPayload: parsed.paymentPayload, paymentRequirements: requirements });
  if (!verifyResponse.isValid) {
    const reason = verifyResponse.invalidReason ?? "verify_failed";
    return failBrowserVerify(parsed.attemptId, reason, config, parsed.paymentPayload, requirements, verifyResponse);
  }

  const payer = normalizePayer(payerFromVerify(verifyResponse) ?? payerFromPayload(parsed.paymentPayload));
  if (!payer || payer !== normalizeCasperAccountHash(attempt.walletAccountHash)) {
    return failBrowserVerify(parsed.attemptId, "payer_mismatch", config, parsed.paymentPayload, requirements, verifyResponse);
  }

  await persistX402Record({
    attemptId: parsed.attemptId,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload: parsed.paymentPayload,
    paymentRequirements: requirements,
    verifyResponse,
  });
  const settleResponse = await settlePayment(facilitator, {
    paymentPayload: parsed.paymentPayload,
    paymentRequirements: requirements,
  });
  if (!settleResponse.response) {
    return failBrowserSettle(parsed.attemptId, "settle_request_failed", config, parsed.paymentPayload, requirements, verifyResponse, {
      errorMessage: settleResponse.error,
      errorReason: "settle_request_failed",
      success: false,
    });
  }
  await persistX402Record({
    attemptId: parsed.attemptId,
    facilitatorUrl: config.facilitatorUrl,
    paymentPayload: parsed.paymentPayload,
    paymentRequirements: requirements,
    settleResponse: settleResponse.response,
    verifyResponse,
  });
  if (!settleResponse.response.success || !settleResponse.response.transaction) {
    return failBrowserSettle(
      parsed.attemptId,
      settleResponse.response.errorReason ?? "settle_failed",
      config,
      parsed.paymentPayload,
      requirements,
      verifyResponse,
      settleResponse.response,
    );
  }

  return completeBrowserProofAndToolCall(parsed, config, requirements.asset, settleResponse.response.transaction);
}

function requireBrowserCompletionConfig(): BrowserCompletionConfig {
  const config = getRuntimeConfig();
  const missing = [];
  if (!config.csprCloudApiKey) missing.push("CSPR_CLOUD_API_KEY");
  if (!hasDatabaseUrl()) missing.push("DATABASE_URL");
  if (!config.payeeAccountHash) missing.push("CASPER_PAYEE_ACCOUNT_HASH");
  if (missing.length) throw new Error(`Missing browser payment-completion configuration: ${missing.join(", ")}`);
  return config as BrowserCompletionConfig;
}

function assertCompletableAttempt(
  attempt: { client: string; status: string; toolName: string },
  input: ReturnType<typeof requireCompletionInput>,
) {
  if (attempt.client !== "csprclick-browser-intent") {
    throw new BrowserPaymentCompletionInputError("attempt is not a browser payment intent");
  }
  if (attempt.status !== "policy_pending") {
    throw new BrowserPaymentCompletionInputError("browser payment intent is not waiting for signature");
  }
  if (attempt.toolName !== input.toolName) {
    throw new BrowserPaymentCompletionInputError("toolName does not match browser payment intent");
  }
}

function requireCompletionInput(input: BrowserPaymentCompletionInput): ParsedBrowserPaymentCompletionInput {
  const args = isRecord(input.args) ? input.args : null;
  if (!args) throw new BrowserPaymentCompletionInputError("args object is required");
  if (!isRecord(input.paymentPayload)) {
    throw new BrowserPaymentCompletionInputError("paymentPayload object is required");
  }
  const endpointUrl = requireText(input.endpointUrl, "endpointUrl");
  if (endpointUrl !== getRuntimeConfig().mcpUrl) {
    throw new BrowserPaymentCompletionInputError("browser payment completion is limited to the configured MCP endpoint");
  }
  return {
    args,
    attemptId: requireText(input.attemptId, "attemptId"),
    endpointUrl,
    paymentPayload: input.paymentPayload,
    signingEvidence: isRecord(input.signingEvidence) ? input.signingEvidence : undefined,
    toolName: requireText(input.toolName, "toolName"),
  };
}

function requireText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new BrowserPaymentCompletionInputError(`${label} is required`);
  return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
