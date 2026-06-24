import { describe, expect, it } from "vitest";

import { buildHostedClientMetadata } from "@/server/hosted-client-metadata";
import { paymentRequirementsFromPrice } from "@/server/hosted-endpoint";

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
});
