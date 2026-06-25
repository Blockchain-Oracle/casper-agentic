import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPaidCallAttempt: vi.fn(),
  hasDatabaseUrl: vi.fn(),
  persistAudit: vi.fn(),
  updateAttemptStatus: vi.fn(),
}));

vi.mock("@/db/client", () => ({ hasDatabaseUrl: mocks.hasDatabaseUrl }));
vi.mock("@/server/paid-call-attempt-store", () => ({ getPaidCallAttempt: mocks.getPaidCallAttempt }));
vi.mock("@/server/receipt-store", () => ({
  persistAudit: mocks.persistAudit,
  updateAttemptStatus: mocks.updateAttemptStatus,
}));

import { reportBrowserPaymentFailure } from "@/server/browser-payment-failure";

describe("browser payment failure reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasDatabaseUrl.mockReturnValue(true);
    mocks.getPaidCallAttempt.mockResolvedValue({
      client: "csprclick-browser-intent",
      status: "policy_pending",
      toolName: "get_quote",
    });
  });

  it("closes a pending browser intent as auth_failed without creating x402 proof", async () => {
    const result = await reportBrowserPaymentFailure({
      attemptId: "attempt-1",
      errorCode: "UNSUPPORTED_TYPE",
      reason: "signTypedData is not supported by this provider",
      resultStatus: "auth_failed",
      toolName: "get_quote",
    });

    expect(result).toEqual({
      attemptId: "attempt-1",
      message: "signTypedData is not supported by this provider",
      reason: "signTypedData is not supported by this provider",
      status: "auth_failed",
    });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith(
      "attempt-1",
      "auth_failed",
      "signTypedData is not supported by this provider",
      { browserSigning: { errorCode: "UNSUPPORTED_TYPE", resultStatus: "auth_failed" } },
    );
    expect(mocks.persistAudit).toHaveBeenCalledWith(
      "attempt-1",
      "fail",
      "Browser CSPR.click signing failed before facilitator",
      { errorCode: "UNSUPPORTED_TYPE", resultStatus: "auth_failed" },
    );
  });

  it("rejects non-browser attempts", async () => {
    mocks.getPaidCallAttempt.mockResolvedValue({ client: "phase-0-console", status: "policy_pending", toolName: "get_quote" });

    await expect(reportBrowserPaymentFailure(baseInput())).rejects.toThrow(/not a browser payment intent/);
    expect(mocks.updateAttemptStatus).not.toHaveBeenCalled();
  });

  it("rejects attempts that already left signature wait state", async () => {
    mocks.getPaidCallAttempt.mockResolvedValue({ client: "csprclick-browser-intent", status: "settled", toolName: "get_quote" });

    await expect(reportBrowserPaymentFailure(baseInput())).rejects.toThrow(/not waiting for signature/);
    expect(mocks.updateAttemptStatus).not.toHaveBeenCalled();
  });
});

function baseInput() {
  return {
    attemptId: "attempt-1",
    reason: "CSPR.click signing failed",
    toolName: "get_quote",
  };
}
