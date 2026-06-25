import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  completeBrowserSignedPayment: vi.fn(),
}));

vi.mock("@/server/browser-payment-completion", () => ({
  BrowserPaymentCompletionInputError: class BrowserPaymentCompletionInputError extends Error {
    readonly status = 400;
  },
  completeBrowserSignedPayment: mocks.completeBrowserSignedPayment,
  isBrowserPaymentCompletionInputError: (error: unknown) => error instanceof Error && "status" in error,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("browser payment completion route", () => {
  it("requires operator access before completing browser payment", async () => {
    const { POST } = await import("@/app/api/paid-calls/browser-completions/route");

    const response = await POST(request({ body: { attemptId: "attempt-1" } }));

    expect(response.status).toBe(403);
    expect(mocks.completeBrowserSignedPayment).not.toHaveBeenCalled();
  });

  it("passes signed payload completion input to the orchestrator", async () => {
    const { POST } = await import("@/app/api/paid-calls/browser-completions/route");
    mocks.completeBrowserSignedPayment.mockResolvedValue({ attemptId: "attempt-1", status: "settled" });

    const body = {
      args: { amount: "10" },
      attemptId: "attempt-1",
      endpointUrl: "https://mcp.cspr.trade/mcp",
      paymentPayload: { payload: { authorization: { from: "payer" } }, resource: { url: "https://mcp.cspr.trade/mcp#get_quote" } },
      toolName: "get_quote",
    };
    const response = await POST(request({ body, token: "operator-token" }));

    expect(response.status).toBe(200);
    expect(mocks.completeBrowserSignedPayment).toHaveBeenCalledWith(body);
  });

  it("rejects missing payment payload before orchestration", async () => {
    const { POST } = await import("@/app/api/paid-calls/browser-completions/route");

    const response = await POST(
      request({
        body: {
          args: { amount: "10" },
          attemptId: "attempt-1",
          endpointUrl: "https://mcp.cspr.trade/mcp",
          toolName: "get_quote",
        },
        token: "operator-token",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/paymentPayload object is required/);
    expect(mocks.completeBrowserSignedPayment).not.toHaveBeenCalled();
  });
});

function request(init: { body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (init.token) headers.set("x-casper-gw-operator-token", init.token);
  if (init.body) headers.set("content-type", "application/json");

  return new NextRequest("https://gw.test/api/paid-calls/browser-completions", {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: "POST",
  });
}
