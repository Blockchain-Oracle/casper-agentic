import { NextResponse } from "next/server";

import {
  HostedPaidCallInputError,
  runHostedPaidToolCall,
  type HostedPaidToolCallInput,
  type HostedPaidToolCallOutput,
} from "./hosted-paid-call";
import { runHostedServerSignedToolCall, type ServerSignedToolCallInput } from "./hosted-server-signed-call";
import { jsonRpcError, type JsonRpcMessage } from "./mcp-json-rpc";

// Dispatch + response mapping shared by the MCP route's three payment branches
// (caller-signs / server-signs / 402). Keeps the route itself thin.
export function hostedPaymentHeaders(paymentResponseHeader: string, attemptId?: string): HeadersInit {
  return {
    "Access-Control-Expose-Headers": "PAYMENT-RESPONSE,x-casper-gw-receipt-id",
    "PAYMENT-RESPONSE": paymentResponseHeader,
    ...(attemptId ? { "x-casper-gw-receipt-id": attemptId } : {}),
  };
}

export async function runCallerSignedToolCall(input: HostedPaidToolCallInput & { id: JsonRpcMessage["id"] }) {
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

export async function runServerSignedToolCall(
  input: ServerSignedToolCallInput & { id: JsonRpcMessage["id"]; walletId: string },
) {
  const { id, walletId, ...paidInput } = input;
  try {
    return await runHostedServerSignedToolCall(paidInput, walletId);
  } catch (error) {
    if (error instanceof HostedPaidCallInputError) {
      return jsonRpcError(id, error.code, error.message, { status: "invalid_payment" }, error.status);
    }
    throw error;
  }
}

export function respondHostedOutcome(id: JsonRpcMessage["id"], outcome: HostedPaidToolCallOutput | NextResponse) {
  if (outcome instanceof NextResponse) return outcome;
  if (outcome.kind === "success") {
    return NextResponse.json(
      { id, jsonrpc: "2.0", result: outcome.result },
      { headers: hostedPaymentHeaders(outcome.paymentResponseHeader, outcome.attemptId) },
    );
  }
  return jsonRpcError(
    id,
    outcome.code,
    outcome.message,
    outcome.data,
    outcome.status,
    outcome.paymentResponseHeader ? hostedPaymentHeaders(outcome.paymentResponseHeader, outcome.attemptId) : undefined,
  );
}
