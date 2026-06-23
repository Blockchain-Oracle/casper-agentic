import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runLivePaidToolCall: vi.fn(),
}));

vi.mock("@/server/live-paid-call", () => ({
  isPaidCallInputError: (error: unknown) => error instanceof Error && "status" in error,
  PaidCallInputError: class PaidCallInputError extends Error {
    readonly status = 400;
  },
  runLivePaidToolCall: mocks.runLivePaidToolCall,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
  process.env.CASPER_GW_HTTP_SIGNING_ENABLED = "true";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("paid-call route", () => {
  it("requires operator access before running a paid call", async () => {
    const { POST } = await import("@/app/api/paid-calls/run/route");

    const response = await POST(request({ body: { toolName: "get_quote" } }));

    expect(response.status).toBe(403);
    expect(mocks.runLivePaidToolCall).not.toHaveBeenCalled();
  });

  it("passes endpoint, selected wallet, tool, and args to the live orchestrator", async () => {
    const { POST } = await import("@/app/api/paid-calls/run/route");
    mocks.runLivePaidToolCall.mockResolvedValue({ attemptId: "attempt-1", status: "settled" });

    const response = await POST(
      request({
        body: {
          args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
          endpointUrl: "https://mcp.cspr.trade/mcp",
          toolName: "get_quote",
          walletId: "wallet-1",
        },
        token: "operator-token",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.runLivePaidToolCall).toHaveBeenCalledWith({
      args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      toolName: "get_quote",
      walletId: "wallet-1",
    });
  });

  it("rejects missing selected wallet before orchestration", async () => {
    const { POST } = await import("@/app/api/paid-calls/run/route");

    const response = await POST(
      request({
        body: {
          args: { amount: "10" },
          endpointUrl: "https://mcp.cspr.trade/mcp",
          toolName: "get_quote",
        },
        token: "operator-token",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/walletId is required/);
    expect(mocks.runLivePaidToolCall).not.toHaveBeenCalled();
  });

  it("rejects malformed args before orchestration", async () => {
    const { POST } = await import("@/app/api/paid-calls/run/route");

    const response = await POST(
      request({
        body: {
          args: "amount=10",
          endpointUrl: "https://mcp.cspr.trade/mcp",
          toolName: "get_quote",
          walletId: "wallet-1",
        },
        token: "operator-token",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/args object is required/);
    expect(mocks.runLivePaidToolCall).not.toHaveBeenCalled();
  });
});

function request(init: { body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (init.token) headers.set("x-casper-gw-operator-token", init.token);
  if (init.body) headers.set("content-type", "application/json");

  return new NextRequest("https://gw.test/api/paid-calls/run", {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: "POST",
  });
}
