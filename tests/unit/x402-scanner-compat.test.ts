import { describe, expect, it } from "vitest";

import { buildHostedClientMetadata } from "@/server/hosted-client-metadata";
import { buildHostedDiscoveryManifest } from "@/server/hosted-discovery";
import { paymentRequirementsFromPrice, type HostedEndpointView } from "@/server/hosted-endpoint";
import { buildX402ScannerCompatibility } from "@/server/x402-scanner-compat";

describe("x402 scanner compatibility preflight", () => {
  it("marks hosted endpoints as not publicly indexable while client access is required", () => {
    expect(buildX402ScannerCompatibility(hostedEndpointFixture())).toEqual({
      allVisibleToolsPayable: true,
      discoveryPrecedence: ["openapi", "well_known_x402", "endpoint_only_probe"],
      endpointOnlyProbe: "blocked_by_client_access",
      nextRequirements: [
        "Keep scoped client access before tool metadata and runtime x402 challenges.",
        "Require a separate opt-in plan before exposing public OpenAPI or /.well-known/x402 discovery.",
        "Do not claim public scanner indexing until unauthenticated discovery is explicitly accepted.",
      ],
      payableToolCount: 1,
      publicDiscovery: "not_enabled",
      runtimeChallenge: "available_after_client_access",
      status: "not_publicly_indexable",
      visibleToolCount: 1,
    });
  });

  it("detects visible tools that cannot produce x402 payment requirements", () => {
    const endpoint = hostedEndpointFixture();
    endpoint.tools[0].paymentRequirements = null;

    expect(buildX402ScannerCompatibility(endpoint)).toMatchObject({
      allVisibleToolsPayable: false,
      payableToolCount: 0,
      runtimeChallenge: "missing_payment_requirements",
      status: "not_publicly_indexable",
      visibleToolCount: 1,
    });
  });

  it("adds preflight status to authorized metadata without leaking upstream targets", () => {
    const endpoint = hostedEndpointFixture();
    const metadata = buildHostedClientMetadata({
      endpoint,
      requestUrl: "https://gw.test/api/mcp/source-1",
      scope: { sourceId: "source-1", toolIds: ["tool-1"] },
    });
    const manifest = buildHostedDiscoveryManifest({
      endpoint,
      requestUrl: "https://gw.test/api/mcp/source-1/discovery",
      scope: { sourceId: "source-1", toolIds: ["tool-1"] },
    });

    expect(metadata.scannerCompatibility.publicDiscovery).toBe("not_enabled");
    expect(metadata.scannerCompatibility.endpointOnlyProbe).toBe("blocked_by_client_access");
    expect(manifest.scannerCompatibility).toEqual(metadata.scannerCompatibility);
    expect(JSON.stringify({ manifest, metadata })).not.toContain("https://mcp.cspr.trade/mcp");
    expect(JSON.stringify({ manifest, metadata })).not.toContain("credentialRef");
    expect(JSON.stringify({ manifest, metadata })).not.toContain("tokenHash");
    expect(JSON.stringify({ manifest, metadata })).not.toContain("cgw_test_");
  });
});

function hostedEndpointFixture(): HostedEndpointView {
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
