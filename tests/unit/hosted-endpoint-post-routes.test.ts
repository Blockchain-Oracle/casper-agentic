import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getHostedEndpoint: vi.fn(),
  requireEndpointAccess: vi.fn(),
  runHostedPaidToolCall: vi.fn(),
}));

vi.mock("@/server/endpoint-access", async () => {
  const actual = await vi.importActual<typeof import("@/server/endpoint-access")>("@/server/endpoint-access");
  return {
    ...actual,
    requireEndpointAccess: mocks.requireEndpointAccess,
  };
});

vi.mock("@/server/hosted-endpoint", async () => {
  const actual = await vi.importActual<typeof import("@/server/hosted-endpoint")>("@/server/hosted-endpoint");
  return {
    ...actual,
    getHostedEndpoint: mocks.getHostedEndpoint,
  };
});

vi.mock("@/server/hosted-paid-call", async () => {
  const actual = await vi.importActual<typeof import("@/server/hosted-paid-call")>("@/server/hosted-paid-call");
  return {
    ...actual,
    runHostedPaidToolCall: mocks.runHostedPaidToolCall,
  };
});

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("hosted MCP endpoint POST route", () => {
  it("returns MCP tools/list metadata with x402 payment requirements", async () => {
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mockScopedAccess();
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpoint());

    const response = await POST(
      request({ body: { id: 1, jsonrpc: "2.0", method: "tools/list" } }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getHostedEndpoint).toHaveBeenCalledWith("source-1", ["tool-1"]);
    expect(body.result.tools[0]).toMatchObject({
      _meta: { "casperGw/toolId": "tool-1" },
      name: "get_quote",
    });
    expect(body.result.tools[0]._meta["casperGw/paymentRequirements"]).toMatchObject({
      amount: "7500000000",
      network: "casper:casper-test",
      scheme: "exact",
    });
    expect(JSON.stringify(body)).not.toContain("credentialRef");
    expect(JSON.stringify(body)).not.toContain("tokenHash");
  });

  it("returns a real x402 402 challenge for unpaid priced tool calls", async () => {
    const { decodePaymentRequiredHeader } = await import("@x402/core/http");
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mockScopedAccess();
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpoint());

    const response = await POST(
      request({
        body: {
          id: "call-1",
          jsonrpc: "2.0",
          method: "tools/call",
          params: { arguments: { amount: "1" }, name: "get_quote" },
        },
      }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();
    const requiredHeader = response.headers.get("PAYMENT-REQUIRED");

    expect(response.status).toBe(402);
    expect(requiredHeader).toBeTruthy();
    expect(decodePaymentRequiredHeader(requiredHeader ?? "")).toEqual(body);
    expect(body).toMatchObject({
      accepts: [
        {
          amount: "7500000000",
          asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
          network: "casper:casper-test",
          payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
          scheme: "exact",
        },
      ],
      error: "PAYMENT-SIGNATURE header is required",
      resource: {
        mimeType: "application/json",
        url: "https://gw.test/api/mcp/source-1#get_quote",
      },
      x402Version: 2,
    });
    expect(JSON.stringify(body)).not.toContain("settled");
    expect(JSON.stringify(body)).not.toContain("deploy");
  });

  it("delegates signed payment calls and returns payment response headers on success", async () => {
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mockScopedAccess();
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpoint());
    mocks.runHostedPaidToolCall.mockResolvedValue({
      attemptId: "attempt-1",
      kind: "success",
      paymentResponseHeader: "encoded-settlement",
      result: { content: [{ text: "quote", type: "text" }] },
    });

    const response = await POST(
      request({
        body: {
          id: "call-1",
          jsonrpc: "2.0",
          method: "tools/call",
          params: { arguments: {}, name: "get_quote" },
        },
        paymentSignature: "base64-payment-payload",
      }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("PAYMENT-RESPONSE")).toBe("encoded-settlement");
    expect(response.headers.get("x-casper-gw-receipt-id")).toBe("attempt-1");
    expect(body).toEqual({
      id: "call-1",
      jsonrpc: "2.0",
      result: { content: [{ text: "quote", type: "text" }] },
    });
    expect(mocks.runHostedPaidToolCall).toHaveBeenCalledWith({
      args: {},
      endpoint: hostedEndpoint(),
      paymentHeader: "base64-payment-payload",
      requestUrl: "https://gw.test/api/mcp/source-1",
      tool: hostedEndpoint().tools[0],
    });
  });

  it("returns JSON-RPC for malformed payment signatures after request id parsing", async () => {
    const { HostedPaidCallInputError } = await import("@/server/hosted-paid-call");
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mockScopedAccess();
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpoint());
    mocks.runHostedPaidToolCall.mockRejectedValue(new HostedPaidCallInputError("invalid payment signature header"));

    const response = await POST(
      request({
        body: {
          id: "call-1",
          jsonrpc: "2.0",
          method: "tools/call",
          params: { arguments: {}, name: "get_quote" },
        },
        paymentSignature: "not-valid",
      }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: -32012,
        data: { status: "invalid_payment" },
        message: "invalid payment signature header",
      },
      id: "call-1",
      jsonrpc: "2.0",
    });
  });
});

function mockScopedAccess() {
  mocks.requireEndpointAccess.mockResolvedValue({
    id: "key-1",
    scope: { sourceId: "source-1", toolIds: ["tool-1"] },
    sourceId: "source-1",
  });
}

function request(init: { body: unknown; paymentSignature?: string }) {
  const headers = new Headers({
    authorization: "Bearer cgw_test_limited",
    "content-type": "application/json",
  });
  if (init.paymentSignature) headers.set("payment-signature", init.paymentSignature);

  return new NextRequest("https://gw.test/api/mcp/source-1", {
    body: JSON.stringify(init.body),
    headers,
    method: "POST",
  });
}

function hostedEndpoint() {
  return {
    source: {
      authMode: "bearer",
      credentialConfigured: true,
      endpointUrl: "https://mcp.cspr.trade/mcp",
      id: "source-1",
      name: "CSPR Trade",
      sourceType: "mcp",
    },
    tools: [
      {
        description: "Quote WCSPR swaps",
        id: "tool-1",
        inputSchema: {
          properties: { amount: { type: "string" } },
          type: "object",
        },
        name: "get_quote",
        paymentRequirements: {
          amount: "7500000000",
          asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
          extra: { decimals: "9", name: "Wrapped CSPR", symbol: "WCSPR", version: "1" },
          maxTimeoutSeconds: 900,
          network: "casper:casper-test",
          payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
          scheme: "exact",
        },
        status: "published",
        upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
      },
    ],
  };
}
