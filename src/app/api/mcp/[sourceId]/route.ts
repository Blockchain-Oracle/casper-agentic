import { encodePaymentRequiredHeader } from "@x402/core/http";
import { NextRequest, NextResponse } from "next/server";

import { isEndpointAccessError, requireEndpointAccess } from "@/server/endpoint-access";
import {
  buildHostedPaymentRequired,
  getHostedEndpoint,
  hostedMcpTools,
  resolveHostedTool,
} from "@/server/hosted-endpoint";
import { HostedPaidCallInputError, runHostedPaidToolCall } from "@/server/hosted-paid-call";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  try {
    const access = await requireEndpointAccess(sourceId, request.headers.get("authorization"));
    const endpoint = await getHostedEndpoint(sourceId, access.scope.toolIds);
    return NextResponse.json({
      access,
      endpoint: {
        source: endpoint.source,
        tools: endpoint.tools,
      },
      transport: "streamable-http",
      x402: { protected: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "hosted_endpoint_failed";
    return NextResponse.json(
      { error: message },
      { status: isEndpointAccessError(error) ? error.status : 404 },
    );
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  try {
    const access = await requireEndpointAccess(sourceId, request.headers.get("authorization"));
    const endpoint = await getHostedEndpoint(sourceId, access.scope.toolIds);
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

    const toolName = requiredToolName(message.params);
    const tool = resolveHostedTool(endpoint, toolName);
    if (!tool) {
      return jsonRpcError(message.id, -32004, "tool not found", { status: "not_found" }, 404);
    }
    if (!tool.paymentRequirements) {
      return jsonRpcError(
        message.id,
        -32009,
        "published tool is missing payment requirements",
        { status: "misconfigured" },
        409,
      );
    }

    const signature = paymentHeader(request);
    if (signature) {
      const outcome = await runHostedPaidToolCall({
        args: requiredToolArgs(message.params),
        endpoint,
        paymentHeader: signature,
        requestUrl: request.url,
        tool,
      });
      if (outcome.kind === "success") {
        return NextResponse.json(
          { id: message.id, jsonrpc: "2.0", result: outcome.result },
          {
            headers: hostedPaymentHeaders(outcome.paymentResponseHeader, outcome.attemptId),
          },
        );
      }
      return jsonRpcError(
        message.id,
        outcome.code,
        outcome.message,
        outcome.data,
        outcome.status,
        outcome.paymentResponseHeader ? hostedPaymentHeaders(outcome.paymentResponseHeader, outcome.attemptId) : undefined,
      );
    }

    const paymentRequired = buildHostedPaymentRequired({
      endpoint,
      requestUrl: request.url,
      tool,
    });
    return NextResponse.json(paymentRequired, {
      headers: {
        "Access-Control-Expose-Headers": "PAYMENT-REQUIRED",
        "PAYMENT-REQUIRED": encodePaymentRequiredHeader(paymentRequired),
      },
      status: 402,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "hosted_endpoint_failed";
    const status = isEndpointAccessError(error)
      ? error.status
      : error instanceof HostedEndpointRequestError
        ? error.status
        : error instanceof HostedPaidCallInputError
          ? error.status
        : 404;
    return NextResponse.json({ error: message }, { status });
  }
}

interface JsonRpcMessage {
  id?: string | number | null;
  jsonrpc?: string;
  method: string;
  params?: unknown;
}

class HostedEndpointRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseJsonRpcRequest(request: NextRequest): Promise<JsonRpcMessage> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HostedEndpointRequestError("invalid JSON-RPC body", 400);
  }

  if (!isRecord(body) || Array.isArray(body)) {
    throw new HostedEndpointRequestError("JSON-RPC body must be an object", 400);
  }
  if (body.jsonrpc !== undefined && body.jsonrpc !== "2.0") {
    throw new HostedEndpointRequestError("JSON-RPC version must be 2.0", 400);
  }
  if (typeof body.method !== "string" || !body.method.trim()) {
    throw new HostedEndpointRequestError("JSON-RPC method is required", 400);
  }

  return {
    id: normalizeJsonRpcId(body.id),
    jsonrpc: body.jsonrpc,
    method: body.method,
    params: body.params,
  };
}

function requiredToolName(params: unknown) {
  if (!isRecord(params) || typeof params.name !== "string" || !params.name.trim()) {
    throw new HostedEndpointRequestError("tools/call params.name is required", 400);
  }
  return params.name.trim();
}

function requiredToolArgs(params: unknown) {
  if (!isRecord(params)) throw new HostedEndpointRequestError("tools/call params object is required", 400);
  const args = params.arguments;
  if (args === undefined) return {};
  if (!isRecord(args)) throw new HostedEndpointRequestError("tools/call params.arguments must be an object", 400);
  return args;
}

function jsonRpcResult(id: JsonRpcMessage["id"], result: unknown) {
  if (id === undefined) return new NextResponse(null, { status: 202 });
  return NextResponse.json({ id, jsonrpc: "2.0", result });
}

function jsonRpcError(
  id: JsonRpcMessage["id"],
  code: number,
  message: string,
  data?: Record<string, unknown>,
  status = 200,
  headers?: HeadersInit,
) {
  if (id === undefined) return new NextResponse(null, { status });
  return NextResponse.json({ error: { code, data, message }, id, jsonrpc: "2.0" }, { headers, status });
}

function normalizeJsonRpcId(value: unknown) {
  if (value === undefined || value === null || typeof value === "string" || typeof value === "number") {
    return value;
  }
  throw new HostedEndpointRequestError("JSON-RPC id must be a string, number, null, or omitted", 400);
}

function paymentHeader(request: NextRequest) {
  return request.headers.get("payment-signature") ?? request.headers.get("x-payment");
}

function hostedPaymentHeaders(paymentResponseHeader: string, attemptId?: string): HeadersInit {
  return {
    "Access-Control-Expose-Headers": "PAYMENT-RESPONSE,x-casper-gw-receipt-id",
    "PAYMENT-RESPONSE": paymentResponseHeader,
    ...(attemptId ? { "x-casper-gw-receipt-id": attemptId } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
