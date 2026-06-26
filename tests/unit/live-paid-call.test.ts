import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  expectNoLivePayment,
  livePaidCallInput,
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
  buildSignerForWallet: vi.fn(),
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
}));

vi.mock("@/server/wallet-signer", () => ({
  buildSignerForWallet: mocks.buildSignerForWallet,
}));

import { runLivePaidToolCall } from "@/server/live-paid-call";

describe("live paid-call orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    setLivePaidCallDefaults(mocks);
  });

  it("blocks before payment when no persisted spend policy exists", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(null);

    await expect(runLivePaidToolCall(livePaidCallInput())).resolves.toMatchObject({ attemptId: "attempt-1", status: "blocked" });
    expectNoLivePayment(mocks);
    expect(mocks.persistAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "policy_pending" }));
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "blocked", "no active spend policy for wallet");
  });

  it("fails closed when the selected wallet is not the configured signer", async () => {
    const otherHash = "1accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
    mocks.getAgentWalletRecord.mockResolvedValue({
      accountHash: otherHash,
      id: "wallet-2",
      label: "Browser wallet",
      signingMode: "browser-wallet",
    });

    await expect(
      runLivePaidToolCall({
        ...livePaidCallInput(),
        walletId: "wallet-2",
      }),
    ).resolves.toMatchObject({
      attemptId: "attempt-1",
      status: "blocked",
    });

    expect(mocks.persistAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        redactedInput: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
        status: "policy_pending",
        walletAccountHash: otherHash,
      }),
    );
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
      "attempt-1",
      false,
      "signer key does not match the selected wallet",
      expect.objectContaining({ selectedWalletId: "wallet-2", signingMode: "browser-wallet" }),
    );
    expectNoLivePayment(mocks);
    expect(mocks.getAccount).not.toHaveBeenCalled();
  });
});
