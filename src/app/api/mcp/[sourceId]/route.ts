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
  try {
    const endpoint = await getHostedEndpoint(sourceId);
    const message = await parseJsonRpcRequest(request);

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

    // Paid action — require a casper_ key (header or bearer); the gateway settles.
    const apiKey = request.headers.get("x-api-key")?.trim() || bearerToken(request.headers.get("authorization"));
    if (!apiKey) {
      return jsonRpcError(
        message.id,
        -32001,
        "API key required — send x-api-key: casper_… or Authorization: Bearer casper_…",
        { status: "unauthorized" },
        401,
      );
    }

    const tool = resolveHostedTool(endpoint, requiredToolName(message.params));
    if (!tool) return jsonRpcError(message.id, -32004, "tool not found", { status: "not_found" }, 404);
    if (!tool.paymentRequirements) {
      return jsonRpcError(message.id, -32009, "tool is missing payment requirements", { status: "misconfigured" }, 409);
    }

    const outcome = await runGatewayPaidCall({
      apiKey,
      args: requiredToolArgs(message.params),
      client: "hosted-mcp-endpoint",
      endpointUrl: endpoint.source.endpointUrl,
      toolName: tool.name,
    });

    if (outcome.status === "settled" || outcome.status === "raw_proof_unavailable") {
      const transaction = outcome.explorerUrl?.split("/deploy/")[1];
      const base = isRecord(outcome.result) ? outcome.result : { content: [{ text: "", type: "text" }] };
      const result = {
        ...base,
        _meta: {
          ...(isRecord(base._meta) ? base._meta : {}),
          "x402/payment-response": {
            network: tool.paymentRequirements.network,
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
    const o = outcome as { attemptId: string; status: string; explorerUrl?: string; reason?: string };
    return jsonRpcError(
      message.id,
      -32010,
      o.reason ?? `payment ${o.status}`,
      { attemptId: o.attemptId, explorerUrl: o.explorerUrl, status: o.status },
      402,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "hosted_endpoint_failed";
    const status = isApiKeyError(error)
      ? error.status
      : isPaidCallInputError(error)
        ? error.status
        : error instanceof HostedEndpointRequestError
          ? error.status
          : message.includes("Missing integration configuration")
            ? 503
            : 404;
    return NextResponse.json({ error: message }, { status });
  }
}

function bearerToken(header: string | null) {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
