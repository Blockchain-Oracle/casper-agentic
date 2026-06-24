import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getExternalActionFeed: vi.fn(),
}));

vi.mock("@/server/external-action-feed", () => ({
  getExternalActionFeed: mocks.getExternalActionFeed,
}));

import { GET } from "@/app/api/explorer/actions/route";

describe("explorer actions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes bounded query inputs to the external action feed", async () => {
    mocks.getExternalActionFeed.mockResolvedValue({
      matches: [],
      message: "ok",
      network: "casper:casper-test",
      pagination: { hasNextPage: false, hasPreviousPage: false, page: 2, pageSize: 4, totalCount: 0, totalPages: 1 },
      source: "cspr_cloud",
    });

    const response = await GET(new NextRequest("http://localhost/api/explorer/actions?page=2&pageSize=4"));

    expect(response.status).toBe(200);
    expect(mocks.getExternalActionFeed).toHaveBeenCalledWith({ page: "2", pageSize: "4" });
  });

  it("maps upstream and unconfigured feed failures to 503", async () => {
    mocks.getExternalActionFeed.mockResolvedValue({
      matches: [],
      message: "CSPR.cloud external WCSPR action feed is unavailable.",
      network: "casper:casper-test",
      pagination: { hasNextPage: false, hasPreviousPage: false, page: 1, pageSize: 4, totalCount: 0, totalPages: 1 },
      source: "upstream_error",
    });

    const response = await GET(new NextRequest("http://localhost/api/explorer/actions"));

    expect(response.status).toBe(503);
  });
});
