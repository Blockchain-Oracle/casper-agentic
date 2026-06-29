import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createProviderSource: vi.fn(),
  discoverMcpTools: vi.fn(),
  discoverOpenApiTools: vi.fn(),
  getProviderSourceRecord: vi.fn(),
  listProviderSources: vi.fn(),
  listProviderTools: vi.fn(),
  persistDiscoveredMcpTools: vi.fn(),
  persistOpenApiTools: vi.fn(),
}));

vi.mock("@/server/provider-store", () => ({
  createProviderSource: mocks.createProviderSource,
  getProviderSourceRecord: mocks.getProviderSourceRecord,
  listProviderSources: mocks.listProviderSources,
  listProviderTools: mocks.listProviderTools,
  persistDiscoveredMcpTools: mocks.persistDiscoveredMcpTools,
  persistOpenApiTools: mocks.persistOpenApiTools,
}));

vi.mock("@/server/mcp-client", () => ({
  discoverMcpTools: mocks.discoverMcpTools,
}));

vi.mock("@/server/openapi-discovery", () => ({
  discoverOpenApiTools: mocks.discoverOpenApiTools,
}));

// Owner guard hits the DB; stub as pass-through for route-handler tests.
vi.mock("@/server/owner-guard", () => ({
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

describe("provider source routes", () => {
  it("lists provider sources without an operator token (public gateway)", async () => {
    const { GET } = await import("@/app/api/provider/sources/route");
    mocks.listProviderSources.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mocks.listProviderSources).toHaveBeenCalled();
  });

  it("creates provider sources with operator access", async () => {
    const { POST } = await import("@/app/api/provider/sources/route");
    mocks.createProviderSource.mockResolvedValue({
      authMode: "none",
      credentialConfigured: false,
      endpointUrl: "https://mcp.cspr.trade/mcp",
      id: "source-1",
      name: "CSPR Trade",
      sourceType: "mcp",
    });

    const response = await POST(
      request("https://gw.test/api/provider/sources", {
        body: {
          endpointUrl: "https://mcp.cspr.trade/mcp",
          name: "CSPR Trade",
          sourceType: "mcp",
        },
        token: "operator-token",
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      source: {
        authMode: "none",
        credentialConfigured: false,
        endpointUrl: "https://mcp.cspr.trade/mcp",
        id: "source-1",
        name: "CSPR Trade",
        sourceType: "mcp",
      },
    });
  });
});

describe("provider discovery route", () => {
  it("routes OpenAPI sources to OpenAPI discovery, not MCP discovery", async () => {
    const { POST } = await import("@/app/api/provider/sources/[id]/discover/route");
    mocks.getProviderSourceRecord.mockResolvedValue({
      authMode: "none",
      credentialRef: null,
      endpointUrl: "https://api.example.com/openapi.json",
      id: "source-1",
      name: "Example",
      sourceType: "openapi",
    });
    mocks.discoverOpenApiTools.mockResolvedValue([{ method: "get", name: "getTodo", pathTemplate: "/todos/{id}" }]);
    mocks.persistOpenApiTools.mockResolvedValue([{ id: "tool-1", name: "getTodo" }]);

    const response = await POST(request("https://gw.test/api/provider/sources/source-1/discover", { token: "operator-token" }), {
      params: Promise.resolve({ id: "source-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.discoverOpenApiTools).toHaveBeenCalledWith("https://api.example.com/openapi.json");
    expect(mocks.discoverMcpTools).not.toHaveBeenCalled();
  });

  it("discovers and persists Remote MCP tools", async () => {
    const { POST } = await import("@/app/api/provider/sources/[id]/discover/route");
    mocks.getProviderSourceRecord.mockResolvedValue({
      authMode: "none",
      credentialRef: null,
      endpointUrl: "https://mcp.cspr.trade/mcp",
      id: "source-1",
      name: "CSPR Trade",
      sourceType: "mcp",
    });
    mocks.discoverMcpTools.mockResolvedValue([{ inputSchema: {}, name: "get_quote" }]);
    mocks.persistDiscoveredMcpTools.mockResolvedValue([{ id: "tool-1", name: "get_quote", status: "draft" }]);

    const response = await POST(request("https://gw.test/api/provider/sources/source-1/discover", { token: "operator-token" }), {
      params: Promise.resolve({ id: "source-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.discoverMcpTools).toHaveBeenCalledWith("https://mcp.cspr.trade/mcp");
    expect(mocks.persistDiscoveredMcpTools).toHaveBeenCalledWith("source-1", "https://mcp.cspr.trade/mcp", [
      { inputSchema: {}, name: "get_quote" },
    ]);
    expect(await response.json()).toMatchObject({
      source: { credentialConfigured: false, id: "source-1", sourceType: "mcp" },
      tools: [{ id: "tool-1", name: "get_quote", status: "draft" }],
    });
  });
});

describe("provider tools route", () => {
  it("passes source filters to the provider tool store", async () => {
    const { GET } = await import("@/app/api/provider/tools/route");
    mocks.listProviderTools.mockResolvedValue([{ id: "tool-1", name: "get_quote" }]);

    const response = await GET(
      request("https://gw.test/api/provider/tools?sourceId=source-1", { token: "operator-token" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.listProviderTools).toHaveBeenCalledWith("source-1");
    expect(await response.json()).toEqual({ tools: [{ id: "tool-1", name: "get_quote" }] });
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
