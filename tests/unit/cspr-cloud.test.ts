import { beforeEach, describe, expect, it, vi } from "vitest";

import { CsprCloudClient } from "@/server/cspr-cloud";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = fetchMock;
  fetchMock.mockResolvedValue({
    json: async () => ({ data: [], item_count: 6, page_count: 3 }),
    ok: true,
  });
});

describe("CSPR.cloud client", () => {
  it("uses page_size for paginated token actions", async () => {
    const client = new CsprCloudClient({
      csprCloudApiKey: "test-key",
      csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    });

    const result = await client.getTokenActionsPage({
      accountHash: "account-hash",
      contractPackageHash: "package-hash",
      page: 2,
      pageSize: 2,
    });

    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/ft-token-actions");
    expect(parsed.searchParams.get("account_hash")).toBe("account-hash");
    expect(parsed.searchParams.get("contract_package_hash")).toBe("package-hash");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.get("page_size")).toBe("2");
    expect(parsed.searchParams.get("limit")).toBeNull();
    expect(init.headers.authorization).toBe("test-key");
    expect(result).toMatchObject({ itemCount: 6, page: 2, pageCount: 3, pageSize: 2 });
  });
});
