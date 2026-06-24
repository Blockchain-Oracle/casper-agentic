import { beforeEach, describe, expect, it, vi } from "vitest";

import { hostedPaidCallInput, setHostedPaidCallDefaults } from "./hosted-paid-call-fixtures";

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

describe("hosted paid-call post-settlement handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setHostedPaidCallDefaults(mocks);
  });

  it("withholds upstream execution when Casper proof is pending after settlement", async () => {
    mocks.resolveCasperProof.mockResolvedValue({ error: "not indexed" });

    const output = await runHostedPaidToolCall(hostedPaidCallInput());

    expect(output).toMatchObject({ code: -32016, kind: "error", status: 202 });
    expect(output.paymentResponseHeader).toBeTruthy();
    expect(mocks.persistCasperProof).toHaveBeenCalledWith(expect.objectContaining({ proofStatus: "pending_indexing" }));
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith(
      "attempt-1",
      "raw_proof_unavailable",
      "Casper proof pending CSPR.cloud indexing",
    );
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });

  it("returns payment response and records upstream failure when MCP call throws after proof", async () => {
    mocks.callMcpTool.mockRejectedValue(new Error("upstream timeout"));

    const output = await runHostedPaidToolCall(hostedPaidCallInput());

    expect(output).toMatchObject({
      code: -32017,
      data: { attemptId: "attempt-1", reason: "upstream_request_failed", status: "upstream_failed" },
      kind: "error",
      status: 502,
    });
    expect(output.paymentResponseHeader).toBeTruthy();
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "upstream_failed", "MCP tool request failed", {
      error: "upstream timeout",
    });
    expect(mocks.persistAudit).toHaveBeenCalledWith(
      "attempt-1",
      "fail",
      "Hosted upstream MCP request failed after settlement",
      expect.objectContaining({ error: "upstream timeout", toolName: "get_quote" }),
    );
  });
});
