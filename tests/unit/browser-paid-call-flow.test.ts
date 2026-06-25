import { describe, expect, it, vi } from "vitest";

import { digest, payerHash, payeeAddress, requirements, signParams, successfulSignature } from "./browser-x402-signing-fixtures";

import { runBrowserPaidCallFlow } from "@/lib/browser-paid-call-flow";

const readyIntent = {
  attemptId: "attempt-1",
  paymentRequirements: requirements,
  resource: { url: "https://mcp.cspr.trade/mcp#get_quote" },
  signing: {
    expectedAccountHash: payerHash,
    expectedPublicKey: successfulSignature.publicKey,
    signTypedDataParams: {
      options: { returnHashArtifacts: true },
      typedData: {
        domain: signParams.typedData.domain,
        message: {
          ...signParams.typedData.message,
          to: payeeAddress,
        },
        primaryType: "TransferWithAuthorization",
        types: signParams.typedData.types,
      },
    },
  },
  status: "ready_for_signature",
  x402Version: 2,
};

describe("browser paid-call flow", () => {
  it("runs payment intent, CSPR.click signing, and browser completion", async () => {
    const fetchJson = fetchDouble([readyIntent, { attemptId: "attempt-1", status: "settled" }]);
    const result = await runBrowserPaidCallFlow({
      args: { amount: "10" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      fetchJson,
      getBrowserState: async () => ({ activePublicKey: successfulSignature.publicKey, connected: true }),
      operatorToken: "operator-token",
      signTypedData: vi.fn().mockResolvedValue({
        ...successfulSignature,
        hashArtifacts: {
          domainSeparator: `0x${"11".repeat(32)}`,
          structHash: `0x${"22".repeat(32)}`,
        },
      }),
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result).toEqual({ attemptId: "attempt-1", message: "Browser payment result: settled", status: "settled" });
    expect(fetchJson).toHaveBeenNthCalledWith(1, "/api/paid-calls/payment-intents", expect.any(Object));
    expect(fetchJson).toHaveBeenNthCalledWith(2, "/api/paid-calls/browser-completions", expect.objectContaining({
      body: expect.objectContaining({
        attemptId: "attempt-1",
        paymentPayload: expect.any(Object),
        signingEvidence: {
          digest,
          hashArtifacts: {
            domainSeparator: `0x${"11".repeat(32)}`,
            structHash: `0x${"22".repeat(32)}`,
          },
          publicKey: successfulSignature.publicKey.toLowerCase(),
        },
      }),
    }));
  });

  it("does not request CSPR.click signing when policy blocks the intent", async () => {
    const signTypedData = vi.fn();
    const result = await runBrowserPaidCallFlow({
      args: { amount: "10" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      fetchJson: fetchDouble([{ attemptId: "attempt-1", policy: { reason: "policy is disabled" }, status: "blocked" }]),
      getBrowserState: async () => ({ connected: false }),
      operatorToken: "operator-token",
      signTypedData,
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result).toEqual({ attemptId: "attempt-1", message: "policy is disabled", status: "blocked" });
    expect(signTypedData).not.toHaveBeenCalled();
  });

  it("fails closed before signing when the active CSPR.click key mismatches the selected wallet", async () => {
    const signTypedData = vi.fn();
    const fetchJson = fetchDouble([failureIntent(), failureClosed("CSPR.click active account does not match the selected wallet")]);
    const result = await runBrowserPaidCallFlow({
      args: { amount: "10" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      fetchJson,
      getBrowserState: async () => ({ activePublicKey: `01${"cd".repeat(32)}`, connected: true }),
      operatorToken: "operator-token",
      signTypedData,
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result.status).toBe("auth_failed");
    expect(result.message).toMatch(/active account does not match/);
    expect(signTypedData).not.toHaveBeenCalled();
    expect(fetchJson).toHaveBeenNthCalledWith(2, "/api/paid-calls/browser-failures", expect.objectContaining({
      body: expect.objectContaining({
        attemptId: "attempt-1",
        errorCode: "ACTIVE_ACCOUNT_MISMATCH",
        resultStatus: "auth_failed",
      }),
      operatorToken: "operator-token",
    }));
  });

  it("stops honestly when CSPR.click signing is cancelled", async () => {
    const fetchJson = fetchDouble([readyIntent, failureClosed("CSPR.click signing was cancelled")]);
    const result = await runBrowserPaidCallFlow({
      args: { amount: "10" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      fetchJson,
      getBrowserState: async () => ({ activePublicKey: successfulSignature.publicKey, connected: true }),
      operatorToken: "operator-token",
      signTypedData: vi.fn().mockResolvedValue({ cancelled: true, digest: null, error: null, publicKey: null, signatureHex: null }),
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result).toEqual({ attemptId: "attempt-1", message: "CSPR.click signing was cancelled", status: "auth_failed" });
    expect(fetchJson).toHaveBeenNthCalledWith(2, "/api/paid-calls/browser-failures", expect.objectContaining({
      body: expect.objectContaining({ attemptId: "attempt-1", errorCode: "USER_CANCELLED" }),
    }));
  });

  it("records unsupported CSPR.click signing before returning to the console", async () => {
    const fetchJson = fetchDouble([readyIntent, failureClosed("signTypedData is not supported by this provider")]);
    const result = await runBrowserPaidCallFlow({
      args: { amount: "10" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      fetchJson,
      getBrowserState: async () => ({ activePublicKey: successfulSignature.publicKey, connected: true }),
      operatorToken: "operator-token",
      signTypedData: vi.fn().mockResolvedValue({
        cancelled: false,
        digest: null,
        error: "signTypedData is not supported by this provider",
        errorCode: "UNSUPPORTED_TYPE",
        publicKey: successfulSignature.publicKey,
        signatureHex: null,
      }),
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result).toEqual({ attemptId: "attempt-1", message: "signTypedData is not supported by this provider", status: "auth_failed" });
    expect(fetchJson).toHaveBeenNthCalledWith(2, "/api/paid-calls/browser-failures", expect.objectContaining({
      body: expect.objectContaining({ errorCode: "UNSUPPORTED_TYPE", reason: "signTypedData is not supported by this provider" }),
    }));
  });

  it.each(["verify_failed", "settle_failed", "raw_proof_unavailable", "upstream_failed"] as const)(
    "returns %s browser completion status without rewriting it",
    async (status) => {
      const result = await runBrowserPaidCallFlow({
        args: { amount: "10" },
        endpointUrl: "https://mcp.cspr.trade/mcp",
        fetchJson: fetchDouble([readyIntent, { attemptId: "attempt-1", status }]),
        getBrowserState: async () => ({ activePublicKey: successfulSignature.publicKey, connected: true }),
        operatorToken: "operator-token",
        signTypedData: vi.fn().mockResolvedValue(successfulSignature),
        toolName: "get_quote",
        walletId: "wallet-1",
      });

      expect(result).toEqual({ attemptId: "attempt-1", message: `Browser payment result: ${status}`, status });
    },
  );
});

function fetchDouble(responses: unknown[]) {
  return vi.fn().mockImplementation(async () => responses.shift());
}

function failureIntent() {
  return readyIntent;
}

function failureClosed(message: string) {
  return { attemptId: "attempt-1", message, reason: message, status: "auth_failed" };
}
