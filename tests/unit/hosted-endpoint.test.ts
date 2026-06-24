import { describe, expect, it } from "vitest";

import { buildHostedDiscoveryManifest } from "@/server/hosted-discovery";
import { buildHostedClientMetadata } from "@/server/hosted-client-metadata";
import { paymentRequirementsFromPrice, toHostedEndpointPublicView } from "@/server/hosted-endpoint";

describe("hosted endpoint model", () => {
  it("builds Casper x402 requirements from persisted tool pricing", () => {
    expect(
      paymentRequirementsFromPrice({
        amount: "7500000000",
        asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
        extra: { decimals: "9", symbol: "WCSPR" },
        maxTimeoutSeconds: 900,
        network: "casper:casper-test",
        payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
        scheme: "exact",
      }),
    ).toEqual({
      amount: "7500000000",
      asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
      extra: { decimals: "9", symbol: "WCSPR" },
      maxTimeoutSeconds: 900,
      network: "casper:casper-test",
      payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
      scheme: "exact",
    });
  });

  it("builds scope-safe client metadata from an authenticated endpoint request", () => {
    const metadata = buildHostedClientMetadata({
      endpoint: {
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
            paymentRequirements: paymentRequirementsFromPrice({
              amount: "7500000000",
              asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
              extra: { decimals: "9", symbol: "WCSPR" },
              maxTimeoutSeconds: 900,
              network: "casper:casper-test",
              payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
              scheme: "exact",
            }),
            status: "published",
            upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
          },
        ],
      },
      requestUrl: "https://gw.test/api/mcp/source-1?debug=1#frag",
      scope: { sourceId: "source-1", toolIds: ["tool-1"] },
    });

    expect(metadata.endpointUrl).toBe("https://gw.test/api/mcp/source-1");
    expect(metadata.discovery).toEqual({
      manifestUrl: "https://gw.test/api/mcp/source-1/discovery",
      scope: "authorized-source",
      visibility: "authorized-source",
    });
    expect(metadata.transport).toEqual({
      jsonRpc: "2.0",
      methods: ["initialize", "tools/list", "tools/call"],
      strategy: "http-first",
      type: "streamable-http",
    });
    expect(metadata.auth).toEqual({
      header: "Authorization",
      scheme: "Bearer",
      tokenPresented: false,
      valueFormat: "Bearer <client-access-token>",
    });
    expect(metadata.payment).toEqual({
      challengeHeader: "PAYMENT-REQUIRED",
      protected: true,
      requestHeader: "PAYMENT-SIGNATURE",
      responseHeader: "PAYMENT-RESPONSE",
      x402Version: 2,
    });
    expect(metadata.tools[0]).toMatchObject({
      amount: "7500000000",
      name: "get_quote",
      network: "casper:casper-test",
      scheme: "exact",
    });
    expect(JSON.stringify(metadata)).not.toContain("cgw_test_");
    expect(JSON.stringify(metadata)).not.toContain("credentialRef");
    expect(JSON.stringify(metadata)).not.toContain("tokenHash");
  });

  it("builds authorized source-specific discovery without upstream credential leakage", () => {
    const manifest = buildHostedDiscoveryManifest({
      endpoint: hostedEndpointFixture(),
      requestUrl: "https://gw.test/api/mcp/source-1/discovery?debug=1",
      scope: { sourceId: "source-1", toolIds: ["tool-1"] },
    });

    expect(manifest).toMatchObject({
      endpointUrl: "https://gw.test/api/mcp/source-1",
      manifest: { scope: "authorized-source", visibility: "authorized-source", version: 1 },
      payment: {
        challengeHeader: "PAYMENT-REQUIRED",
        requestHeader: "PAYMENT-SIGNATURE",
        responseHeader: "PAYMENT-RESPONSE",
        x402Version: 2,
      },
      source: { id: "source-1", name: "CSPR Trade" },
    });
    expect(manifest.tools[0]).toMatchObject({
      id: "tool-1",
      name: "get_quote",
      resource: {
        mimeType: "application/json",
        serviceName: "Casper GW",
        url: "https://gw.test/api/mcp/source-1#get_quote",
      },
    });
    expect(JSON.stringify(manifest)).not.toContain("credentialRef");
    expect(JSON.stringify(manifest)).not.toContain("tokenHash");
    expect(JSON.stringify(manifest)).not.toContain("cgw_test_");
    expect(JSON.stringify(manifest)).not.toContain("https://mcp.cspr.trade/mcp");
    expect(JSON.stringify(manifest)).not.toContain("https://mcp.cspr.trade/mcp#get_quote");
  });

  it("redacts upstream source and tool targets from client-facing endpoint views", () => {
    const view = toHostedEndpointPublicView(hostedEndpointFixture());

    expect(view.source).toEqual({ id: "source-1", name: "CSPR Trade", sourceType: "mcp" });
    expect(view.tools[0]).toMatchObject({
      id: "tool-1",
      name: "get_quote",
      paymentRequirements: expect.objectContaining({ amount: "7500000000" }),
    });
    expect(JSON.stringify(view)).not.toContain("authMode");
    expect(JSON.stringify(view)).not.toContain("credentialConfigured");
    expect(JSON.stringify(view)).not.toContain("endpointUrl");
    expect(JSON.stringify(view)).not.toContain("upstreamTarget");
    expect(JSON.stringify(view)).not.toContain("https://mcp.cspr.trade/mcp");
  });
});

function hostedEndpointFixture() {
  return {
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
        paymentRequirements: paymentRequirementsFromPrice({
          amount: "7500000000",
          asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
          extra: { decimals: "9", symbol: "WCSPR" },
          maxTimeoutSeconds: 900,
          network: "casper:casper-test",
          payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
          scheme: "exact",
        }),
        status: "published",
        upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
      },
    ],
  };
}
