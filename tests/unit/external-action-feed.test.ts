import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRuntimeConfig: vi.fn(),
  getTokenActionsPage: vi.fn(),
  checkSharedExternalActionFeedRateLimit: vi.fn(),
  readSharedExternalActionFeedCache: vi.fn(),
  writeSharedExternalActionFeedCache: vi.fn(),
}));

vi.mock("@/server/env", () => ({
  getRuntimeConfig: mocks.getRuntimeConfig,
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: vi.fn(function CsprCloudClient() {
    return { getTokenActionsPage: mocks.getTokenActionsPage };
  }),
}));

vi.mock("@/server/external-action-feed-state", async () => {
  const actual = await vi.importActual<typeof import("@/server/external-action-feed-state")>(
    "@/server/external-action-feed-state",
  );
  return {
    ...actual,
    checkSharedExternalActionFeedRateLimit: mocks.checkSharedExternalActionFeedRateLimit,
    readSharedExternalActionFeedCache: mocks.readSharedExternalActionFeedCache,
    writeSharedExternalActionFeedCache: mocks.writeSharedExternalActionFeedCache,
  };
});

import {
  buildRateLimitedFeed,
  checkExternalActionFeedRateLimit,
  getCachedExternalActionFeed,
  resetExternalActionFeedRuntimeState,
} from "@/server/external-action-feed-cache";
import { getExternalActionFeed, normalizeExternalActionFeedInput } from "@/server/external-action-feed";

const deployHash = "a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e";
const paymentAsset = "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e";

beforeEach(() => {
  vi.clearAllMocks();
  resetExternalActionFeedRuntimeState();
  mocks.getRuntimeConfig.mockReturnValue({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "test-key",
    csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    paymentAsset,
    paymentAssetSymbol: "WCSPR",
  });
  mocks.getTokenActionsPage.mockResolvedValue({
    data: [tokenAction(deployHash, paymentAsset)],
    itemCount: 4870,
    page: 1,
    pageCount: 1218,
    pageSize: 4,
  });
  mocks.checkSharedExternalActionFeedRateLimit.mockResolvedValue(null);
  mocks.readSharedExternalActionFeedCache.mockResolvedValue(null);
  mocks.writeSharedExternalActionFeedCache.mockResolvedValue(undefined);
});

describe("external action feed", () => {
  it("normalizes bounded public pagination input", () => {
    expect(normalizeExternalActionFeedInput({ page: "0", pageSize: "999" })).toEqual({ page: 1, pageSize: 25 });
  });

  it("builds proof-only rows from CSPR.cloud contract-wide actions", async () => {
    const result = await getExternalActionFeed({ page: 1, pageSize: 4 });

    expect(mocks.getTokenActionsPage).toHaveBeenCalledWith({ contractPackageHash: paymentAsset, page: 1, pageSize: 4 });
    expect(result.source).toBe("cspr_cloud");
    expect(result.pagination).toMatchObject({ page: 1, pageSize: 4, totalCount: 4870, totalPages: 1218 });
    expect(result.matches[0]?.receipt).toMatchObject({
      hash: deployHash,
      provider: "External WCSPR action",
      status: "external_proof",
    });
    expect(result.matches[0]?.gateway.find((row) => row.key === "gateway receipt")?.value).toBe("not found");
    expect(result.matches[0]?.x402.find((row) => row.key === "status")?.value).toBe("unavailable");
    expect(result.matches[0]?.casper.find((row) => row.key === "action page")?.value).toBe("1 of 1218");
  });

  it("clamps and refetches pages beyond the CSPR.cloud page count", async () => {
    mocks.getTokenActionsPage
      .mockResolvedValueOnce({ data: [], itemCount: 8, page: 1000, pageCount: 2, pageSize: 4 })
      .mockResolvedValueOnce({ data: [tokenAction(deployHash, paymentAsset)], itemCount: 8, page: 2, pageCount: 2, pageSize: 4 });

    const result = await getExternalActionFeed({ page: 1000, pageSize: 4 });

    expect(mocks.getTokenActionsPage).toHaveBeenNthCalledWith(2, { contractPackageHash: paymentAsset, page: 2, pageSize: 4 });
    expect(result.pagination).toMatchObject({ hasNextPage: false, page: 2, totalPages: 2 });
  });

  it("does not treat upstream rejection as empty proof", async () => {
    mocks.getTokenActionsPage.mockRejectedValue(new Error("upstream down"));

    const result = await getExternalActionFeed({ page: 1, pageSize: 4 });

    expect(result.source).toBe("upstream_error");
    expect(result.matches).toEqual([]);
    expect(result.message).toContain("unavailable");
  });

  it("returns an unconfigured state without calling CSPR.cloud", async () => {
    mocks.getRuntimeConfig.mockReturnValue({
      casperNetwork: "casper:casper-test",
      paymentAsset,
      paymentAssetSymbol: "WCSPR",
    });

    const result = await getExternalActionFeed();

    expect(result.source).toBe("unconfigured");
    expect(result.message).toContain("CSPR_CLOUD_API_KEY");
    expect(mocks.getTokenActionsPage).not.toHaveBeenCalled();
  });

  it("serves repeated public feed reads from cache", async () => {
    const first = await getCachedExternalActionFeed({ page: 1, pageSize: 4 }, { now: 1_000 });
    const second = await getCachedExternalActionFeed({ page: 1, pageSize: 4 }, { now: 2_000 });

    expect(mocks.getTokenActionsPage).toHaveBeenCalledTimes(1);
    expect(mocks.writeSharedExternalActionFeedCache).toHaveBeenCalledTimes(1);
    expect(first.cache).toMatchObject({ status: "miss", ttlSeconds: 30 });
    expect(second.cache).toMatchObject({ generatedAt: first.cache?.generatedAt, status: "hit" });
    expect(second.matches[0]?.receipt.hash).toBe(deployHash);
  });

  it("serves stale cached proof when CSPR.cloud becomes unavailable", async () => {
    await getCachedExternalActionFeed({ page: 1, pageSize: 4 }, { now: 1_000 });
    mocks.getTokenActionsPage.mockRejectedValue(new Error("upstream down"));

    const result = await getCachedExternalActionFeed({ page: 1, pageSize: 4 }, { now: 32_000 });

    expect(mocks.getTokenActionsPage).toHaveBeenCalledTimes(2);
    expect(result.source).toBe("cspr_cloud");
    expect(result.cache?.status).toBe("stale");
    expect(result.message).toContain("Cached because CSPR.cloud is currently unavailable");
  });

  it("falls back to in-process rate limits without exposing client identity", async () => {
    mocks.checkSharedExternalActionFeedRateLimit.mockRejectedValue(new Error("db down"));
    const first = await checkExternalActionFeedRateLimit("203.0.113.10", { limit: 1, now: 1_000, windowMs: 60_000 });
    const second = await checkExternalActionFeedRateLimit("203.0.113.10", { limit: 1, now: 2_000, windowMs: 60_000 });
    const other = await checkExternalActionFeedRateLimit("203.0.113.11", { limit: 1, now: 2_000, windowMs: 60_000 });

    expect(first).toMatchObject({ allowed: true, remaining: 0 });
    expect(second).toMatchObject({ allowed: false, remaining: 0 });
    expect(other).toMatchObject({ allowed: true, remaining: 0 });
    expect(JSON.stringify(second)).not.toContain("203.0.113.10");
  });

  it("builds an explicit rate-limited feed when no cached proof is available", () => {
    const result = buildRateLimitedFeed({ page: 2, pageSize: 4 });

    expect(result.source).toBe("rate_limited");
    expect(result.matches).toEqual([]);
    expect(result.pagination).toMatchObject({ page: 2, pageSize: 4 });
    expect(result.message).toContain("rate limit");
  });
});

function tokenAction(deploy: string, contractPackageHash: string) {
  return {
    amount: "7500000000",
    block_height: 683276,
    contract_package_hash: contractPackageHash,
    deploy_hash: deploy,
    from_hash: "bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12",
    from_type: 0,
    ft_action_type_id: 0,
    timestamp: "2026-06-23T21:34:47Z",
    to_hash: "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
    to_type: 0,
    transform_idx: 16,
  };
}
