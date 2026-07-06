import { NextRequest, NextResponse } from "next/server";

import { isApiKeyError } from "@/server/api-keys";
import {
  getHostedEndpoint,
  hostedMcpTools,
  resolveHostedTool,
  toHostedEndpointPublicView,
} from "@/server/hosted-endpoint";
import { isPaidCallInputError, runGatewayPaidCall } from "@/server/live-paid-call";
import {
  HostedEndpointRequestError,
  type JsonRpcMessage,
  jsonRpcError,
  jsonRpcResult,
  parseJsonRpcRequest,
  requiredToolArgs,
  requiredToolName,
} from "@/server/mcp-json-rpc";

export const dynamic = "force-dynamic";

// Hosted MCP server for a registered source. A real streamable-HTTP MCP endpoint
// an agent client (Claude Desktop / Cursor / Claude Code) connects to with a
// casper_ API key. tools/list is public; tools/call requires the key and settles
// the x402 payment on Casper via the gateway signer, then returns the upstream
// tool result. One settle path (runGatewayPaidCall) — no caller signing, no custody.

export async function GET(_request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  try {
    const endpoint = await getHostedEndpoint(sourceId);
    return NextResponse.json({
      auth: { header: "x-api-key | Authorization: Bearer", mode: "api_key", prefix: "casper_" },
      endpoint: toHostedEndpointPublicView(endpoint),
      payment: { asset: "WCSPR", settledBy: "casper-gw-gateway-signer" },
      transport: "streamable-http",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "hosted_endpoint_failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  // Parse the JSON-RPC envelope first so the catch can always answer in-protocol
  // (with the request id) — MCP clients need a JSON-RPC error, not a bare { error }.
  let parsed: JsonRpcMessage | undefined;
  try {
    parsed = await parseJsonRpcRequest(request);
    const message = parsed;
    const endpoint = await getHostedEndpoint(sourceId);

    if (message.method === "initialize") {
      return jsonRpcResult(message.id, {
        capabilities: { tools: {} },
        protocolVersion: "2025-06-18",
        serverInfo: { name: "casper-gw", version: "0.1.0" },
      });
    }
    if (message.method === "notifications/initialized" && message.id === undefined) {
      return new NextResponse(null, { status: 202 });
    }
    if (message.method === "tools/list") {
      return jsonRpcResult(message.id, { tools: hostedMcpTools(endpoint) });
    }
    if (message.method !== "tools/call") {
      return jsonRpcError(message.id, -32601, "method not found");
    }

    const tool = resolveHostedTool(endpoint, requiredToolName(message.params));
    if (!tool) return jsonRpcError(message.id, -32004, "tool not found", { status: "not_found" }, 404);
    const paymentRequirements = tool.paymentRequirements;

    // Paid action — require a casper_ key (header or bearer); the gateway settles.
    // Free published tools have no payment requirements and can run without a key.
    const apiKey = request.headers.get("x-api-key")?.trim() || bearerToken(request.headers.get("authorization"));
    if (paymentRequirements && !apiKey) {
      return jsonRpcError(
        message.id,
        -32001,
        "API key required for paid tool — send x-api-key: casper_… or Authorization: Bearer casper_…",
        { status: "unauthorized" },
        401,
      );
    }

    const outcome = await runGatewayPaidCall({
      apiKey,
      args: requiredToolArgs(message.params),
      client: "hosted-mcp-endpoint",
      endpointUrl: endpoint.source.endpointUrl,
      toolName: tool.name,
    });

    if (outcome.status === "free") {
      const base = isRecord(outcome.result) ? outcome.result : { content: [{ text: "", type: "text" }] };
      const result = {
        ...base,
        _meta: {
          ...(isRecord(base._meta) ? base._meta : {}),
          "casperGw/free": true,
        },
      };
      if (message.id === undefined) return new NextResponse(null, { status: 202 });
      return NextResponse.json({ id: message.id, jsonrpc: "2.0", result });
    }

    if (outcome.status === "settled" || outcome.status === "raw_proof_unavailable") {
      if (!paymentRequirements) return jsonRpcError(message.id, -32009, "tool is missing payment requirements", { status: "misconfigured" }, 409);
      const transaction = outcome.explorerUrl?.split("/deploy/")[1];
      const base = isRecord(outcome.result) ? outcome.result : { content: [{ text: "", type: "text" }] };
      const result = {
        ...base,
        _meta: {
          ...(isRecord(base._meta) ? base._meta : {}),
          "x402/payment-response": {
            network: paymentRequirements.network,
            payer: "casper-gw-gateway-signer",
            proof: outcome.status === "settled" ? "indexed" : "indexing",
            success: true,
            transaction,
          },
        },
      };
      if (message.id === undefined) return new NextResponse(null, { status: 202 });
      return NextResponse.json(
        { id: message.id, jsonrpc: "2.0", result },
        { headers: { "Access-Control-Expose-Headers": "x-casper-gw-receipt-id", "x-casper-gw-receipt-id": outcome.attemptId } },
      );
    }

    // blocked / verify_failed / settle_failed / upstream_failed → 402, never a fake success.
    const o = outcome as { attemptId?: string; status: string; explorerUrl?: string; reason?: string };
    return jsonRpcError(
      message.id,
      -32010,
      o.reason ?? `payment ${o.status}`,
      { attemptId: o.attemptId, explorerUrl: o.explorerUrl, status: o.status },
      402,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "hosted_endpoint_failed";
    const status = isApiKeyError(error)
      ? error.status
      : isPaidCallInputError(error)
        ? error.status
        : error instanceof HostedEndpointRequestError
          ? error.status
          : errorMessage.includes("Missing integration configuration")
            ? 503
            : 404;
    // JSON-RPC server-error codes (-32000..-32099) so MCP clients surface the reason
    // instead of choking on a non-protocol body. id is null when the body never parsed.
    const code = isApiKeyError(error)
      ? -32003 // payment/authorization: insufficient balance, revoked, expired, over-cap, out-of-scope
      : isPaidCallInputError(error)
        ? -32602 // invalid params
        : error instanceof HostedEndpointRequestError
          ? -32600 // invalid request
          : status === 503
            ? -32011 // gateway not configured to settle
            : -32004; // source/endpoint not found
    return jsonRpcError(parsed ? parsed.id : null, code, errorMessage, { status: String(status) }, status);
  }
}

function bearerToken(header: string | null) {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
