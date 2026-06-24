import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getHostedEndpoint: vi.fn(),
  requireEndpointAccess: vi.fn(),
}));

vi.mock("@/server/endpoint-access", async () => {
  const actual = await vi.importActual<typeof import("@/server/endpoint-access")>("@/server/endpoint-access");
  return {
    ...actual,
    requireEndpointAccess: mocks.requireEndpointAccess,
  };
});

vi.mock("@/server/hosted-endpoint", async () => {
  const actual = await vi.importActual<typeof import("@/server/hosted-endpoint")>("@/server/hosted-endpoint");
  return {
    ...actual,
    getHostedEndpoint: mocks.getHostedEndpoint,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hosted discovery route", () => {
  it("requires scoped client access before returning discovery manifests", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/discovery/route");
    const { EndpointAccessError } =
      await vi.importActual<typeof import("@/server/endpoint-access")>("@/server/endpoint-access");
    mocks.requireEndpointAccess.mockRejectedValue(
      new EndpointAccessError("client access bearer token required", 401),
    );

    const response = await GET(request("https://gw.test/api/mcp/source-1/discovery"), {
      params: Promise.resolve({ sourceId: "source-1" }),
    });

    expect(response.status).toBe(401);
    expect(mocks.getHostedEndpoint).not.toHaveBeenCalled();
  });

  it("returns authorized source-specific discovery without upstream targets", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/discovery/route");
    mocks.requireEndpointAccess.mockResolvedValue({
      id: "key-1",
      scope: { sourceId: "source-1", toolIds: ["tool-1"] },
      sourceId: "source-1",
    });
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
          upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
        },
      ],
    });

    const response = await GET(
      request("https://gw.test/api/mcp/source-1/discovery", { bearer: "cgw_test_once" }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.getHostedEndpoint).toHaveBeenCalledWith("source-1", ["tool-1"]);
    expect(body).toMatchObject({
      endpointUrl: "https://gw.test/api/mcp/source-1",
      manifest: { scope: "authorized-source", visibility: "authorized-source", version: 1 },
      scannerCompatibility: {
        endpointOnlyProbe: "blocked_by_client_access",
        publicDiscovery: "not_enabled",
        status: "not_publicly_indexable",
      },
      tools: [
        {
          id: "tool-1",
          name: "get_quote",
          resource: { url: "https://gw.test/api/mcp/source-1#get_quote" },
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("credentialRef");
    expect(JSON.stringify(body)).not.toContain("tokenHash");
    expect(JSON.stringify(body)).not.toContain("cgw_test_once");
    expect(JSON.stringify(body)).not.toContain("https://mcp.cspr.trade/mcp");
    expect(JSON.stringify(body)).not.toContain("https://mcp.cspr.trade/mcp#get_quote");
  });
});

function request(url: string, init: { bearer?: string } = {}) {
  const headers = new Headers();
  if (init.bearer) headers.set("authorization", `Bearer ${init.bearer}`);
  return new NextRequest(url, { headers });
}
