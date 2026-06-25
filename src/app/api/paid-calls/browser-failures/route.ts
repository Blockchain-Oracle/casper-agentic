import { NextRequest, NextResponse } from "next/server";

import {
  BrowserPaymentFailureInputError,
  type BrowserPaymentFailureInput,
  isBrowserPaymentFailureInputError,
  reportBrowserPaymentFailure,
} from "@/server/browser-payment-failure";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const result = await reportBrowserPaymentFailure(parseFailureBody(body));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "browser_payment_failure_report_failed";
    const status = isOperatorAccessError(error)
      ? error.status
      : isBrowserPaymentFailureInputError(error)
        ? error.status
      : message.includes("Missing browser payment-failure configuration")
        ? 503
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

function parseFailureBody(body: unknown): BrowserPaymentFailureInput {
  if (!isRecord(body)) throw new BrowserPaymentFailureInputError("request body object is required");
  return {
    attemptId: requireString(body.attemptId, "attemptId"),
    errorCode: optionalString(body.errorCode),
    reason: requireString(body.reason, "reason"),
    resultStatus: optionalString(body.resultStatus),
    toolName: requireString(body.toolName, "toolName"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}

function requireString(value: unknown, label: string) {
  const text = optionalString(value);
  if (!text) throw new BrowserPaymentFailureInputError(`${label} is required`);
  return text;
}
