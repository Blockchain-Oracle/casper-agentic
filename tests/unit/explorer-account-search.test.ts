import { beforeEach, describe, expect, it, vi } from "vitest";

import { explorerAccountHash, explorerDeployHash, explorerReceiptDetail } from "./explorer-search-fixtures";

const mocks = vi.hoisted(() => ({
  getAccount: vi.fn(),
  getContractPackageTokenActions: vi.fn(),
  getDeploy: vi.fn(),
  getFTOwnerships: vi.fn(),
  getReceiptDetail: vi.fn(),
  getReceiptDetailByDeployHash: vi.fn(),
  getTokenActions: vi.fn(),
  getTokenActionsPage: vi.fn(),
  getRuntimeConfig: vi.fn(),
  listReceiptDetailsByWallet: vi.fn(),
}));

vi.mock("@/server/receipt-store", () => ({
  getReceiptDetail: mocks.getReceiptDetail,
  getReceiptDetailByDeployHash: mocks.getReceiptDetailByDeployHash,
  listReceiptDetailsByWallet: mocks.listReceiptDetailsByWallet,
}));

vi.mock("@/server/env", () => ({
  getRuntimeConfig: mocks.getRuntimeConfig,
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudRequestError: class CsprCloudRequestError extends Error {
    constructor(readonly path: string, readonly status: number) {
      super(`CSPR.cloud ${path} failed with ${status}`);
    }
  },
  CsprCloudClient: vi.fn(function CsprCloudClient() {
    return {
      getAccount: mocks.getAccount,
      getContractPackageTokenActions: mocks.getContractPackageTokenActions,
      getDeploy: mocks.getDeploy,
      getFTOwnerships: mocks.getFTOwnerships,
      getTokenActions: mocks.getTokenActions,
      getTokenActionsPage: mocks.getTokenActionsPage,
    };
  }),
}));

import { searchExplorer } from "@/server/explorer-search";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAccount.mockRejectedValue(new Error("not found"));
  mocks.getReceiptDetail.mockResolvedValue(undefined);
  mocks.getReceiptDetailByDeployHash.mockResolvedValue(undefined);
  mocks.getFTOwnerships.mockResolvedValue([]);
  mocks.getTokenActions.mockResolvedValue([]);
  mocks.getTokenActionsPage.mockResolvedValue({ data: [], itemCount: 0, page: 1, pageCount: 0, pageSize: 4 });
  mocks.listReceiptDetailsByWallet.mockResolvedValue([]);
  mocks.getRuntimeConfig.mockReturnValue({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "test-key",
    csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    paymentAsset: "wcspr-package",
    paymentAssetSymbol: "WCSPR",
  });
});

describe("explorer account search", () => {
  it("returns Casper GW account receipts and attaches external account history", async () => {
    const details = [explorerReceiptDetail("receipt-1"), explorerReceiptDetail("receipt-2")];
    mocks.listReceiptDetailsByWallet.mockResolvedValue(details);
    mocks.getTokenActionsPage.mockResolvedValue({ data: [], itemCount: 2, page: 1, pageCount: 1, pageSize: 4 });

    const result = await searchExplorer(`account:${explorerAccountHash.toUpperCase()}`);

    expect(result.source).toBe("casper_gw_account");
    expect(result.detail).toBe(details[0]);
    expect(result.matches).toEqual(details);
    expect(result.externalAccount?.pagination.totalCount).toBe(2);
    expect(mocks.listReceiptDetailsByWallet).toHaveBeenCalledWith(explorerAccountHash);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
    expect(mocks.getTokenActionsPage).toHaveBeenCalledWith({
      accountHash: explorerAccountHash,
      contractPackageHash: "wcspr-package",
      page: 1,
      pageSize: 4,
    });
  });

  it("accepts account-hash-prefixed account searches", async () => {
    const details = [explorerReceiptDetail("receipt-1")];
    mocks.listReceiptDetailsByWallet.mockResolvedValue(details);

    const result = await searchExplorer(`account-hash-${explorerAccountHash.toUpperCase()}`);

    expect(result.source).toBe("casper_gw_account");
    expect(mocks.listReceiptDetailsByWallet).toHaveBeenCalledWith(explorerAccountHash);
  });

  it("builds limited external account proof context when no local account receipts exist", async () => {
    mocks.getAccount.mockResolvedValue({ account_hash: explorerAccountHash, balance: "100000000000", public_key: "01abc" });
    mocks.getFTOwnerships.mockResolvedValue([{ balance: "15000000000", contract_package_hash: "wcspr-package" }]);
    mocks.getTokenActionsPage.mockResolvedValue({
      data: [
        {
          amount: "7500000000",
          contract_package_hash: "wcspr-package",
          deploy_hash: explorerDeployHash,
          from_hash: explorerAccountHash,
          ft_action_type_id: 0,
          timestamp: "2026-06-23T12:00:01Z",
          to_hash: "account-hash-payee",
        },
      ],
      itemCount: 1,
      page: 1,
      pageCount: 1,
      pageSize: 4,
    });

    const result = await searchExplorer(`wallet:${explorerAccountHash}`);

    expect(result.source).toBe("external_account_proof");
    expect(result.detail?.gateway.find((row) => row.key === "result source")?.value).toBe(
      "External Casper account proof",
    );
    expect(result.detail?.x402.find((row) => row.key === "status")?.value).toBe("unavailable");
    expect(result.detail?.casper.find((row) => row.key === "account hash")?.value).toBe(explorerAccountHash);
    expect(result.detail?.casper.find((row) => row.key === "recent payment actions")?.value).toBe("1");
  });

  it("does not claim account lookup when CSPR.cloud is not configured", async () => {
    mocks.getRuntimeConfig.mockReturnValue({ paymentAsset: "wcspr-package", paymentAssetSymbol: "WCSPR" });

    const result = await searchExplorer(`account:${explorerAccountHash}`);

    expect(result.source).toBe("unconfigured");
    expect(result.detail).toBeUndefined();
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
  });

  it("returns upstream_error when external account history is unavailable", async () => {
    mocks.getTokenActionsPage.mockRejectedValue(new Error("upstream down"));

    const result = await searchExplorer(`account:${explorerAccountHash}`);

    expect(result.source).toBe("upstream_error");
    expect(result.detail).toBeUndefined();
    expect(result.externalAccount?.source).toBe("upstream_error");
  });
});
