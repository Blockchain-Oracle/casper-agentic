import { beforeEach, describe, expect, it, vi } from "vitest";

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
  getSpendPolicyForWallet: vi.fn(),
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
    return {
      settle: mocks.settle,
      supported: mocks.supported,
      verify: mocks.verify,
    };
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
}));

vi.mock("@/server/x402-payment", () => ({
  buildPaymentRequirements: mocks.buildPaymentRequirements,
  createCasperPaymentPayload: mocks.createCasperPaymentPayload,
  getConfiguredSignerAddress: mocks.getConfiguredSignerAddress,
}));

import { runLivePaidToolCall } from "@/server/live-paid-call";

const payerHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
const payerAddress = `00${payerHash}`;

describe("live paid-call orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mocks.supported.mockResolvedValue({ kinds: [{ network: "casper:casper-test", scheme: "exact" }] });
    mocks.discoverMcpTools.mockResolvedValue([{ name: "get_quote" }]);
    mocks.getConfiguredSignerAddress.mockReturnValue(payerAddress);
    mocks.getAccount.mockResolvedValue({ account_hash: payerHash, balance: "10" });
    mocks.getFTOwnerships.mockResolvedValue([{ balance: "10" }]);
    mocks.buildPaymentRequirements.mockReturnValue({
      amount: "5",
      asset: "asset",
      network: "casper:casper-test",
    });
    mocks.callMcpTool.mockResolvedValue({ isError: false, text: "quote" });
    mocks.createCasperPaymentPayload.mockResolvedValue({
      paymentPayload: { payload: true },
      paymentRequirements: { amount: "5", asset: "asset", network: "casper:casper-test" },
    });
    mocks.getContractPackageTokenActions.mockResolvedValue([{ action: "transfer" }]);
    mocks.getDeploy.mockResolvedValue({ deploy_hash: "deploy-1", status: "processed" });
    mocks.persistAttempt.mockResolvedValue({ id: "attempt-1" });
    mocks.settle.mockResolvedValue({ success: true, transaction: "deploy-1" });
    mocks.verify.mockResolvedValue({ isValid: true });
  });

  it("blocks before payment when no persisted spend policy exists", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(null);

    await expect(runLivePaidToolCall()).resolves.toMatchObject({
      attemptId: "attempt-1",
      status: "blocked",
    });
    expect(mocks.createCasperPaymentPayload).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith(
      "attempt-1",
      "blocked",
      "no active spend policy for wallet",
    );
  });

  it("blocks before payment when persisted max-per-call is exceeded", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue({
      allowedAsset: "asset",
      allowedNetwork: "casper:casper-test",
      allowedTools: ["get_quote"],
      disabled: false,
      maxPerCall: BigInt(4),
    });

    await expect(runLivePaidToolCall()).resolves.toMatchObject({ status: "blocked" });
    expect(mocks.createCasperPaymentPayload).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.settle).not.toHaveBeenCalled();
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith(
      "attempt-1",
      "blocked",
      "payment amount exceeds max per call",
    );
  });

  it("records proof-pending when CSPR.cloud deploy indexing lags after settlement", async () => {
    vi.stubEnv("CASPER_PROOF_LOOKUP_ATTEMPTS", "1");
    mocks.getSpendPolicyForWallet.mockResolvedValue({
      allowedAsset: "asset",
      allowedNetwork: "casper:casper-test",
      allowedTools: ["get_quote"],
      disabled: false,
      maxPerCall: BigInt(5),
    });
    mocks.getDeploy.mockRejectedValue(new Error("CSPR.cloud /deploys/deploy-1 failed with 404"));

    await expect(runLivePaidToolCall()).resolves.toMatchObject({
      attemptId: "attempt-1",
      status: "raw_proof_unavailable",
    });

    expect(mocks.persistCasperProof).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      deployHash: "deploy-1",
      explorerUrl: "https://testnet.cspr.live/deploy/deploy-1",
      proofStatus: "pending_indexing",
    });
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith(
      "attempt-1",
      "raw_proof_unavailable",
      "Casper proof pending CSPR.cloud indexing",
    );
    expect(mocks.persistAudit).toHaveBeenCalledWith(
      "attempt-1",
      "warn",
      "Casper proof pending after settlement",
      expect.objectContaining({ deployHash: "deploy-1" }),
    );
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });
});
