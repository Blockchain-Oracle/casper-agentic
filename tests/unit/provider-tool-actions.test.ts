import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  publishProviderTool: vi.fn(),
  saveToolPrice: vi.fn(),
  setProviderToolStatus: vi.fn(),
}));

vi.mock("@/server/provider-store", () => ({
  publishProviderTool: mocks.publishProviderTool,
  saveToolPrice: mocks.saveToolPrice,
  setProviderToolStatus: mocks.setProviderToolStatus,
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

  it("saves Casper x402 tool pricing", async () => {
    const { POST } = await import("@/app/api/provider/tools/[id]/price/route");
    mocks.saveToolPrice.mockResolvedValue({ amount: "7500000000", toolId: "tool-1" });

    const response = await POST(
      request("https://gw.test/api/provider/tools/tool-1/price", {
        body: {
          amount: "7500000000",
          asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
          network: "casper:casper-test",
          payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
        },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "tool-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.saveToolPrice).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "7500000000", network: "casper:casper-test", toolId: "tool-1" }),
    );
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
