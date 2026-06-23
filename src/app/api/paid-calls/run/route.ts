import { NextRequest, NextResponse } from "next/server";

import { isPaidCallInputError, PaidCallInputError, runLivePaidToolCall } from "@/server/live-paid-call";
import {
  isOperatorAccessError,
  requireHttpSigningEnabled,
  requireOperatorRequest,
} from "@/server/operator-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    requireHttpSigningEnabled();
    const result = await runLivePaidToolCall(parsePaidCallBody(body));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "paid_call_failed";
    const status = isOperatorAccessError(error)
      ? error.status
      : isPaidCallInputError(error)
        ? error.status
      : message.includes("Missing integration configuration")
        ? 503
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parsePaidCallBody(body: unknown) {
  if (!isRecord(body)) throw new PaidCallInputError("request body object is required");
  const args = isRecord(body.args) ? body.args : null;
  if (!args) throw new PaidCallInputError("args object is required");
  return {
    args,
    endpointUrl: requireString(body.endpointUrl, "endpointUrl"),
    toolName: requireString(body.toolName, "toolName"),
    walletId: requireString(body.walletId, "walletId"),
  };
}

function requireString(value: unknown, label: string) {
  const text = stringValue(value);
  if (!text) throw new PaidCallInputError(`${label} is required`);
  return text;
}
