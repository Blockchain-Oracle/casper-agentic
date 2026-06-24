import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  searchExplorer: vi.fn(),
}));

vi.mock("@/server/explorer-search", () => ({
  searchExplorer: mocks.searchExplorer,
}));

import { GET } from "@/app/api/explorer/search/route";

describe("explorer search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps upstream external lookup failures to 503", async () => {
    mocks.searchExplorer.mockResolvedValue({
      message: "CSPR.cloud external account action history is unavailable.",
      query: "account-hash",
      source: "upstream_error",
    });

    const response = await GET(new NextRequest("http://localhost/api/explorer/search?q=account-hash"));

    expect(response.status).toBe(503);
    expect(mocks.searchExplorer).toHaveBeenCalledWith("account-hash", {
      externalPage: null,
      externalPageSize: null,
    });
  });
});
