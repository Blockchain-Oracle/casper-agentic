import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  hostedPaidCallInput,
  hostedPaidCallPayload,
  hostedPaidCallPayerAddress,
  hostedPaidCallRequirements,
  setHostedPaidCallDefaults,
} from "./hosted-paid-call-fixtures";

const mocks = vi.hoisted(() => ({
  callMcpTool: vi.fn(),
  getAccount: vi.fn(),
  getFTOwnerships: vi.fn(),
  getSpendPolicyForWallet: vi.fn(),
  getWalletDailySpend: vi.fn(),
  persistAttempt: vi.fn(),
  persistAudit: vi.fn(),
  persistCasperProof: vi.fn(),
  persistPolicyDecision: vi.fn(),
  persistX402Record: vi.fn(),
  resolveCasperProof: vi.fn(),
  settle: vi.fn(),
  updateAttemptStatus: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/server/env", () => ({
  getRuntimeConfig: () => ({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "token",
    csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    facilitatorUrl: "https://x402-facilitator.cspr.cloud",
  }),
}));

vi.mock("@/server/x402-facilitator", () => ({
  X402FacilitatorClient: vi.fn().mockImplementation(function X402FacilitatorClient() {
    return { settle: mocks.settle, verify: mocks.verify };
  }),
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: vi.fn().mockImplementation(function CsprCloudClient() {
    return { getAccount: mocks.getAccount, getFTOwnerships: mocks.getFTOwnerships };
  }),
}));

vi.mock("@/server/receipt-store", () => ({
  persistAttempt: mocks.persistAttempt,
  persistAudit: mocks.persistAudit,
  persistCasperProof: mocks.persistCasperProof,
  persistPolicyDecision: mocks.persistPolicyDecision,
  persistX402Record: mocks.persistX402Record,
  updateAttemptStatus: mocks.updateAttemptStatus,
}));

vi.mock("@/server/spend-policy-store", () => ({
  getSpendPolicyForWallet: mocks.getSpendPolicyForWallet,
  getWalletDailySpend: mocks.getWalletDailySpend,
}));

vi.mock("@/server/casper-proof", () => ({
  resolveCasperProof: mocks.resolveCasperProof,
}));

vi.mock("@/server/mcp-client", () => ({
  callMcpTool: mocks.callMcpTool,
}));

import { runHostedPaidToolCall } from "@/server/hosted-paid-call";

describe("hosted paid-call orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setHostedPaidCallDefaults(mocks);
  });

  it("settles, resolves proof, calls upstream, and returns payment response on success", async () => {
    await expect(runHostedPaidToolCall(hostedPaidCallInput())).resolves.toMatchObject({
      attemptId: "attempt-1",
      kind: "success",
      result: { content: [{ text: "quote", type: "text" }] },
    });

    expect(mocks.verify).toHaveBeenCalledWith({
      paymentPayload: hostedPaidCallPayload(),
      paymentRequirements: hostedPaidCallRequirements,
    });
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
      "attempt-1",
      true,
      "policy allowed before settlement",
      expect.objectContaining({ policyLoaded: true }),
    );
    expect(mocks.settle).toHaveBeenCalledWith({
      paymentPayload: hostedPaidCallPayload(),
      paymentRequirements: hostedPaidCallRequirements,
    });
    expect(mocks.resolveCasperProof).toHaveBeenCalledWith(expect.any(Object), { asset: "asset", deployHash: "deploy-1" });
    expect(mocks.callMcpTool).toHaveBeenCalledWith("https://mcp.cspr.trade/mcp", "get_quote", { amount: "1" });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "settled", undefined, { text: "quote" });
  });

  it("rejects resource mismatch before facilitator verify or settlement", async () => {
    const output = await runHostedPaidToolCall(hostedPaidCallInput({ requestUrl: "https://gw.test/api/mcp/other-source" }));

    expect(output).toMatchObject({ code: -32013, kind: "error", status: 402 });
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.persistAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "verify_failed" }));
    expect(mocks.persistX402Record).toHaveBeenCalledWith(
      expect.objectContaining({ verifyResponse: expect.objectContaining({ invalidReason: "resource_mismatch" }) }),
    );
  });

  it("persists verify failure and does not evaluate policy or settle", async () => {
    mocks.verify.mockResolvedValue({
      invalidReason: "invalid_signature",
      isValid: false,
      payer: hostedPaidCallPayerAddress,
    });

    const output = await runHostedPaidToolCall(hostedPaidCallInput());

    expect(output).toMatchObject({ code: -32013, kind: "error", status: 402 });
    expect(mocks.persistAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "verify_failed" }));
    expect(mocks.getAccount).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it("blocks before settlement when wallet policy is missing", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(null);

    const output = await runHostedPaidToolCall(hostedPaidCallInput());

    expect(output).toMatchObject({ code: -32014, kind: "error", status: 403 });
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
      "attempt-1",
      false,
      "no active spend policy for wallet",
      expect.objectContaining({ policyLoaded: false }),
    );
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "blocked", "no active spend policy for wallet");
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it("records settle failure without proof lookup or upstream execution", async () => {
    mocks.settle.mockResolvedValue({ errorReason: "insufficient_funds", success: false });

    const output = await runHostedPaidToolCall(hostedPaidCallInput());

    expect(output).toMatchObject({ code: -32015, kind: "error", status: 402 });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "settle_failed", "insufficient_funds");
    expect(mocks.resolveCasperProof).not.toHaveBeenCalled();
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });

  it("records settle request failures without proof lookup or upstream execution", async () => {
    mocks.settle.mockRejectedValue(new Error("facilitator timeout"));

    const output = await runHostedPaidToolCall(hostedPaidCallInput());

    expect(output).toMatchObject({ code: -32015, kind: "error", status: 502 });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "settle_failed", "settle_request_failed");
    expect(mocks.persistX402Record).toHaveBeenLastCalledWith(
      expect.objectContaining({
        settleResponse: expect.objectContaining({
          errorMessage: "facilitator timeout",
          errorReason: "settle_request_failed",
          success: false,
        }),
      }),
    );
    expect(mocks.resolveCasperProof).not.toHaveBeenCalled();
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });
});
