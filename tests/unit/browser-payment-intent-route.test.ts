import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createBrowserPaymentIntent: vi.fn(),
}));

vi.mock("@/server/browser-payment-intent", () => ({
  BrowserPaymentIntentInputError: class BrowserPaymentIntentInputError extends Error {
    readonly status = 400;
  },
  createBrowserPaymentIntent: mocks.createBrowserPaymentIntent,
  isBrowserPaymentIntentInputError: (error: unknown) => error instanceof Error && "status" in error,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("browser payment-intent route", () => {
  it("requires operator access before preparing an intent", async () => {
    const { POST } = await import("@/app/api/paid-calls/payment-intents/route");

    const response = await POST(request({ body: { toolName: "get_quote" } }));

    expect(response.status).toBe(403);
    expect(mocks.createBrowserPaymentIntent).not.toHaveBeenCalled();
  });

  it("passes endpoint, selected wallet, tool, and args to the intent builder", async () => {
    const { POST } = await import("@/app/api/paid-calls/payment-intents/route");
    mocks.createBrowserPaymentIntent.mockResolvedValue({ attemptId: "attempt-1", status: "ready_for_signature" });

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
    expect(mocks.createBrowserPaymentIntent).toHaveBeenCalledWith({
      args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      toolName: "get_quote",
      walletId: "wallet-1",
    });
  });

  it("rejects malformed args before preparing an intent", async () => {
    const { POST } = await import("@/app/api/paid-calls/payment-intents/route");

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
    expect(mocks.createBrowserPaymentIntent).not.toHaveBeenCalled();
  });
});

function request(init: { body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (init.token) headers.set("x-casper-gw-operator-token", init.token);
  if (init.body) headers.set("content-type", "application/json");

  return new NextRequest("https://gw.test/api/paid-calls/payment-intents", {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: "POST",
  });
}
