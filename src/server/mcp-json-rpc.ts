import { NextRequest, NextResponse } from "next/server";

export interface JsonRpcMessage {
  id?: string | number | null;
  jsonrpc?: string;
  method: string;
  params?: unknown;
}

export class HostedEndpointRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function parseJsonRpcRequest(request: NextRequest): Promise<JsonRpcMessage> {
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

export function requiredToolName(params: unknown) {
  if (!isRecord(params) || typeof params.name !== "string" || !params.name.trim()) {
    throw new HostedEndpointRequestError("tools/call params.name is required", 400);
  }
  return params.name.trim();
}

export function requiredToolArgs(params: unknown) {
  if (!isRecord(params)) throw new HostedEndpointRequestError("tools/call params object is required", 400);
  const args = params.arguments;
  if (args === undefined) return {};
  if (!isRecord(args)) throw new HostedEndpointRequestError("tools/call params.arguments must be an object", 400);
  return args;
}

export function jsonRpcResult(id: JsonRpcMessage["id"], result: unknown) {
  if (id === undefined) return new NextResponse(null, { status: 202 });
  return NextResponse.json({ id, jsonrpc: "2.0", result });
}

export function jsonRpcError(
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
