import { NextRequest, NextResponse } from "next/server";

import { getHostedEndpoint, resolveHostedTool } from "@/server/hosted-endpoint";
import { runHostedServerSignedToolCall } from "@/server/hosted-server-signed-call";
import { isOperatorAccessError, requireOperatorRequest } from "@/server/operator-access";

export const dynamic = "force-dynamic";

// Trigger 1 — "Pay with my agent wallet": an operator-gated web action where the
// Gateway server-signs with the UI-selected wallet, reusing the same engine as the
// autonomous agent path (Trigger 3). Scoped to our own hosted/proxied tools.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    requireOperatorRequest(request);
    const sourceId = requiredString(body.sourceId, "sourceId");
    const toolName = requiredString(body.toolName, "toolName");
    const walletId = requiredString(body.walletId, "walletId");
    const args = isRecord(body.args) ? body.args : {};

    const endpoint = await getHostedEndpoint(sourceId);
    const tool = resolveHostedTool(endpoint, toolName);
    if (!tool) {
      return NextResponse.json({ error: "tool not found", status: "not_found" }, { status: 404 });
    }

    // Sign against the canonical hosted MCP resource URL, not this operator route.
    const requestUrl = new URL(`/api/mcp/${sourceId}`, request.url).toString();
    const outcome = await runHostedServerSignedToolCall({ args, endpoint, requestUrl, tool }, walletId);

    if (outcome.kind === "success") {
      return NextResponse.json(
        { attemptId: outcome.attemptId, result: outcome.result, status: "settled" },
        { headers: { "x-casper-gw-receipt-id": outcome.attemptId }, status: 200 },
      );
    }
    return NextResponse.json(
      { attemptId: outcome.attemptId, error: outcome.message, ...outcome.data },
      { status: outcome.status },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "agent_wallet_payment_failed";
    return NextResponse.json({ error: message }, { status: isOperatorAccessError(error) ? error.status : 400 });
  }
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
