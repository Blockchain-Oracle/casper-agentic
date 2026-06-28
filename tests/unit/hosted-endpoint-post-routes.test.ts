import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hostedEndpointPostRequest, hostedEndpointPostView } from "./hosted-endpoint-post-fixtures";

const mocks = vi.hoisted(() => ({
  getHostedEndpoint: vi.fn(),
  runGatewayPaidCall: vi.fn(),
}));

vi.mock("@/server/hosted-endpoint", async () => {
  const actual = await vi.importActual<typeof import("@/server/hosted-endpoint")>("@/server/hosted-endpoint");
  return { ...actual, getHostedEndpoint: mocks.getHostedEndpoint };
});

vi.mock("@/server/live-paid-call", async () => {
  const actual = await vi.importActual<typeof import("@/server/live-paid-call")>("@/server/live-paid-call");
  return { ...actual, runGatewayPaidCall: mocks.runGatewayPaidCall };
});

const originalEnv = { ...process.env };
beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  process.env = { ...originalEnv };
});

const DEPLOY = "4ab57794dc8e2f36cba9144b088a20e67815a750b2289cb1210804b1d5cedc83";

describe("hosted MCP endpoint POST route", () => {
  it("returns MCP tools/list metadata with x402 payment requirements (open, no key)", async () => {
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpointPostView());

    const response = await POST(
      hostedEndpointPostRequest({ body: { id: 1, jsonrpc: "2.0", method: "tools/list" } }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getHostedEndpoint).toHaveBeenCalledWith("source-1");
    expect(body.result.tools[0]).toMatchObject({ _meta: { "casperGw/toolId": "tool-1" }, name: "get_quote" });
    expect(body.result.tools[0]._meta["casperGw/paymentRequirements"]).toMatchObject({
      amount: "7500000000",
      network: "casper:casper-test",
      scheme: "exact",
    });
    expect(JSON.stringify(body)).not.toContain("credentialRef");
    expect(JSON.stringify(body)).not.toContain("tokenHash");
  });

  it("rejects tools/call without an API key (401), never settling", async () => {
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpointPostView());

    const response = await POST(
      hostedEndpointPostRequest({
        body: { id: "call-1", jsonrpc: "2.0", method: "tools/call", params: { arguments: { amount: "1" }, name: "get_quote" } },
      }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe(-32001);
    expect(mocks.runGatewayPaidCall).not.toHaveBeenCalled();
  });

  it("settles a keyed tools/call and returns the result + payment-response + receipt header", async () => {
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpointPostView());
    mocks.runGatewayPaidCall.mockResolvedValue({
      attemptId: "attempt-1",
      explorerUrl: `https://testnet.cspr.live/deploy/${DEPLOY}`,
      result: { content: [{ text: "quote", type: "text" }] },
      status: "settled",
    });

    const response = await POST(
      hostedEndpointPostRequest({
        apiKey: "casper_demo",
        body: { id: "call-1", jsonrpc: "2.0", method: "tools/call", params: { arguments: {}, name: "get_quote" } },
      }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-casper-gw-receipt-id")).toBe("attempt-1");
    expect(body.result.content).toEqual([{ text: "quote", type: "text" }]);
    expect(body.result._meta["x402/payment-response"]).toMatchObject({ success: true, transaction: DEPLOY });
    expect(mocks.runGatewayPaidCall).toHaveBeenCalledWith({
      apiKey: "casper_demo",
      args: {},
      client: "hosted-mcp-endpoint",
      endpointUrl: "https://mcp.cspr.trade/mcp",
      toolName: "get_quote",
    });
  });

  it("returns a 402 JSON-RPC error when settlement does not succeed", async () => {
    const { POST } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.getHostedEndpoint.mockResolvedValue(hostedEndpointPostView());
    mocks.runGatewayPaidCall.mockResolvedValue({ attemptId: "attempt-2", status: "settle_failed" });

    const response = await POST(
      hostedEndpointPostRequest({
        apiKey: "casper_demo",
        body: { id: "call-1", jsonrpc: "2.0", method: "tools/call", params: { arguments: {}, name: "get_quote" } },
      }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.error.code).toBe(-32010);
    expect(body.error.data).toMatchObject({ attemptId: "attempt-2", status: "settle_failed" });
  });
});
