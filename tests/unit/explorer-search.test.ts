import { beforeEach, describe, expect, it, vi } from "vitest";

import { explorerDeployHash, explorerReceiptDetail } from "./explorer-search-fixtures";

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

describe("explorer search", () => {
  it("returns a Casper GW receipt match before external lookup", async () => {
    const detail = explorerReceiptDetail("receipt-1");
    mocks.getReceiptDetail.mockResolvedValue(detail);

    const result = await searchExplorer("receipt-1");

    expect(result.source).toBe("casper_gw_receipt");
    expect(result.detail).toBe(detail);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
  });

  it("returns a Casper GW deploy-hash match before external lookup", async () => {
    const detail = explorerReceiptDetail(explorerDeployHash);
    mocks.getReceiptDetailByDeployHash.mockResolvedValue(detail);

    const result = await searchExplorer(explorerDeployHash);

    expect(result.source).toBe("casper_gw_receipt");
    expect(result.detail).toBe(detail);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
  });

  it("normalizes uppercase deploy hashes before Casper GW deploy lookup", async () => {
    const detail = explorerReceiptDetail(explorerDeployHash);
    mocks.getReceiptDetailByDeployHash.mockResolvedValue(detail);

    const result = await searchExplorer(explorerDeployHash.toUpperCase());

    expect(result.source).toBe("casper_gw_receipt");
    expect(mocks.getReceiptDetailByDeployHash).toHaveBeenCalledWith(explorerDeployHash);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
  });

  it("builds limited external proof context for unknown deploy hashes", async () => {
    mocks.getDeploy.mockResolvedValue({
      deploy_hash: explorerDeployHash,
      status: "processed",
      timestamp: "2026-06-23T12:00:00Z",
    });
    mocks.getContractPackageTokenActions.mockResolvedValue([
      {
        amount: "7500000000",
        contract_package_hash: "wcspr-package",
        deploy_hash: explorerDeployHash,
        from_hash: "account-hash-payer",
        ft_action_type_id: 0,
        timestamp: "2026-06-23T12:00:01Z",
        to_hash: "account-hash-payee",
      },
    ]);

    const result = await searchExplorer(explorerDeployHash);

    expect(result.source).toBe("external_casper_proof");
    expect(result.detail?.gateway.find((row) => row.key === "result source")?.value).toBe("External Casper proof");
    expect(result.detail?.x402.find((row) => row.key === "status")?.value).toBe("unavailable");
    expect(result.detail?.casper.find((row) => row.key === "payer")?.value).toBe("account-hash-payer");
  });

  it("does not render token action data unless deploy hash and package match", async () => {
    mocks.getDeploy.mockResolvedValue({ deploy_hash: explorerDeployHash, status: "processed" });
    mocks.getContractPackageTokenActions.mockResolvedValue([
      {
        amount: "7500000000",
        contract_package_hash: "wcspr-package",
        deploy_hash: "0000000000000000000000000000000000000000000000000000000000000000",
        from_hash: "account-hash-wrong-payer",
        ft_action_type_id: 0,
        timestamp: "2026-06-23T12:00:01Z",
        to_hash: "account-hash-wrong-payee",
      },
      {
        amount: "7500000000",
        contract_package_hash: "different-package",
        deploy_hash: explorerDeployHash,
        from_hash: "account-hash-wrong-package",
        ft_action_type_id: 0,
        timestamp: "2026-06-23T12:00:01Z",
        to_hash: "account-hash-wrong-package-payee",
      },
    ]);

    const result = await searchExplorer(explorerDeployHash);

    expect(result.source).toBe("external_casper_proof");
    expect(result.detail?.casper.find((row) => row.key === "payment token action")?.value).toBe(
      "not found for configured asset",
    );
    expect(JSON.stringify(result.detail)).not.toContain("account-hash-wrong-payer");
    expect(JSON.stringify(result.detail)).not.toContain("account-hash-wrong-package");
  });

  it("does not claim external lookup when CSPR.cloud is not configured", async () => {
    mocks.getRuntimeConfig.mockReturnValue({ paymentAsset: "wcspr-package", paymentAssetSymbol: "WCSPR" });

    const result = await searchExplorer(explorerDeployHash);

    expect(result.source).toBe("unconfigured");
    expect(result.detail).toBeUndefined();
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
  });
});
