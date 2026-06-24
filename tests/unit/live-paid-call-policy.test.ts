import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  expectNoLivePayment,
  livePaidCallInput,
  livePaidCallPayerHash,
  livePaidCallStoredPolicy,
  setLivePaidCallDefaults,
} from "./live-paid-call-fixtures";

const mocks = vi.hoisted(() => ({
  buildPaymentRequirements: vi.fn(),
  callMcpTool: vi.fn(),
  createCasperPaymentPayload: vi.fn(),
  discoverMcpTools: vi.fn(),
  getAccount: vi.fn(),
  getContractPackageTokenActions: vi.fn(),
  getDeploy: vi.fn(),
  getConfiguredSignerAddress: vi.fn(),
  getFTOwnerships: vi.fn(),
  getAgentWalletRecord: vi.fn(),
  getSpendPolicyForWallet: vi.fn(),
  getWalletDailySpend: vi.fn(),
  persistAttempt: vi.fn(),
  persistAudit: vi.fn(),
  persistCasperProof: vi.fn(),
  persistPolicyDecision: vi.fn(),
  persistX402Record: vi.fn(),
  settle: vi.fn(),
  supported: vi.fn(),
  updateAttemptStatus: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/server/env", () => ({
  requireIntegrationConfig: () => ({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "token",
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
    signerKeyAlgo: "secp256k1",
    signerPrivateKeyPem: "pem",
  }),
}));

vi.mock("@/server/x402-facilitator", () => ({
  X402FacilitatorClient: vi.fn().mockImplementation(function X402FacilitatorClient() {
    return { settle: mocks.settle, supported: mocks.supported, verify: mocks.verify };
  }),
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: vi.fn().mockImplementation(function CsprCloudClient() {
    return {
      getAccount: mocks.getAccount,
      getContractPackageTokenActions: mocks.getContractPackageTokenActions,
      getDeploy: mocks.getDeploy,
      getFTOwnerships: mocks.getFTOwnerships,
    };
  }),
}));

vi.mock("@/server/mcp-client", () => ({
  callMcpTool: mocks.callMcpTool,
  discoverMcpTools: mocks.discoverMcpTools,
}));

vi.mock("@/server/wallet-store", () => ({
  getAgentWalletRecord: mocks.getAgentWalletRecord,
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

vi.mock("@/server/x402-payment", () => ({
  buildPaymentRequirements: mocks.buildPaymentRequirements,
  createCasperPaymentPayload: mocks.createCasperPaymentPayload,
  getConfiguredSignerAddress: mocks.getConfiguredSignerAddress,
}));

import { runLivePaidToolCall } from "@/server/live-paid-call";

describe("live paid-call policy guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    setLivePaidCallDefaults(mocks);
  });

  it("requires a selected wallet and args before payment", async () => {
    await expect(runLivePaidToolCall(livePaidCallInput({ walletId: "" }))).rejects.toThrow("walletId is required");
    await expect(
      runLivePaidToolCall(livePaidCallInput({ args: undefined as unknown as Record<string, unknown> })),
    ).rejects.toThrow("args object is required");

    expect(mocks.persistAttempt).not.toHaveBeenCalled();
    expectNoLivePayment(mocks);
  });

  it("rejects custom paid endpoints before payment requirements are built", async () => {
    await expect(runLivePaidToolCall(livePaidCallInput({ endpointUrl: "https://example.com/mcp" }))).rejects.toThrow(
      "Phase 3 paid execution is limited to the configured MCP endpoint",
    );

    expect(mocks.discoverMcpTools).not.toHaveBeenCalled();
    expect(mocks.persistAttempt).not.toHaveBeenCalled();
    expectNoLivePayment(mocks);
  });

  it("blocks before payment when persisted max-per-call is exceeded", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(livePaidCallStoredPolicy({ maxPerCall: BigInt(4) }));

    await expect(runLivePaidToolCall(livePaidCallInput())).resolves.toMatchObject({ status: "blocked" });

    expectNoLivePayment(mocks);
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "blocked", "payment amount exceeds max per call");
  });

  it("blocks before payment when daily policy headroom is exceeded", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(livePaidCallStoredPolicy({ dailyLimit: BigInt(5) }));
    mocks.getWalletDailySpend.mockResolvedValue(BigInt(1));

    await expect(runLivePaidToolCall(livePaidCallInput())).resolves.toMatchObject({ status: "blocked" });

    expect(mocks.getWalletDailySpend).toHaveBeenCalledWith(livePaidCallPayerHash, "asset", "casper:casper-test");
    expectNoLivePayment(mocks);
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "blocked", "daily limit exceeded");
  });

  it("does not create a proof-pending receipt if policy evaluation fails after attempt insert", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(livePaidCallStoredPolicy({ dailyLimit: BigInt(5) }));
    mocks.getWalletDailySpend.mockRejectedValue(new Error("daily spend unavailable"));

    await expect(runLivePaidToolCall(livePaidCallInput())).rejects.toThrow("daily spend unavailable");

    expect(mocks.persistAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "policy_pending" }));
    expect(mocks.persistAttempt).not.toHaveBeenCalledWith(expect.objectContaining({ status: "raw_proof_unavailable" }));
    expect(mocks.persistPolicyDecision).not.toHaveBeenCalled();
    expect(mocks.updateAttemptStatus).not.toHaveBeenCalled();
    expectNoLivePayment(mocks);
  });
});
