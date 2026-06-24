import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccount: vi.fn(),
  getFTOwnerships: vi.fn(),
  getRuntimeConfig: vi.fn(),
  getTokenActionsPage: vi.fn(),
}));

vi.mock("@/server/env", () => ({
  getRuntimeConfig: mocks.getRuntimeConfig,
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: vi.fn(function CsprCloudClient() {
    return {
      getAccount: mocks.getAccount,
      getFTOwnerships: mocks.getFTOwnerships,
      getTokenActionsPage: mocks.getTokenActionsPage,
    };
  }),
}));

import { getExternalAccountHistory, normalizeExternalAccountHistoryInput } from "@/server/external-account-history";

const accountHash = "bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12";
const deployHash = "a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRuntimeConfig.mockReturnValue({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "test-key",
    csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    paymentAsset: "wcspr-package",
    paymentAssetSymbol: "WCSPR",
  });
  mocks.getAccount.mockResolvedValue({ account_hash: accountHash, balance: "100000000000", public_key: "01abc" });
  mocks.getFTOwnerships.mockResolvedValue([{ balance: "15000000000", contract_package_hash: "wcspr-package" }]);
  mocks.getTokenActionsPage.mockResolvedValue({
    data: [tokenAction(deployHash, accountHash)],
    itemCount: 6,
    page: 2,
    pageCount: 3,
    pageSize: 2,
  });
});

describe("external account history", () => {
  it("normalizes public pagination input", () => {
    expect(normalizeExternalAccountHistoryInput({ accountHash: `account-hash-${accountHash}`, page: "0", pageSize: "999" })).toEqual({
      accountHash,
      page: 1,
      pageSize: 25,
    });
  });

  it("builds paginated external account proof from CSPR.cloud actions", async () => {
    const result = await getExternalAccountHistory({ accountHash, page: 2, pageSize: 2 });

    expect(mocks.getTokenActionsPage).toHaveBeenCalledWith({
      accountHash,
      contractPackageHash: "wcspr-package",
      page: 2,
      pageSize: 2,
    });
    expect(result.source).toBe("cspr_cloud");
    expect(result.pagination).toMatchObject({ page: 2, pageSize: 2, totalCount: 6, totalPages: 3 });
    expect(result.matches[0]?.receipt.id).toBe(`external-account:${accountHash}:${deployHash}:4`);
    expect(result.matches[0]?.policy.find((row) => row.key === "status")?.value).toBe("unavailable");
    expect(result.matches[0]?.casper.find((row) => row.key === "action page")?.value).toBe("2 of 3");
  });

  it("does not treat action-page rejection as empty proof", async () => {
    mocks.getTokenActionsPage.mockRejectedValue(new Error("upstream down"));

    const result = await getExternalAccountHistory({ accountHash, page: 1, pageSize: 2 });

    expect(result.source).toBe("upstream_error");
    expect(result.matches).toEqual([]);
    expect(result.message).toContain("unavailable");
  });

  it("clamps and refetches pages beyond the CSPR.cloud page count", async () => {
    mocks.getTokenActionsPage
      .mockResolvedValueOnce({ data: [], itemCount: 6, page: 1000, pageCount: 3, pageSize: 2 })
      .mockResolvedValueOnce({
        data: [tokenAction(deployHash, accountHash)],
        itemCount: 6,
        page: 3,
        pageCount: 3,
        pageSize: 2,
      });

    const result = await getExternalAccountHistory({ accountHash, page: 1000, pageSize: 2 });

    expect(mocks.getTokenActionsPage).toHaveBeenNthCalledWith(2, {
      accountHash,
      contractPackageHash: "wcspr-package",
      page: 3,
      pageSize: 2,
    });
    expect(result.pagination).toMatchObject({ hasNextPage: false, page: 3, totalPages: 3 });
    expect(result.matches[0]?.casper.find((row) => row.key === "action page")?.value).toBe("3 of 3");
  });

  it("returns an unconfigured state without calling CSPR.cloud", async () => {
    mocks.getRuntimeConfig.mockReturnValue({
      casperNetwork: "casper:casper-test",
      paymentAsset: "wcspr-package",
      paymentAssetSymbol: "WCSPR",
    });

    const result = await getExternalAccountHistory({ accountHash });

    expect(result.source).toBe("unconfigured");
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
    expect(mocks.getAccount).not.toHaveBeenCalled();
  });
});

function tokenAction(deploy: string, account: string) {
  return {
    amount: "7500000000",
    block_height: 123,
    contract_package_hash: "wcspr-package",
    deploy_hash: deploy,
    from_hash: account,
    from_type: 0,
    ft_action_type_id: 0,
    timestamp: "2026-06-23T21:34:47Z",
    to_hash: "account-hash-payee",
    to_type: 0,
    transform_idx: 4,
  };
}
