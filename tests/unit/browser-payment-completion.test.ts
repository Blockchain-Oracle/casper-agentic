import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  browserCompletionInput,
  setBrowserCompletionDefaults,
  type BrowserCompletionMocks,
} from "./browser-payment-completion-fixtures";

const mocks = vi.hoisted<BrowserCompletionMocks>(() => ({
  buildPaymentRequirements: vi.fn(),
  callMcpTool: vi.fn(),
  getAccount: vi.fn(),
  getFTOwnerships: vi.fn(),
  getPaidCallAttempt: vi.fn(),
  getLatestPolicyDecisionForAttempt: vi.fn(),
  getSpendPolicyForWallet: vi.fn(),
  getWalletDailySpend: vi.fn(),
  hasDatabaseUrl: vi.fn(),
  persistAudit: vi.fn(),
  persistCasperProof: vi.fn(),
  persistPolicyDecision: vi.fn(),
  persistX402Record: vi.fn(),
  resolveCasperProof: vi.fn(),
  settle: vi.fn(),
  updateAttemptStatus: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/db/client", () => ({ hasDatabaseUrl: mocks.hasDatabaseUrl }));

vi.mock("@/server/env", () => ({
  getRuntimeConfig: () => ({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "cspr-cloud-token",
    csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    facilitatorUrl: "https://x402-facilitator.cspr.cloud",
    mcpUrl: "https://mcp.cspr.trade/mcp",
    paymentAmount: "5",
    paymentAsset: "asset",
    paymentAssetDecimals: 9,
    paymentAssetName: "Wrapped CSPR",
    paymentAssetSymbol: "WCSPR",
    paymentTimeoutSeconds: 900,
    payeeAccountHash: "payee",
  }),
}));

vi.mock("@/server/x402-facilitator", () => ({
  X402FacilitatorClient: vi.fn().mockImplementation(function X402FacilitatorClient() {
    return { settle: mocks.settle, verify: mocks.verify };
  }),
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: vi.fn().mockImplementation(function CsprCloudClient() {
    return {
      getAccount: mocks.getAccount,
      getFTOwnerships: mocks.getFTOwnerships,
    };
  }),
}));

vi.mock("@/server/casper-proof", () => ({ resolveCasperProof: mocks.resolveCasperProof }));
vi.mock("@/server/mcp-client", () => ({ callMcpTool: mocks.callMcpTool }));
vi.mock("@/server/x402-payment", () => ({ buildPaymentRequirements: mocks.buildPaymentRequirements }));
vi.mock("@/server/spend-policy-store", () => ({
  getSpendPolicyForWallet: mocks.getSpendPolicyForWallet,
  getWalletDailySpend: mocks.getWalletDailySpend,
}));
vi.mock("@/server/paid-call-attempt-store", () => ({
  getLatestPolicyDecisionForAttempt: mocks.getLatestPolicyDecisionForAttempt,
  getPaidCallAttempt: mocks.getPaidCallAttempt,
}));
vi.mock("@/server/receipt-store", () => ({
  persistAudit: mocks.persistAudit,
  persistCasperProof: mocks.persistCasperProof,
  persistPolicyDecision: mocks.persistPolicyDecision,
  persistX402Record: mocks.persistX402Record,
  updateAttemptStatus: mocks.updateAttemptStatus,
}));

import { completeBrowserSignedPayment } from "@/server/browser-payment-completion";

describe("browser payment completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setBrowserCompletionDefaults(mocks);
  });

  it("verifies, settles, resolves Casper proof, and calls the protected tool", async () => {
    const result = await completeBrowserSignedPayment(
      browserCompletionInput({
        signingEvidence: {
          digest: `0x${"ef".repeat(32)}`,
          hashArtifacts: {
            domain: { ["x".repeat(120)]: "trimmed", chain_name: "casper:casper-test", contract_package_hash: "asset" },
            domainSeparator: `0x${"11".repeat(32)}`,
            ignoredNested: { value: "ignored" },
            structHash: `0x${"22".repeat(32)}`,
          },
          publicKey: "01ab",
        },
      }),
    );

    expect(result).toMatchObject({
      attemptId: "attempt-1",
      explorerUrl: "https://testnet.cspr.live/deploy/deploy-1",
      status: "settled",
    });
    expect(mocks.verify).toHaveBeenCalledOnce();
    expect(mocks.settle).toHaveBeenCalledOnce();
    expect(mocks.persistX402Record).toHaveBeenCalledWith(
      expect.objectContaining({ attemptId: "attempt-1", verifyResponse: expect.objectContaining({ isValid: true }) }),
    );
    expect(mocks.persistCasperProof).toHaveBeenCalledWith(
      expect.objectContaining({ attemptId: "attempt-1", deployHash: "deploy-1", proofStatus: "processed" }),
    );
    expect(mocks.callMcpTool).toHaveBeenCalledWith("https://mcp.cspr.trade/mcp", "get_quote", {
      amount: "10",
      token_in: "CSPR",
      token_out: "WCSPR",
      type: "exact_in",
    });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "settled", undefined, { text: "quote" });
    expect(mocks.persistAudit).toHaveBeenCalledWith(
      "attempt-1",
      "info",
      "Browser CSPR.click signing evidence received",
      {
        digest: `0x${"ef".repeat(32)}`,
        hasHashArtifacts: true,
        hashArtifacts: {
          domain: { ["x".repeat(80)]: "trimmed", chain_name: "casper:casper-test", contract_package_hash: "asset" },
          domainSeparator: `0x${"11".repeat(32)}`,
          structHash: `0x${"22".repeat(32)}`,
        },
        publicKey: "01ab",
      },
    );
    expect(JSON.stringify(result)).not.toContain("cspr-cloud-token");
  });

  it("does not settle or call the tool when facilitator verify fails", async () => {
    mocks.verify.mockResolvedValue({ invalidReason: "signature expired", isValid: false });

    const result = await completeBrowserSignedPayment(browserCompletionInput());

    expect(result).toEqual({ attemptId: "attempt-1", reason: "signature expired", status: "verify_failed" });
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "verify_failed", "signature expired");
  });

  it("fails verification when the signed payer does not match the original intent wallet", async () => {
    mocks.verify.mockResolvedValue({
      isValid: true,
      payer: "00aa35d1c9dcaadea97c34d79b55b6af07aa9d760e5dd1aabf78a45fb39e0723fa",
    });

    const result = await completeBrowserSignedPayment(browserCompletionInput());

    expect(result).toEqual({ attemptId: "attempt-1", reason: "payer_mismatch", status: "verify_failed" });
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });
});
