import { expect } from "vitest";

import type { runLivePaidToolCall } from "@/server/live-paid-call";

type ConfigurableMock = {
  mock: { calls: unknown[] };
  mockResolvedValue(value: unknown): unknown;
  mockReturnValue(value: unknown): unknown;
};

export const livePaidCallPayerHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
export const livePaidCallPayerAddress = `00${livePaidCallPayerHash}`;
export const livePaidCallEndpointUrl = "https://mcp.cspr.trade/mcp";

export function livePaidCallStoredPolicy(overrides: Record<string, unknown> = {}) {
  return {
    allowedAsset: "asset",
    allowedNetwork: "casper:casper-test",
    allowedTools: ["get_quote"],
    disabled: false,
    maxPerCall: BigInt(5),
    ...overrides,
  };
}

export function livePaidCallInput(overrides: Partial<Parameters<typeof runLivePaidToolCall>[0]> = {}) {
  return {
    args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
    endpointUrl: livePaidCallEndpointUrl,
    toolName: "get_quote",
    walletId: "wallet-1",
    ...overrides,
  };
}

export function setLivePaidCallDefaults(mocks: Record<string, ConfigurableMock>) {
  mocks.supported.mockResolvedValue({ kinds: [{ network: "casper:casper-test", scheme: "exact" }] });
  mocks.discoverMcpTools.mockResolvedValue([{ name: "get_quote" }]);
  mocks.buildSignerForWallet.mockResolvedValue({
    accountAddress: () => livePaidCallPayerAddress,
    publicKey: () => "01casperpublickey",
    signEIP712: async () => new Uint8Array(65),
  });
  mocks.getAgentWalletRecord.mockResolvedValue({
    accountHash: livePaidCallPayerHash,
    id: "wallet-1",
    label: "Phase 3 signer wallet",
    signingMode: "test-signer",
  });
  mocks.getAccount.mockResolvedValue({ account_hash: livePaidCallPayerHash, balance: "10" });
  mocks.getFTOwnerships.mockResolvedValue([{ balance: "10" }]);
  mocks.getWalletDailySpend.mockResolvedValue(BigInt(0));
  mocks.buildPaymentRequirements.mockReturnValue({ amount: "5", asset: "asset", network: "casper:casper-test" });
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
  mocks.getSpendPolicyForWallet.mockResolvedValue(livePaidCallStoredPolicy());
}

export function expectNoLivePayment(mocks: Record<string, ConfigurableMock>) {
  expect(mocks.createCasperPaymentPayload).not.toHaveBeenCalled();
  expect(mocks.verify).not.toHaveBeenCalled();
  expect(mocks.settle).not.toHaveBeenCalled();
}
