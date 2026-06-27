import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runGatewayPaidCall: vi.fn(),
}));

vi.mock("@/server/live-paid-call", () => ({
  isPaidCallInputError: (error: unknown) => error instanceof Error && "status" in error,
  PaidCallInputError: class PaidCallInputError extends Error {
    readonly status = 400;
  },
  runGatewayPaidCall: mocks.runGatewayPaidCall,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("paid-call route (gateway-signed, no operator gate)", () => {
  it("runs the gateway paid call with endpoint, tool, and args", async () => {
    const { POST } = await import("@/app/api/paid-calls/run/route");
    mocks.runGatewayPaidCall.mockResolvedValue({ attemptId: "attempt-1", status: "settled" });

    const response = await POST(
      request({
        body: {
          args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
          endpointUrl: "https://mcp.cspr.trade/mcp",
          toolName: "get_quote",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.runGatewayPaidCall).toHaveBeenCalledWith({
      args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
      client: undefined,
      endpointUrl: "https://mcp.cspr.trade/mcp",
      toolName: "get_quote",
    });
  });

  it("rejects malformed args before orchestration", async () => {
    const { POST } = await import("@/app/api/paid-calls/run/route");

    const response = await POST(
      request({
        body: { args: "amount=10", endpointUrl: "https://mcp.cspr.trade/mcp", toolName: "get_quote" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/args object is required/);
    expect(mocks.runGatewayPaidCall).not.toHaveBeenCalled();
  });

  it("rejects a missing tool name", async () => {
    const { POST } = await import("@/app/api/paid-calls/run/route");

    const response = await POST(
      request({ body: { args: { amount: "10" }, endpointUrl: "https://mcp.cspr.trade/mcp" } }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/toolName is required/);
    expect(mocks.runGatewayPaidCall).not.toHaveBeenCalled();
  });
});

function request(init: { body?: unknown } = {}) {
  const headers = new Headers();
  if (init.body) headers.set("content-type", "application/json");
  return new NextRequest("https://gw.test/api/paid-calls/run", {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: "POST",
  });
}
