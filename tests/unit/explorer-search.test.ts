import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReceiptDetail } from "@/lib/types";

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

const deployHash = "8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810";
const accountHash = "2d9026c08b7be0d9e48e1f58a852c9a8ad6eb70f81580e59bbf5f6fe078c0b11";

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
    const detail = receiptDetail("receipt-1");
    mocks.getReceiptDetail.mockResolvedValue(detail);

    const result = await searchExplorer("receipt-1");

    expect(result.source).toBe("casper_gw_receipt");
    expect(result.detail).toBe(detail);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
  });

  it("returns a Casper GW deploy-hash match before external lookup", async () => {
    const detail = receiptDetail(deployHash);
    mocks.getReceiptDetailByDeployHash.mockResolvedValue(detail);

    const result = await searchExplorer(deployHash);

    expect(result.source).toBe("casper_gw_receipt");
    expect(result.detail).toBe(detail);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
  });

  it("normalizes uppercase deploy hashes before Casper GW deploy lookup", async () => {
    const detail = receiptDetail(deployHash);
    mocks.getReceiptDetailByDeployHash.mockResolvedValue(detail);

    const result = await searchExplorer(deployHash.toUpperCase());

    expect(result.source).toBe("casper_gw_receipt");
    expect(mocks.getReceiptDetailByDeployHash).toHaveBeenCalledWith(deployHash);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
  });

  it("returns Casper GW account receipts and attaches external account history", async () => {
    const details = [receiptDetail("receipt-1"), receiptDetail("receipt-2")];
    mocks.listReceiptDetailsByWallet.mockResolvedValue(details);
    mocks.getTokenActionsPage.mockResolvedValue({ data: [], itemCount: 2, page: 1, pageCount: 1, pageSize: 4 });

    const result = await searchExplorer(`account:${accountHash.toUpperCase()}`);

    expect(result.source).toBe("casper_gw_account");
    expect(result.detail).toBe(details[0]);
    expect(result.matches).toEqual(details);
    expect(result.externalAccount?.pagination.totalCount).toBe(2);
    expect(mocks.listReceiptDetailsByWallet).toHaveBeenCalledWith(accountHash);
    expect(mocks.getDeploy).not.toHaveBeenCalled();
    expect(mocks.getTokenActionsPage).toHaveBeenCalledWith({
      accountHash,
      contractPackageHash: "wcspr-package",
      page: 1,
      pageSize: 4,
    });
  });

  it("accepts account-hash-prefixed account searches", async () => {
    const details = [receiptDetail("receipt-1")];
    mocks.listReceiptDetailsByWallet.mockResolvedValue(details);

    const result = await searchExplorer(`account-hash-${accountHash.toUpperCase()}`);

    expect(result.source).toBe("casper_gw_account");
    expect(mocks.listReceiptDetailsByWallet).toHaveBeenCalledWith(accountHash);
  });

  it("builds limited external proof context for unknown deploy hashes", async () => {
    mocks.getDeploy.mockResolvedValue({ deploy_hash: deployHash, status: "processed", timestamp: "2026-06-23T12:00:00Z" });
    mocks.getContractPackageTokenActions.mockResolvedValue([
      {
        amount: "7500000000",
        contract_package_hash: "wcspr-package",
        deploy_hash: deployHash,
        from_hash: "account-hash-payer",
        ft_action_type_id: 0,
        timestamp: "2026-06-23T12:00:01Z",
        to_hash: "account-hash-payee",
      },
    ]);

    const result = await searchExplorer(deployHash);

    expect(result.source).toBe("external_casper_proof");
    expect(result.detail?.gateway.find((row) => row.key === "result source")?.value).toBe("External Casper proof");
    expect(result.detail?.policy.find((row) => row.key === "status")?.value).toBe("unavailable");
    expect(result.detail?.x402.find((row) => row.key === "status")?.value).toBe("unavailable");
    expect(result.detail?.casper.find((row) => row.key === "payer")?.value).toBe("account-hash-payer");
  });

  it("does not render token action data unless deploy hash and package match", async () => {
    mocks.getDeploy.mockResolvedValue({ deploy_hash: deployHash, status: "processed" });
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
        deploy_hash: deployHash,
        from_hash: "account-hash-wrong-package",
        ft_action_type_id: 0,
        timestamp: "2026-06-23T12:00:01Z",
        to_hash: "account-hash-wrong-package-payee",
      },
    ]);

    const result = await searchExplorer(deployHash);

    expect(result.source).toBe("external_casper_proof");
    expect(result.detail?.casper.find((row) => row.key === "payment token action")?.value).toBe(
      "not found for configured asset",
    );
    expect(JSON.stringify(result.detail)).not.toContain("account-hash-wrong-payer");
    expect(JSON.stringify(result.detail)).not.toContain("account-hash-wrong-package");
  });

  it("builds limited external account proof context when no local account receipts exist", async () => {
    mocks.getAccount.mockResolvedValue({ account_hash: accountHash, balance: "100000000000", public_key: "01abc" });
    mocks.getFTOwnerships.mockResolvedValue([{ balance: "15000000000", contract_package_hash: "wcspr-package" }]);
    mocks.getTokenActionsPage.mockResolvedValue({
      data: [
      {
        amount: "7500000000",
        contract_package_hash: "wcspr-package",
        deploy_hash: deployHash,
        from_hash: accountHash,
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

    const result = await searchExplorer(`wallet:${accountHash}`);

    expect(result.source).toBe("external_account_proof");
    expect(result.detail?.gateway.find((row) => row.key === "result source")?.value).toBe(
      "External Casper account proof",
    );
    expect(result.detail?.x402.find((row) => row.key === "status")?.value).toBe("unavailable");
    expect(result.detail?.casper.find((row) => row.key === "account hash")?.value).toBe(accountHash);
    expect(result.detail?.casper.find((row) => row.key === "recent payment actions")?.value).toBe("1");
  });

  it("does not claim account lookup when CSPR.cloud is not configured", async () => {
    mocks.getRuntimeConfig.mockReturnValue({ paymentAsset: "wcspr-package", paymentAssetSymbol: "WCSPR" });

    const result = await searchExplorer(`account:${accountHash}`);

    expect(result.source).toBe("unconfigured");
    expect(result.detail).toBeUndefined();
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
  });

  it("does not claim external lookup when CSPR.cloud is not configured", async () => {
    mocks.getRuntimeConfig.mockReturnValue({ paymentAsset: "wcspr-package", paymentAssetSymbol: "WCSPR" });

    const result = await searchExplorer(deployHash);

    expect(result.source).toBe("unconfigured");
    expect(result.detail).toBeUndefined();
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
  });

  it("returns upstream_error when external account history is unavailable", async () => {
    mocks.getTokenActionsPage.mockRejectedValue(new Error("upstream down"));

    const result = await searchExplorer(`account:${accountHash}`);

    expect(result.source).toBe("upstream_error");
    expect(result.detail).toBeUndefined();
    expect(result.externalAccount?.source).toBe("upstream_error");
  });
});

function receiptDetail(id: string): ReceiptDetail {
  return {
    casper: [],
    gateway: [],
    policy: [],
    receipt: {
      amount: "7500000000",
      asset: "WCSPR",
      client: "phase-3-console",
      hash: id === deployHash ? deployHash : null,
      id,
      provider: "CSPR.trade MCP",
      status: "settled",
      time: "2026-06-23T12:00:00Z",
      tool: "get_quote",
      wallet: "account-hash-payer",
    },
    x402: [],
  };
}
