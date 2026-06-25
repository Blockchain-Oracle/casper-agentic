import { NextRequest, NextResponse } from "next/server";

import {
  BrowserPaymentCompletionInputError,
  type BrowserPaymentCompletionInput,
  completeBrowserSignedPayment,
  isBrowserPaymentCompletionInputError,
} from "@/server/browser-payment-completion";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const result = await completeBrowserSignedPayment(parseCompletionBody(body));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "browser_payment_completion_failed";
    const status = isOperatorAccessError(error)
      ? error.status
      : isBrowserPaymentCompletionInputError(error)
        ? error.status
      : message.includes("Missing browser payment-completion configuration")
        ? 503
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

function parseCompletionBody(body: unknown): BrowserPaymentCompletionInput {
  if (!isRecord(body)) throw new BrowserPaymentCompletionInputError("request body object is required");
  const args = isRecord(body.args) ? body.args : null;
  if (!args) throw new BrowserPaymentCompletionInputError("args object is required");
  const paymentPayload = isRecord(body.paymentPayload) ? body.paymentPayload : null;
  if (!paymentPayload) throw new BrowserPaymentCompletionInputError("paymentPayload object is required");
  return {
    args,
    attemptId: requireString(body.attemptId, "attemptId"),
    endpointUrl: requireString(body.endpointUrl, "endpointUrl"),
    paymentPayload: paymentPayload as BrowserPaymentCompletionInput["paymentPayload"],
    toolName: requireString(body.toolName, "toolName"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, label: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new BrowserPaymentCompletionInputError(`${label} is required`);
  return text;
}
