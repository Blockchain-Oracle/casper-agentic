import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  browserCompletionInput,
  setBrowserCompletionDefaults,
  type BrowserCompletionMocks,
} from "./browser-payment-completion-fixtures";
import { payerHash } from "./browser-x402-signing-fixtures";

import { hashPaidCallInput } from "@/server/paid-call-input-hash";

const mocks = vi.hoisted<BrowserCompletionMocks>(() => ({
  buildPaymentRequirements: vi.fn(),
  callMcpTool: vi.fn(),
  getAccount: vi.fn(),
  getFTOwnerships: vi.fn(),
  getLatestPolicyDecisionForAttempt: vi.fn(),
  getPaidCallAttempt: vi.fn(),
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

describe("browser payment completion guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setBrowserCompletionDefaults(mocks);
  });

  it("blocks before x402 when no allowed policy decision exists", async () => {
    mocks.getLatestPolicyDecisionForAttempt.mockResolvedValue(null);

    const result = await completeBrowserSignedPayment(browserCompletionInput());

    expect(result).toEqual({
      attemptId: "attempt-1",
      reason: "browser payment intent is missing an allowed policy decision",
      status: "blocked",
    });
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });

  it("blocks when request args do not match the server-approved intent hash", async () => {
    const result = await completeBrowserSignedPayment(
      browserCompletionInput({ args: { amount: "999", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" } }),
    );

    expect(result).toEqual({ attemptId: "attempt-1", reason: "browser payment intent input hash mismatch", status: "blocked" });
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });

  it("blocks when the current spend policy no longer allows the call", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue({
      allowedAsset: "asset",
      allowedNetwork: "casper:casper-test",
      allowedTools: ["get_quote"],
      disabled: true,
      maxPerCall: BigInt(5),
    });

    const result = await completeBrowserSignedPayment(browserCompletionInput());

    expect(result).toEqual({ attemptId: "attempt-1", reason: "policy is disabled", status: "blocked" });
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
      "attempt-1",
      false,
      "policy is disabled",
      expect.objectContaining({ browserPaymentCompletion: expect.objectContaining({ policyRechecked: true }) }),
    );
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it("marks the attempt upstream_failed when the MCP call throws after settlement", async () => {
    mocks.callMcpTool.mockRejectedValue(new Error("mcp connection timeout"));

    const result = await completeBrowserSignedPayment(browserCompletionInput());

    expect(result).toEqual({
      attemptId: "attempt-1",
      explorerUrl: "https://testnet.cspr.live/deploy/deploy-1",
      status: "upstream_failed",
    });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith(
      "attempt-1",
      "upstream_failed",
      "MCP tool call failed after settlement",
      { text: "mcp connection timeout" },
    );
  });

  it("keeps retries valid after a transient facilitator verify failure", async () => {
    const policyRows = [
      {
        allowed: true,
        evaluatedPolicy: { browserPaymentIntent: { inputHash: hashPaidCallInput(browserCompletionInput().args) } },
        reason: "policy allowed before signing/payment",
      },
    ];
    mocks.getLatestPolicyDecisionForAttempt.mockImplementation(async () => policyRows.at(-1));
    mocks.persistPolicyDecision.mockImplementation(async (_attemptId, allowed, reason, evaluatedPolicy) => {
      policyRows.push({ allowed, evaluatedPolicy, reason });
    });
    mocks.verify.mockRejectedValueOnce(new Error("facilitator fetch failed")).mockResolvedValueOnce({
      isValid: true,
      payer: `00${payerHash}`,
    });

    await expect(completeBrowserSignedPayment(browserCompletionInput())).rejects.toThrow("facilitator fetch failed");
    const result = await completeBrowserSignedPayment(browserCompletionInput());

    expect(result).toMatchObject({ attemptId: "attempt-1", status: "settled" });
    expect(mocks.verify).toHaveBeenCalledTimes(2);
    expect(mocks.settle).toHaveBeenCalledOnce();
  });
});
