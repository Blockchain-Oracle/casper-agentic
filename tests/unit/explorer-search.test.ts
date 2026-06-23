import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReceiptDetail } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  getContractPackageTokenActions: vi.fn(),
  getDeploy: vi.fn(),
  getReceiptDetail: vi.fn(),
  getReceiptDetailByDeployHash: vi.fn(),
  getRuntimeConfig: vi.fn(),
}));

vi.mock("@/server/receipt-store", () => ({
  getReceiptDetail: mocks.getReceiptDetail,
  getReceiptDetailByDeployHash: mocks.getReceiptDetailByDeployHash,
}));

vi.mock("@/server/env", () => ({
  getRuntimeConfig: mocks.getRuntimeConfig,
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: vi.fn(function CsprCloudClient() {
    return {
    getContractPackageTokenActions: mocks.getContractPackageTokenActions,
    getDeploy: mocks.getDeploy,
    };
  }),
}));

import { searchExplorer } from "@/server/explorer-search";

const deployHash = "8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getReceiptDetail.mockResolvedValue(undefined);
  mocks.getReceiptDetailByDeployHash.mockResolvedValue(undefined);
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

  it("does not claim external lookup when CSPR.cloud is not configured", async () => {
    mocks.getRuntimeConfig.mockReturnValue({ paymentAsset: "wcspr-package", paymentAssetSymbol: "WCSPR" });

    const result = await searchExplorer(deployHash);

    expect(result.source).toBe("unconfigured");
    expect(result.detail).toBeUndefined();
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
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
