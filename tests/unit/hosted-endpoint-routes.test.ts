import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createEndpointAccessKey: vi.fn(),
  getHostedEndpoint: vi.fn(),
  requireEndpointAccess: vi.fn(),
}));

vi.mock("@/server/endpoint-access", () => ({
  createEndpointAccessKey: mocks.createEndpointAccessKey,
  requireEndpointAccess: mocks.requireEndpointAccess,
}));

// Owner guard hits the DB; stub as pass-through for the access-key route test.
vi.mock("@/server/owner-guard", () => ({
  requireSourceOwner: vi.fn(async () => null),
}));

vi.mock("@/server/hosted-endpoint", () => ({
  getHostedEndpoint: mocks.getHostedEndpoint,
  hostedMcpTools: (endpoint: HostedEndpointStub) =>
    endpoint.tools.map((tool) => ({
      _meta: {
        "casperGw/paymentRequirements": tool.paymentRequirements,
        "casperGw/toolId": tool.id,
      },
      description: tool.description ?? undefined,
      inputSchema: tool.inputSchema,
      name: tool.name,
    })),
  resolveHostedTool: (endpoint: HostedEndpointStub, nameOrId: string) =>
    endpoint.tools.find((tool) => tool.name === nameOrId || tool.id === nameOrId) ?? null,
  toHostedEndpointPublicView: (endpoint: HostedEndpointStub) => ({
    source: {
      id: endpoint.source.id,
      name: endpoint.source.name,
      sourceType: endpoint.source.sourceType,
    },
    tools: endpoint.tools.map((tool) => ({
      description: tool.description,
      id: tool.id,
      inputSchema: tool.inputSchema,
      name: tool.name,
      paymentRequirements: tool.paymentRequirements,
      status: tool.status,
    })),
  }),
}));

type HostedEndpointStub = {
  source: { id: string; name: string; sourceType: string };
  tools: Array<{
    description?: string | null;
    id: string;
    inputSchema: unknown;
    name: string;
    paymentRequirements?: unknown;
    status?: string;
  }>;
};

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CASPER_GW_OPERATOR_TOKEN = "operator-token";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("endpoint access-key route", () => {
  it("creates one-time client access tokens for a source", async () => {
    const { POST } = await import("@/app/api/provider/sources/[id]/access-keys/route");
    mocks.createEndpointAccessKey.mockResolvedValue({
      accessKey: { id: "key-1", label: "Cursor", sourceId: "source-1" },
      token: "cgw_test_once",
    });

    const response = await POST(
      request("https://gw.test/api/provider/sources/source-1/access-keys", {
        body: { label: "Cursor", toolIds: ["tool-1"] },
        token: "operator-token",
      }),
      { params: Promise.resolve({ id: "source-1" }) },
    );

    expect(response.status).toBe(201);
    expect(mocks.createEndpointAccessKey).toHaveBeenCalledWith({
      label: "Cursor",
      scope: { sourceId: "source-1", toolIds: ["tool-1"] },
      sourceId: "source-1",
    });
    expect(await response.json()).toEqual({
      accessKey: { id: "key-1", label: "Cursor", sourceId: "source-1" },
      token: "cgw_test_once",
    });
  });
});

describe("hosted endpoint route (GET, public metadata)", () => {
  it("returns public endpoint metadata + API-key auth info without provider credentials", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.getHostedEndpoint.mockResolvedValue({
      source: {
        authMode: "bearer",
        credentialConfigured: true,
        endpointUrl: "https://mcp.cspr.trade/mcp",
        id: "source-1",
        name: "CSPR Trade",
        sourceType: "mcp",
      },
      tools: [
        {
          description: "Quote WCSPR swaps",
          id: "tool-1",
          inputSchema: { type: "object" },
          name: "get_quote",
          paymentRequirements: { amount: "7500000000", network: "casper:casper-test", scheme: "exact" },
          status: "published",
          upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
        },
      ],
    });

    const response = await GET(request("https://gw.test/api/mcp/source-1"), {
      params: Promise.resolve({ sourceId: "source-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getHostedEndpoint).toHaveBeenCalledWith("source-1");
    expect(body.auth).toMatchObject({ mode: "api_key", prefix: "casper_" });
    expect(body.payment).toMatchObject({ asset: "WCSPR", settledBy: "casper-gw-gateway-signer" });
    expect(body.transport).toBe("streamable-http");
    expect(body.endpoint.source).toEqual({ id: "source-1", name: "CSPR Trade", sourceType: "mcp" });
    expect(body.endpoint.tools[0].paymentRequirements).toMatchObject({
      amount: "7500000000",
      network: "casper:casper-test",
      scheme: "exact",
    });
    expect(JSON.stringify(body)).not.toContain("credentialRef");
    expect(JSON.stringify(body)).not.toContain("tokenHash");
    expect(JSON.stringify(body)).not.toContain("credentialConfigured");
    expect(JSON.stringify(body)).not.toContain("upstreamTarget");
    expect(JSON.stringify(body)).not.toContain("https://mcp.cspr.trade/mcp");
  });

  it("404s when the source does not exist", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.getHostedEndpoint.mockRejectedValue(new Error("hosted endpoint not found"));

    const response = await GET(request("https://gw.test/api/mcp/missing"), {
      params: Promise.resolve({ sourceId: "missing" }),
    });

    expect(response.status).toBe(404);
  });
});

function request(url: string, init: { bearer?: string; body?: unknown; token?: string } = {}) {
  const headers = new Headers();
  if (init.bearer) headers.set("authorization", `Bearer ${init.bearer}`);
  if (init.token) headers.set("x-casper-gw-operator-token", init.token);
  if (init.body) headers.set("content-type", "application/json");

  return new NextRequest(url, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers,
    method: init.body ? "POST" : "GET",
  });
}
