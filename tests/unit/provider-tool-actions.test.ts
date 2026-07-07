import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  publishProviderToolFree: vi.fn(),
  publishProviderTool: vi.fn(),
  saveToolPrice: vi.fn(),
  setProviderToolStatus: vi.fn(),
  unpublishProviderTool: vi.fn(),
}));

vi.mock("@/server/provider-store", () => ({
  publishProviderToolFree: mocks.publishProviderToolFree,
  publishProviderTool: mocks.publishProviderTool,
  saveToolPrice: mocks.saveToolPrice,
  setProviderToolStatus: mocks.setProviderToolStatus,
  unpublishProviderTool: mocks.unpublishProviderTool,
}));

// Owner guard hits the DB to resolve a record's owner; stub it as a pass-through so
// these route tests exercise handler logic, not ownership enforcement.
vi.mock("@/server/owner-guard", () => ({
  requireToolOwner: vi.fn(async () => null),
  requireSourceOwner: vi.fn(async () => null),
  readOwnerFromRequest: vi.fn(() => null),
  assignSourceOwner: vi.fn(async () => undefined),
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("provider tool action routes", () => {
  it("selects provider tools", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/select/route");
    mocks.setProviderToolStatus.mockResolvedValue({ id: "tool-1", status: "selected" });

    const response = await POST(request("https://gw.test/api/provider/tools/tool-1/select", { token: "operator-token" }), {
      params: Promise.resolve({ id: "tool-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.setProviderToolStatus).toHaveBeenCalledWith("tool-1", "selected");
    expect(await response.json()).toEqual({ tool: { id: "tool-1", status: "selected" } });
  });

  it("rejects client-supplied asset/network (still server-side), but not payTo", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/price/route");

    const response = await POST(
      request("https://gw.test/api/provider/tools/tool-1/price", {
        body: {
          amount: "7500000000",
          asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
          network: "casper:casper-test",
        },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "tool-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("payment fields are server-side only");
    expect(body.error).toMatch(/asset|network/);
    expect(mocks.saveToolPrice).not.toHaveBeenCalled();
  });

  it("uses the signed-in owner's wallet as the payout (payTo), not the global env", async () => {
    const { requireToolOwner } = await import("@/server/owner-guard");
    const { POST } = await import("@/app/api/provider/tools/[id]/price/route");
    process.env.CASPER_PAYEE_ACCOUNT_HASH = "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
    const ownerHash = "1111111111111111111111111111111111111111111111111111111111111111";
    vi.mocked(requireToolOwner).mockResolvedValueOnce({ accountHash: ownerHash, publicKey: "01abc" });
    mocks.saveToolPrice.mockResolvedValue({ amount: "7500000000", toolId: "tool-1" });

    const response = await POST(
      request("https://gw.test/api/provider/tools/tool-1/price", {
        body: { amount: "7500000000" },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "tool-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.saveToolPrice).toHaveBeenCalledWith(expect.objectContaining({ payTo: `00${ownerHash}` }));
  });

  it("accepts and normalizes a provider payout override (payTo)", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/price/route");
    process.env.CASPER_PAYEE_ACCOUNT_HASH = "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
    const override = "2222222222222222222222222222222222222222222222222222222222222222";
    mocks.saveToolPrice.mockResolvedValue({ amount: "7500000000", toolId: "tool-1" });

    const response = await POST(
      request("https://gw.test/api/provider/tools/tool-1/price", {
        body: { amount: "7500000000", payTo: `account-hash-${override}` },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "tool-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.saveToolPrice).toHaveBeenCalledWith(expect.objectContaining({ payTo: `00${override}` }));
  });

  it("uses server-side Casper payment defaults when UI pricing omits public payment fields", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/price/route");
    process.env.CASPER_PAYEE_ACCOUNT_HASH = "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
    mocks.saveToolPrice.mockResolvedValue({ amount: "7500000000", toolId: "tool-1" });

    const response = await POST(
      request("https://gw.test/api/provider/tools/tool-1/price", {
        body: { amount: "7500000000" },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "tool-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.saveToolPrice).toHaveBeenCalledWith({
      amount: "7500000000",
      asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
      extra: { decimals: "9", name: "Wrapped CSPR", symbol: "WCSPR", version: "1" },
      maxTimeoutSeconds: 900,
      network: "casper:casper-test",
      payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
      scheme: "exact",
      toolId: "tool-1",
    });
  });

  it("rejects provider pricing outside Phase 1 Casper Testnet WCSPR defaults", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/price/route");
    process.env.CASPER_NETWORK = "casper:casper-main";
    process.env.CASPER_PAYEE_ACCOUNT_HASH = "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";

    const response = await POST(
      request("https://gw.test/api/provider/tools/tool-1/price", {
        body: { amount: "7500000000" },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "tool-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "provider pricing requires Casper Testnet" });
    expect(mocks.saveToolPrice).not.toHaveBeenCalled();
  });

  it("publishes provider tools through the store guard", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/publish/route");
    mocks.publishProviderTool.mockResolvedValue({ id: "tool-1", status: "published" });

    const response = await POST(request("https://gw.test/api/provider/tools/tool-1/publish", { token: "operator-token" }), {
      params: Promise.resolve({ id: "tool-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.publishProviderTool).toHaveBeenCalledWith("tool-1");
    expect(await response.json()).toEqual({ tool: { id: "tool-1", status: "published" } });
  });

  it("publishes provider tools free by clearing their price", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/free/route");
    mocks.publishProviderToolFree.mockResolvedValue({ id: "tool-1", price: null, status: "published" });

    const response = await POST(request("https://gw.test/api/provider/tools/tool-1/free", { token: "operator-token" }), {
      params: Promise.resolve({ id: "tool-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.publishProviderToolFree).toHaveBeenCalledWith("tool-1");
    expect(await response.json()).toEqual({ tool: { id: "tool-1", price: null, status: "published" } });
  });

  it("unpublishes provider tools", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/unpublish/route");
    mocks.unpublishProviderTool.mockResolvedValue({ id: "tool-1", status: "unpublished" });

    const response = await POST(request("https://gw.test/api/provider/tools/tool-1/unpublish", { token: "operator-token" }), {
      params: Promise.resolve({ id: "tool-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.unpublishProviderTool).toHaveBeenCalledWith("tool-1");
    expect(await response.json()).toEqual({ tool: { id: "tool-1", status: "unpublished" } });
  });
});

function request(url: string, init: { body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (init.token) headers.set("x-casper-gw-operator-token", init.token);
  if (init.body) headers.set("content-type", "application/json");

  return new NextRequest(url, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: init.body ? "POST" : "GET",
  });
}
