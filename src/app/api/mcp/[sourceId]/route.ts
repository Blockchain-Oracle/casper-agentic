import { encodePaymentRequiredHeader } from "@x402/core/http";
import { NextRequest, NextResponse } from "next/server";

import { isEndpointAccessError, requireEndpointAccess } from "@/server/endpoint-access";
import { buildHostedClientMetadata } from "@/server/hosted-client-metadata";
import {
  buildHostedPaymentRequired,
  getHostedEndpoint,
  hostedMcpTools,
  resolveHostedTool,
  toHostedEndpointPublicView,
} from "@/server/hosted-endpoint";
import {
  HostedPaidCallInputError,
  runHostedPaidToolCall,
  type HostedPaidToolCallInput,
} from "@/server/hosted-paid-call";
import {
  HostedEndpointRequestError,
  jsonRpcError,
  jsonRpcResult,
  parseJsonRpcRequest,
  requiredToolArgs,
  requiredToolName,
  type JsonRpcMessage,
} from "@/server/mcp-json-rpc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  try {
    const access = await requireEndpointAccess(sourceId, request.headers.get("authorization"));
    const endpoint = await getHostedEndpoint(sourceId, access.scope.toolIds);
    return NextResponse.json({
      access,
      endpoint: toHostedEndpointPublicView(endpoint),
      client: buildHostedClientMetadata({
        endpoint,
        requestUrl: request.url,
        scope: access.scope,
      }),
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
      const outcome = await runPaidToolCall({
        args: requiredToolArgs(message.params),
        endpoint,
        id: message.id,
        paymentHeader: signature,
        requestUrl: request.url,
        tool,
      });
      if (outcome instanceof NextResponse) return outcome;
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

async function runPaidToolCall(input: HostedPaidToolCallInput & { id: JsonRpcMessage["id"] }) {
  const { id, ...paidInput } = input;
  try {
    return await runHostedPaidToolCall(paidInput);
  } catch (error) {
    if (error instanceof HostedPaidCallInputError) {
      return jsonRpcError(id, error.code, error.message, { status: "invalid_payment" }, error.status);
    }
    throw error;
  }
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
