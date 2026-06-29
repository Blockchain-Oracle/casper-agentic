import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getHostedEndpoint: vi.fn(),
}));

vi.mock("@/server/hosted-endpoint", () => ({
  getHostedEndpoint: mocks.getHostedEndpoint,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hosted discovery route (public manifest)", () => {
  it("returns a public API-key/gateway-settle manifest without upstream targets", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/discovery/route");
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

    const response = await GET(request("https://gw.test/api/mcp/source-1/discovery"), {
      params: Promise.resolve({ sourceId: "source-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.getHostedEndpoint).toHaveBeenCalledWith("source-1");
    expect(body).toMatchObject({
      auth: { mode: "api_key", prefix: "casper_" },
      endpointUrl: "https://gw.test/api/mcp/source-1",
      manifest: { version: 2, visibility: "public" },
      payment: { asset: "WCSPR", settledBy: "casper-gw-gateway-signer" },
      tools: [{ id: "tool-1", name: "get_quote", resource: { url: "https://gw.test/api/mcp/source-1#get_quote" } }],
    });
    expect(JSON.stringify(body)).not.toContain("credentialRef");
    expect(JSON.stringify(body)).not.toContain("tokenHash");
    expect(JSON.stringify(body)).not.toContain("https://mcp.cspr.trade/mcp");
  });

  it("404s when the source does not exist", async () => {
    const { GET } = await import("@/app/api/mcp/[sourceId]/discovery/route");
    mocks.getHostedEndpoint.mockRejectedValue(new Error("hosted endpoint not found"));

    const response = await GET(request("https://gw.test/api/mcp/missing/discovery"), {
      params: Promise.resolve({ sourceId: "missing" }),
    });

    expect(response.status).toBe(404);
  });
});

function request(url: string) {
  return new NextRequest(url, { headers: new Headers() });
}
