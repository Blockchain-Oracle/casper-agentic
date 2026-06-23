import { NextRequest, NextResponse } from "next/server";

import { runLivePaidToolCall } from "@/server/live-paid-call";
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
    const result = await runLivePaidToolCall({
      args: isRecord(body.args) ? body.args : undefined,
      endpointUrl: stringValue(body.endpointUrl),
      toolName: typeof body.toolName === "string" ? body.toolName : undefined,
      walletId: stringValue(body.walletId),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "paid_call_failed";
    const status = isOperatorAccessError(error)
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
