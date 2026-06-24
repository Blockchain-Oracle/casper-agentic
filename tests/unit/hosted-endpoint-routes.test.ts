import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createEndpointAccessKey: vi.fn(),
  getHostedEndpoint: vi.fn(),
  requireEndpointAccess: vi.fn(),
}));

vi.mock("@/server/endpoint-access", async () => {
  const actual = await vi.importActual<typeof import("@/server/endpoint-access")>("@/server/endpoint-access");
  return {
    ...actual,
    createEndpointAccessKey: mocks.createEndpointAccessKey,
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

describe("hosted endpoint route", () => {
  it("requires scoped client access before returning endpoint metadata", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/route");
    const { EndpointAccessError } =
      await vi.importActual<typeof import("@/server/endpoint-access")>("@/server/endpoint-access");
    mocks.requireEndpointAccess.mockRejectedValue(
      new EndpointAccessError("client access bearer token required", 401),
    );

    const response = await GET(request("https://gw.test/api/mcp/source-1"), {
      params: Promise.resolve({ sourceId: "source-1" }),
    });

    expect(response.status).toBe(401);
    expect(mocks.getHostedEndpoint).not.toHaveBeenCalled();
  });

  it("returns published tools and payment requirements without provider credentials", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.requireEndpointAccess.mockResolvedValue({ id: "key-1", scope: { sourceId: "source-1" }, sourceId: "source-1" });
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

    const response = await GET(
      request("https://gw.test/api/mcp/source-1", { bearer: "cgw_test_once" }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.requireEndpointAccess).toHaveBeenCalledWith("source-1", "Bearer cgw_test_once");
    expect(mocks.getHostedEndpoint).toHaveBeenCalledWith("source-1", undefined);
    expect(JSON.stringify(body)).not.toContain("credentialRef");
    expect(JSON.stringify(body)).not.toContain("tokenHash");
    expect(JSON.stringify(body)).not.toContain("cgw_test_once");
    expect(JSON.stringify(body)).not.toContain("authMode");
    expect(JSON.stringify(body)).not.toContain("credentialConfigured");
    expect(JSON.stringify(body)).not.toContain("upstreamTarget");
    expect(JSON.stringify(body)).not.toContain("https://mcp.cspr.trade/mcp");
    expect(body.client).toMatchObject({
      auth: {
        header: "Authorization",
        scheme: "Bearer",
        tokenPresented: false,
        valueFormat: "Bearer <client-access-token>",
      },
      discovery: {
        manifestUrl: "https://gw.test/api/mcp/source-1/discovery",
        scope: "authorized-source",
        visibility: "authorized-source",
      },
      endpointUrl: "https://gw.test/api/mcp/source-1",
      payment: {
        challengeHeader: "PAYMENT-REQUIRED",
        protected: true,
        requestHeader: "PAYMENT-SIGNATURE",
        responseHeader: "PAYMENT-RESPONSE",
        x402Version: 2,
      },
      transport: {
        jsonRpc: "2.0",
        strategy: "http-first",
        type: "streamable-http",
      },
    });
    expect(body.endpoint.tools[0].paymentRequirements).toMatchObject({
      amount: "7500000000",
      network: "casper:casper-test",
      scheme: "exact",
    });
    expect(body.endpoint.source).toEqual({ id: "source-1", name: "CSPR Trade", sourceType: "mcp" });
  });

  it("passes limited tool scopes to hosted endpoint metadata", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/route");
    mocks.requireEndpointAccess.mockResolvedValue({
      id: "key-1",
      scope: { sourceId: "source-1", toolIds: ["tool-allowed"] },
      sourceId: "source-1",
    });
    mocks.getHostedEndpoint.mockResolvedValue({ source: { id: "source-1" }, tools: [] });

    const response = await GET(
      request("https://gw.test/api/mcp/source-1", { bearer: "cgw_test_limited" }),
      { params: Promise.resolve({ sourceId: "source-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.getHostedEndpoint).toHaveBeenCalledWith("source-1", ["tool-allowed"]);
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
