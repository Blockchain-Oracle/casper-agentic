import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccount: vi.fn(),
  getCsprNameResolution: vi.fn(),
  getFTOwnerships: vi.fn(),
  getReceiptDetail: vi.fn(),
  getReceiptDetailByDeployHash: vi.fn(),
  getRuntimeConfig: vi.fn(),
  getTokenActionsPage: vi.fn(),
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
  CsprCloudRequestError: class MockCsprCloudRequestError extends Error {
    constructor(readonly path: string, readonly status: number) {
      super(`CSPR.cloud ${path} failed with ${status}`);
    }
  },
  CsprCloudClient: vi.fn(function CsprCloudClient() {
    return {
      getAccount: mocks.getAccount,
      getCsprNameResolution: mocks.getCsprNameResolution,
      getFTOwnerships: mocks.getFTOwnerships,
      getTokenActionsPage: mocks.getTokenActionsPage,
    };
  }),
}));

import { searchExplorer } from "@/server/explorer-search";
import { CsprCloudRequestError } from "@/server/cspr-cloud";

const accountHash = "2d9026c08b7be0d9e48e1f58a852c9a8ad6eb70f81580e59bbf5f6fe078c0b11";
const publicKey = "0202e3310fd675078cb7fc16f327fe67773bf46e2bbe75745abd0a25f8b169c7d92e";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getReceiptDetail.mockResolvedValue(undefined);
  mocks.getReceiptDetailByDeployHash.mockResolvedValue(undefined);
  mocks.listReceiptDetailsByWallet.mockResolvedValue([]);
  mocks.getFTOwnerships.mockResolvedValue([{ balance: "15000000000", contract_package_hash: "wcspr-package" }]);
  mocks.getTokenActionsPage.mockResolvedValue({ data: [], itemCount: 0, page: 1, pageCount: 1, pageSize: 4 });
  mocks.getRuntimeConfig.mockReturnValue({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "test-key",
    csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    paymentAsset: "wcspr-package",
    paymentAssetSymbol: "WCSPR",
  });
});

describe("explorer identifier search", () => {
  it("resolves public-key search through CSPR.cloud account lookup", async () => {
    mocks.getAccount.mockResolvedValue({ account_hash: accountHash, balance: "100000000000", public_key: publicKey });

    const result = await searchExplorer(`public-key:${publicKey.toUpperCase()}`);

    expect(mocks.getAccount).toHaveBeenCalledWith(publicKey);
    expect(mocks.listReceiptDetailsByWallet).toHaveBeenCalledWith(accountHash);
    expect(result.source).toBe("external_account_proof");
    expect(result.query).toBe(accountHash);
    expect(result.message).toContain("Resolved public key to a Casper account.");
    expect(result.detail?.casper.find((row) => row.key === "public key")?.value).toBe(publicKey);
  });

  it("resolves CSPR.name search before account proof lookup", async () => {
    mocks.getCsprNameResolution.mockResolvedValue({ is_primary: true, name: "faucet.cspr", resolved_hash: accountHash });
    mocks.getAccount.mockResolvedValue({ account_hash: accountHash, balance: "100000000000", public_key: publicKey });

    const result = await searchExplorer("faucet.cspr");

    expect(mocks.getCsprNameResolution).toHaveBeenCalledWith("faucet.cspr");
    expect(mocks.getAccount).toHaveBeenCalledWith(accountHash);
    expect(result.source).toBe("external_account_proof");
    expect(result.query).toBe(accountHash);
    expect(result.message).toContain("Resolved faucet.cspr to a Casper account.");
  });

  it("does not claim public-key lookup when CSPR.cloud is not configured", async () => {
    mocks.getRuntimeConfig.mockReturnValue({ paymentAsset: "wcspr-package", paymentAssetSymbol: "WCSPR" });

    const result = await searchExplorer(publicKey);

    expect(result.source).toBe("unconfigured");
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
    expect(mocks.listReceiptDetailsByWallet).not.toHaveBeenCalled();
  });

  it("maps public-key 404 to not_found without account proof lookup", async () => {
    mocks.getAccount.mockRejectedValue(new CsprCloudRequestError("/accounts/public-key", 404));

    const result = await searchExplorer(publicKey);

    expect(result.source).toBe("not_found");
    expect(result.message).toContain("No Casper account matched that public key.");
    expect(mocks.listReceiptDetailsByWallet).not.toHaveBeenCalled();
  });

  it("maps public-key upstream failure to upstream_error", async () => {
    mocks.getAccount.mockRejectedValue(new Error("network down"));

    const result = await searchExplorer(publicKey);

    expect(result.source).toBe("upstream_error");
    expect(result.message).toContain("unavailable");
    expect(mocks.listReceiptDetailsByWallet).not.toHaveBeenCalled();
  });

  it("rejects overlong CSPR.name input before calling CSPR.cloud", async () => {
    const overlong = `${"a.".repeat(126)}cspr`;

    const result = await searchExplorer(`name:${overlong}`);

    expect(result.source).toBe("not_found");
    expect(result.message).toContain("valid .cspr name");
    expect(mocks.getCsprNameResolution).not.toHaveBeenCalled();
  });

  it("maps CSPR.name 404 to not_found without account proof lookup", async () => {
    mocks.getCsprNameResolution.mockRejectedValue(new CsprCloudRequestError("/cspr-name-resolutions/missing.cspr", 404));

    const result = await searchExplorer("missing.cspr");

    expect(result.source).toBe("not_found");
    expect(result.message).toContain("No Casper account matched that CSPR.name.");
    expect(mocks.getAccount).not.toHaveBeenCalled();
    expect(mocks.listReceiptDetailsByWallet).not.toHaveBeenCalled();
  });

  it("maps CSPR.name upstream failure to upstream_error", async () => {
    mocks.getCsprNameResolution.mockRejectedValue(new Error("network down"));

    const result = await searchExplorer("faucet.cspr");

    expect(result.source).toBe("upstream_error");
    expect(result.message).toContain("unavailable");
    expect(mocks.getAccount).not.toHaveBeenCalled();
    expect(mocks.listReceiptDetailsByWallet).not.toHaveBeenCalled();
  });
});
