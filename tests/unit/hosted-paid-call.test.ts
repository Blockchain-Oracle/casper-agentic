import { encodePaymentSignatureHeader } from "@x402/core/http";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const payerHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
const payerAddress = `00${payerHash}`;
const requestUrl = "https://gw.test/api/mcp/source-1";
const requirements = {
  amount: "5",
  asset: "asset",
  extra: { name: "Wrapped CSPR", version: "1" },
  maxTimeoutSeconds: 900,
  network: "casper:casper-test",
  payTo: "payee",
  scheme: "exact",
} satisfies PaymentRequirements;

describe("hosted paid-call orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.persistAttempt.mockResolvedValue({ id: "attempt-1" });
    mocks.verify.mockResolvedValue({ isValid: true, payer: payerAddress });
    mocks.getAccount.mockResolvedValue({ account_hash: payerHash, balance: "10" });
    mocks.getFTOwnerships.mockResolvedValue([{ balance: "10" }]);
    mocks.getSpendPolicyForWallet.mockResolvedValue(policy());
    mocks.getWalletDailySpend.mockResolvedValue(BigInt(0));
    mocks.settle.mockResolvedValue({ network: "casper:casper-test", payer: payerAddress, success: true, transaction: "deploy-1" });
    mocks.resolveCasperProof.mockResolvedValue({ deploy: { deploy_hash: "deploy-1", status: "processed" } });
    mocks.callMcpTool.mockResolvedValue({ isError: false, result: { content: [{ text: "quote", type: "text" }] }, text: "quote" });
  });

  it("settles, resolves proof, calls upstream, and returns payment response on success", async () => {
    await expect(runHostedPaidToolCall(input())).resolves.toMatchObject({
      attemptId: "attempt-1",
      kind: "success",
      result: { content: [{ text: "quote", type: "text" }] },
    });

    expect(mocks.verify).toHaveBeenCalledWith({ paymentPayload: paymentPayload(), paymentRequirements: requirements });
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
      "attempt-1",
      true,
      "policy allowed before settlement",
      expect.objectContaining({ policyLoaded: true }),
    );
    expect(mocks.settle).toHaveBeenCalledWith({ paymentPayload: paymentPayload(), paymentRequirements: requirements });
    expect(mocks.resolveCasperProof).toHaveBeenCalledWith(expect.any(Object), { asset: "asset", deployHash: "deploy-1" });
    expect(mocks.callMcpTool).toHaveBeenCalledWith("https://mcp.cspr.trade/mcp", "get_quote", { amount: "1" });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "settled", undefined, { text: "quote" });
  });

  it("rejects resource mismatch before facilitator verify or settlement", async () => {
    const output = await runHostedPaidToolCall(input({ requestUrl: "https://gw.test/api/mcp/other-source" }));

    expect(output).toMatchObject({ code: -32013, kind: "error", status: 402 });
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.persistAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "verify_failed" }));
    expect(mocks.persistX402Record).toHaveBeenCalledWith(
      expect.objectContaining({ verifyResponse: expect.objectContaining({ invalidReason: "resource_mismatch" }) }),
    );
  });

  it("persists verify failure and does not evaluate policy or settle", async () => {
    mocks.verify.mockResolvedValue({ invalidReason: "invalid_signature", isValid: false, payer: payerAddress });

    const output = await runHostedPaidToolCall(input());

    expect(output).toMatchObject({ code: -32013, kind: "error", status: 402 });
    expect(mocks.persistAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "verify_failed" }));
    expect(mocks.getAccount).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it("blocks before settlement when wallet policy is missing", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(null);

    const output = await runHostedPaidToolCall(input());

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

    const output = await runHostedPaidToolCall(input());

    expect(output).toMatchObject({ code: -32015, kind: "error", status: 402 });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "settle_failed", "insufficient_funds");
    expect(mocks.resolveCasperProof).not.toHaveBeenCalled();
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });

  it("records settle request failures without proof lookup or upstream execution", async () => {
    mocks.settle.mockRejectedValue(new Error("facilitator timeout"));

    const output = await runHostedPaidToolCall(input());

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

  it("withholds upstream execution when Casper proof is pending after settlement", async () => {
    mocks.resolveCasperProof.mockResolvedValue({ error: "not indexed" });

    const output = await runHostedPaidToolCall(input());

    expect(output).toMatchObject({ code: -32016, kind: "error", status: 202 });
    expect(output.paymentResponseHeader).toBeTruthy();
    expect(mocks.persistCasperProof).toHaveBeenCalledWith(expect.objectContaining({ proofStatus: "pending_indexing" }));
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "raw_proof_unavailable", "Casper proof pending CSPR.cloud indexing");
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });

  it("returns payment response and records upstream failure when MCP call throws after proof", async () => {
    mocks.callMcpTool.mockRejectedValue(new Error("upstream timeout"));

    const output = await runHostedPaidToolCall(input());

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

function input(overrides: Partial<Parameters<typeof runHostedPaidToolCall>[0]> = {}) {
  return {
    args: { amount: "1" },
    endpoint: hostedEndpoint(),
    paymentHeader: encodePaymentSignatureHeader(paymentPayload()),
    requestUrl,
    tool: hostedEndpoint().tools[0],
    ...overrides,
  };
}

function paymentPayload(): PaymentPayload {
  return {
    accepted: requirements,
    payload: {
      authorization: { from: payerAddress, nonce: "nonce", to: "payee", validAfter: "1", validBefore: "2", value: "5" },
      publicKey: "public-key",
      signature: "signature",
    },
    resource: { mimeType: "application/json", url: `${requestUrl}#get_quote` },
    x402Version: 2,
  };
}

function policy() {
  return {
    allowedAsset: "asset",
    allowedNetwork: "casper:casper-test",
    allowedTools: ["get_quote"],
    disabled: false,
    maxPerCall: BigInt(5),
  };
}

function hostedEndpoint() {
  return {
    source: {
      authMode: "bearer",
      credentialConfigured: true,
      endpointUrl: "https://mcp.cspr.trade/mcp",
      id: "source-1",
      name: "CSPR Trade",
      sourceType: "mcp",
    },
    tools: [
      {
        description: "Quote",
        id: "tool-1",
        inputSchema: {},
        name: "get_quote",
        paymentRequirements: requirements,
        status: "published",
        upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
      },
    ],
  };
}
