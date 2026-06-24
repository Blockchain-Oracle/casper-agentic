import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkSharedExternalActionFeedRateLimit: vi.fn(),
  getRuntimeConfig: vi.fn(),
  getTokenActionsPage: vi.fn(),
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
  checkExternalActionFeedRateLimit,
  getCachedExternalActionFeed,
  resetExternalActionFeedRuntimeState,
} from "@/server/external-action-feed-cache";

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
  mocks.checkSharedExternalActionFeedRateLimit.mockResolvedValue(null);
  mocks.readSharedExternalActionFeedCache.mockResolvedValue(null);
  mocks.writeSharedExternalActionFeedCache.mockResolvedValue(undefined);
});

describe("external action feed shared state", () => {
  it("serves shared cached proof before calling CSPR.cloud", async () => {
    mocks.readSharedExternalActionFeedCache.mockResolvedValue({
      createdAt: 1_000,
      result: externalFeedResult(),
      staleUntil: 301_000,
    });

    const result = await getCachedExternalActionFeed({ page: 1, pageSize: 4 }, { now: 2_000 });

    expect(mocks.getTokenActionsPage).not.toHaveBeenCalled();
    expect(result.cache).toMatchObject({ generatedAt: new Date(1_000).toISOString(), status: "hit" });
    expect(result.matches[0]?.receipt.hash).toBe(deployHash);
  });

  it("serves stale shared proof when CSPR.cloud becomes unavailable", async () => {
    mocks.readSharedExternalActionFeedCache.mockResolvedValue({
      createdAt: 1_000,
      result: externalFeedResult(),
      staleUntil: 301_000,
    });
    mocks.getTokenActionsPage.mockRejectedValue(new Error("upstream down"));

    const result = await getCachedExternalActionFeed({ page: 1, pageSize: 4 }, { now: 32_000 });

    expect(mocks.getTokenActionsPage).toHaveBeenCalledTimes(1);
    expect(result.cache?.status).toBe("stale");
    expect(result.message).toContain("Cached because CSPR.cloud is currently unavailable");
  });

  it("uses shared rate buckets when available", async () => {
    mocks.checkSharedExternalActionFeedRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(61_000),
    });

    const result = await checkExternalActionFeedRateLimit("203.0.113.10", {
      limit: 1,
      now: 1_000,
      windowMs: 60_000,
    });

    expect(result).toMatchObject({ allowed: false, remaining: 0 });
    expect(JSON.stringify(result)).not.toContain("203.0.113.10");
  });
});

function externalFeedResult() {
  return {
    matches: [{ receipt: { hash: deployHash, id: `external-action:${deployHash}:16`, status: "external_proof" } }],
    message: "Resolved external WCSPR actions for the configured payment asset through CSPR.cloud.",
    network: "casper:casper-test",
    pagination: { hasNextPage: true, hasPreviousPage: false, page: 1, pageSize: 4, totalCount: 4870, totalPages: 1218 },
    source: "cspr_cloud",
  };
}
