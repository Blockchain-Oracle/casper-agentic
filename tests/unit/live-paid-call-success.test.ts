import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  livePaidCallEndpointUrl,
  livePaidCallInput,
  livePaidCallPayerHash,
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

describe("live paid-call success and proof handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    setLivePaidCallDefaults(mocks);
  });

  it("uses selected endpoint, wallet, tool, and args for an allowed paid call", async () => {
    await expect(runLivePaidToolCall(livePaidCallInput())).resolves.toMatchObject({ attemptId: "attempt-1", status: "settled" });

    expect(mocks.getAgentWalletRecord).toHaveBeenCalledWith("wallet-1");
    expect(mocks.discoverMcpTools).toHaveBeenCalledWith(livePaidCallEndpointUrl);
    expect(mocks.getSpendPolicyForWallet).toHaveBeenCalledWith(livePaidCallPayerHash);
    expect(mocks.getWalletDailySpend).not.toHaveBeenCalled();
    expect(mocks.createCasperPaymentPayload).toHaveBeenCalledWith(expect.any(Object), `${livePaidCallEndpointUrl}#get_quote`);
    expect(mocks.callMcpTool).toHaveBeenCalledWith(livePaidCallEndpointUrl, "get_quote", {
      amount: "10",
      token_in: "CSPR",
      token_out: "WCSPR",
      type: "exact_in",
    });
  });

  it("records proof-pending when CSPR.cloud deploy indexing lags after settlement", async () => {
    vi.stubEnv("CASPER_PROOF_LOOKUP_ATTEMPTS", "1");
    mocks.getDeploy.mockRejectedValue(new Error("CSPR.cloud /deploys/deploy-1 failed with 404"));

    await expect(runLivePaidToolCall(livePaidCallInput())).resolves.toMatchObject({ attemptId: "attempt-1", status: "raw_proof_unavailable" });

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
    expect(mocks.persistAudit).toHaveBeenCalledWith("attempt-1", "warn", "Casper proof pending after settlement", {
      deployHash: "deploy-1",
      reason: expect.stringContaining("/deploys/deploy-1"),
    });
    expect(mocks.callMcpTool).not.toHaveBeenCalled();
  });
});
