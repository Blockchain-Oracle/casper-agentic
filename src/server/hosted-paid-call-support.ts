import { decodePaymentSignatureHeader } from "@x402/core/http";
import type { PaymentPayload, VerifyResponse } from "@x402/core/types";

import { normalizeCasperAccountHash } from "./casper-account";
import type { HostedEndpointTool } from "./hosted-endpoint";
import type { HostedPaidToolCallOutput } from "./hosted-paid-call-types";
import type { X402FacilitatorClient } from "./x402-facilitator";

export class HostedPaidCallInputError extends Error {
  readonly status = 400;
  readonly code = -32012;
}

export function decodePaymentHeader(paymentHeader: string) {
  try {
    return decodePaymentSignatureHeader(paymentHeader);
  } catch {
    throw new HostedPaidCallInputError("invalid payment signature header");
  }
}

export function requirePaymentRequirements(tool: HostedEndpointTool) {
  if (!tool.paymentRequirements) throw new HostedPaidCallInputError("published tool is missing payment requirements");
  return tool.paymentRequirements;
}

export function paymentError(
  status: number,
  code: number,
  message: string,
  data: Record<string, unknown>,
  paymentResponseHeader?: string,
): HostedPaidToolCallOutput {
  return { code, data, kind: "error", message, paymentResponseHeader, status };
}

export function payerFromVerify(verifyResponse: VerifyResponse) {
  return typeof verifyResponse.payer === "string" ? verifyResponse.payer : undefined;
}

export function payerFromPayload(paymentPayload: PaymentPayload) {
  const authorization = asRecord(asRecord(paymentPayload.payload).authorization);
  return typeof authorization.from === "string" ? authorization.from : undefined;
}

export function normalizePayer(value: string | undefined) {
  if (!value) return undefined;
  try {
    return normalizeCasperAccountHash(value, "payment payer");
  } catch {
    return undefined;
  }
}

export async function settlePayment(
  facilitator: X402FacilitatorClient,
  input: Parameters<X402FacilitatorClient["settle"]>[0],
) {
  try {
    return { response: await facilitator.settle(input) };
  } catch (error) {
    return { error: publicErrorMessage(error) };
  }
}

export function redactHostedInput(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : value]),
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function publicErrorMessage(error: unknown) {
  return (error instanceof Error ? error.message : "request failed").slice(0, 160);
}
