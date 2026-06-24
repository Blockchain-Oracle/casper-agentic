import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildRateLimitedFeed: vi.fn(),
  checkExternalActionFeedRateLimit: vi.fn(),
  getCachedExternalActionFeed: vi.fn(),
}));

vi.mock("@/server/external-action-feed-cache", () => ({
  buildRateLimitedFeed: mocks.buildRateLimitedFeed,
  checkExternalActionFeedRateLimit: mocks.checkExternalActionFeedRateLimit,
  getCachedExternalActionFeed: mocks.getCachedExternalActionFeed,
}));

import { GET } from "@/app/api/explorer/actions/route";

describe("explorer actions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkExternalActionFeedRateLimit.mockReturnValue({
      allowed: true,
      remaining: 29,
      resetAt: new Date("2026-06-24T10:00:00.000Z"),
    });
  });

  it("passes bounded query inputs to the cached external action feed", async () => {
    mocks.getCachedExternalActionFeed.mockResolvedValue({
      cache: { generatedAt: "2026-06-24T09:59:30.000Z", status: "miss", ttlSeconds: 30 },
      matches: [],
      message: "ok",
      network: "casper:casper-test",
      pagination: { hasNextPage: false, hasPreviousPage: false, page: 2, pageSize: 4, totalCount: 0, totalPages: 1 },
      source: "cspr_cloud",
    });

    const response = await GET(new NextRequest("http://localhost/api/explorer/actions?page=2&pageSize=4"));

    expect(response.status).toBe(200);
    expect(mocks.getCachedExternalActionFeed).toHaveBeenCalledWith({ page: "2", pageSize: "4" });
    const body = await response.json();
    expect(body.rateLimit).toEqual({
      limited: false,
      remaining: 29,
      resetAt: "2026-06-24T10:00:00.000Z",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("x-casper-gw-feed-cache")).toBe("miss");
    expect(response.headers.get("x-casper-gw-rate-limit-remaining")).toBe("29");
  });

  it("maps upstream and unconfigured feed failures to 503", async () => {
    mocks.getCachedExternalActionFeed.mockResolvedValue({
      matches: [],
      message: "CSPR.cloud external WCSPR action feed is unavailable.",
      network: "casper:casper-test",
      pagination: { hasNextPage: false, hasPreviousPage: false, page: 1, pageSize: 4, totalCount: 0, totalPages: 1 },
      source: "upstream_error",
    });

    const response = await GET(new NextRequest("http://localhost/api/explorer/actions"));

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns cached proof for a rate-limited request when available", async () => {
    mocks.checkExternalActionFeedRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date("2026-06-24T10:00:00.000Z"),
    });
    mocks.getCachedExternalActionFeed.mockResolvedValue({
      cache: { generatedAt: "2026-06-24T09:59:00.000Z", status: "stale", ttlSeconds: 30 },
      matches: [{ receipt: { id: "external-action:1" } }],
      message: "cached",
      network: "casper:casper-test",
      pagination: { hasNextPage: false, hasPreviousPage: false, page: 1, pageSize: 4, totalCount: 1, totalPages: 1 },
      source: "cspr_cloud",
    });

    const response = await GET(new NextRequest("http://localhost/api/explorer/actions", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    }));

    expect(response.status).toBe(200);
    expect(mocks.getCachedExternalActionFeed).toHaveBeenCalledWith({ page: null, pageSize: null }, { fetchOnMiss: false });
    expect((await response.json()).rateLimit).toMatchObject({ limited: true, remaining: 0 });
    expect(response.headers.get("x-casper-gw-feed-cache")).toBe("stale");
    expect(response.headers.get("x-casper-gw-rate-limit-remaining")).toBe("0");
  });

  it("returns 429 for rate-limited requests without cached proof", async () => {
    mocks.checkExternalActionFeedRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date("2026-06-24T10:00:00.000Z"),
    });
    mocks.getCachedExternalActionFeed.mockResolvedValue(null);
    mocks.buildRateLimitedFeed.mockReturnValue({
      matches: [],
      message: "External WCSPR feed rate limit reached. Retry after the reset time.",
      network: "casper:casper-test",
      pagination: { hasNextPage: false, hasPreviousPage: false, page: 1, pageSize: 4, totalCount: 0, totalPages: 1 },
      source: "rate_limited",
    });

    const response = await GET(new NextRequest("http://localhost/api/explorer/actions"));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.source).toBe("rate_limited");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
