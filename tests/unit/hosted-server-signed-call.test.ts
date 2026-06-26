import { beforeEach, describe, expect, it, vi } from "vitest";

const WALLET_HASH = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
const WALLET_ADDRESS = `00${WALLET_HASH}`;

const mocks = vi.hoisted(() => ({
  buildSignerForWallet: vi.fn(),
  completeSettledHostedCall: vi.fn(),
  evaluateHostedPolicy: vi.fn(),
  getAgentWalletRecord: vi.fn(),
  persistAttempt: vi.fn(),
  persistAudit: vi.fn(),
  persistPolicyDecision: vi.fn(),
  persistX402Record: vi.fn(),
  settle: vi.fn(),
  signPaymentPayload: vi.fn(),
  updateAttemptStatus: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/server/env", () => ({
  requireIntegrationConfig: () => ({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "token",
    facilitatorUrl: "https://x402-facilitator.cspr.cloud",
    paymentAsset: "asset",
  }),
}));

vi.mock("@/server/x402-facilitator", () => ({
  X402FacilitatorClient: vi.fn().mockImplementation(function X402FacilitatorClient() {
    return { settle: mocks.settle, verify: mocks.verify };
  }),
}));

vi.mock("@/server/wallet-store", () => ({ getAgentWalletRecord: mocks.getAgentWalletRecord }));
vi.mock("@/server/wallet-signer", () => ({ buildSignerForWallet: mocks.buildSignerForWallet }));
vi.mock("@/server/x402-payment", () => ({ signPaymentPayload: mocks.signPaymentPayload }));
vi.mock("@/server/hosted-paid-call-policy", () => ({ evaluateHostedPolicy: mocks.evaluateHostedPolicy }));
vi.mock("@/server/hosted-paid-call-completion", () => ({ completeSettledHostedCall: mocks.completeSettledHostedCall }));
vi.mock("@/server/receipt-store", () => ({
  persistAttempt: mocks.persistAttempt,
  persistAudit: mocks.persistAudit,
  persistPolicyDecision: mocks.persistPolicyDecision,
  persistX402Record: mocks.persistX402Record,
  updateAttemptStatus: mocks.updateAttemptStatus,
}));

import { runHostedServerSignedToolCall } from "@/server/hosted-server-signed-call";

const tool = {
  name: "get_quote",
  paymentRequirements: {
    amount: "5",
    asset: "asset",
    extra: {},
    maxTimeoutSeconds: 900,
    network: "casper:casper-test",
    payTo: "payee",
    scheme: "exact",
  },
};

function serverSignedInput() {
  return {
    args: { token_in: "CSPR" },
    endpoint: { source: { endpointUrl: "https://mcp.example/mcp", name: "CSPR.trade MCP" } },
    requestUrl: "https://gw.example/api/mcp/source-1",
    tool,
  } as unknown as Parameters<typeof runHostedServerSignedToolCall>[0];
}

describe("hosted server-signed (autonomous agent + API key) call", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAgentWalletRecord.mockResolvedValue({
      accountHash: WALLET_HASH,
      id: "wallet-1",
      label: "Agent wallet",
      signingMode: "hosted",
    });
    mocks.persistAttempt.mockResolvedValue({ id: "attempt-1" });
    mocks.evaluateHostedPolicy.mockResolvedValue({ allowed: true, evidence: {}, reason: "policy allowed before settlement" });
    mocks.buildSignerForWallet.mockResolvedValue({
      accountAddress: () => WALLET_ADDRESS,
      publicKey: () => "01pub",
      signEIP712: async () => new Uint8Array(65),
    });
    mocks.signPaymentPayload.mockResolvedValue({
      paymentPayload: { payload: true },
      paymentRequired: {},
      paymentRequirements: tool.paymentRequirements,
      payer: WALLET_ADDRESS,
    });
    mocks.verify.mockResolvedValue({ isValid: true });
    mocks.settle.mockResolvedValue({ success: true, transaction: "deploy-1" });
    mocks.completeSettledHostedCall.mockResolvedValue({
      attemptId: "attempt-1",
      kind: "success",
      paymentResponseHeader: "header",
      result: { ok: true },
    });
  });

  it("server-signs with the bound wallet and settles when policy allows", async () => {
    const result = await runHostedServerSignedToolCall(serverSignedInput(), "wallet-1");

    expect(result).toMatchObject({ kind: "success", result: { ok: true } });
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith("attempt-1", true, expect.any(String), expect.any(Object));
    expect(mocks.signPaymentPayload).toHaveBeenCalledWith(tool.paymentRequirements, expect.stringContaining("#get_quote"), expect.any(Object));
    expect(mocks.verify).toHaveBeenCalledTimes(1);
    expect(mocks.settle).toHaveBeenCalledTimes(1);
    expect(mocks.completeSettledHostedCall).toHaveBeenCalledTimes(1);
  });

  it("blocks BEFORE signing — no signature, no x402 record — when policy denies", async () => {
    mocks.evaluateHostedPolicy.mockResolvedValue({ allowed: false, evidence: {}, reason: "amount exceeds max per call" });

    const result = await runHostedServerSignedToolCall(serverSignedInput(), "wallet-1");

    expect(result).toMatchObject({ kind: "error", status: 403 });
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith("attempt-1", false, "amount exceeds max per call", expect.any(Object));
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "blocked", "amount exceeds max per call");
    expect(mocks.signPaymentPayload).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.persistX402Record).not.toHaveBeenCalled();
  });

  it("fails closed when the bound wallet does not exist", async () => {
    mocks.getAgentWalletRecord.mockResolvedValue(null);

    const result = await runHostedServerSignedToolCall(serverSignedInput(), "missing");

    expect(result).toMatchObject({ kind: "error", status: 403 });
    expect(mocks.persistAttempt).not.toHaveBeenCalled();
  });
});
