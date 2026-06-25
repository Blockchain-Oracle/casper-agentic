import { NextRequest, NextResponse } from "next/server";

import {
  BrowserPaymentIntentInputError,
  createBrowserPaymentIntent,
  isBrowserPaymentIntentInputError,
} from "@/server/browser-payment-intent";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const result = await createBrowserPaymentIntent(parseIntentBody(body));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "browser_payment_intent_failed";
    const status = isOperatorAccessError(error)
      ? error.status
      : isBrowserPaymentIntentInputError(error)
        ? error.status
      : message.includes("Missing browser payment-intent configuration")
        ? 503
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

function parseIntentBody(body: unknown) {
  if (!isRecord(body)) throw new BrowserPaymentIntentInputError("request body object is required");
  const args = isRecord(body.args) ? body.args : null;
  if (!args) throw new BrowserPaymentIntentInputError("args object is required");
  return {
    args,
    endpointUrl: requireString(body.endpointUrl, "endpointUrl"),
    toolName: requireString(body.toolName, "toolName"),
    walletId: requireString(body.walletId, "walletId"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, label: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new BrowserPaymentIntentInputError(`${label} is required`);
  return text;
}
