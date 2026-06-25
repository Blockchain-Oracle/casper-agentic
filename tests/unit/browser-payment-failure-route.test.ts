import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reportBrowserPaymentFailure: vi.fn(),
}));

vi.mock("@/server/browser-payment-failure", () => ({
  BrowserPaymentFailureInputError: class BrowserPaymentFailureInputError extends Error {
    readonly status = 400;
  },
  isBrowserPaymentFailureInputError: (error: unknown) => error instanceof Error && "status" in error,
  reportBrowserPaymentFailure: mocks.reportBrowserPaymentFailure,
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("browser payment failure route", () => {
  it("requires operator access before closing browser payment", async () => {
    const { POST } = await import("@/app/api/paid-calls/browser-failures/route");

    const response = await POST(request({ body: { attemptId: "attempt-1" } }));

    expect(response.status).toBe(403);
    expect(mocks.reportBrowserPaymentFailure).not.toHaveBeenCalled();
  });

  it("passes browser signing failure input to the orchestrator", async () => {
    const { POST } = await import("@/app/api/paid-calls/browser-failures/route");
    mocks.reportBrowserPaymentFailure.mockResolvedValue({ attemptId: "attempt-1", status: "auth_failed" });

    const body = {
      attemptId: "attempt-1",
      errorCode: "UNSUPPORTED_TYPE",
      reason: "signTypedData is not supported by this provider",
      resultStatus: "auth_failed",
      toolName: "get_quote",
    };
    const response = await POST(request({ body, token: "operator-token" }));

    expect(response.status).toBe(200);
    expect(mocks.reportBrowserPaymentFailure).toHaveBeenCalledWith(body);
  });

  it("rejects missing failure reason before orchestration", async () => {
    const { POST } = await import("@/app/api/paid-calls/browser-failures/route");

    const response = await POST(
      request({
        body: { attemptId: "attempt-1", toolName: "get_quote" },
        token: "operator-token",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/reason is required/);
    expect(mocks.reportBrowserPaymentFailure).not.toHaveBeenCalled();
  });
});

function request(init: { body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (init.token) headers.set("x-casper-gw-operator-token", init.token);
  if (init.body) headers.set("content-type", "application/json");

  return new NextRequest("https://gw.test/api/paid-calls/browser-failures", {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: "POST",
  });
}
