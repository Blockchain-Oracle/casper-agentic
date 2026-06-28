import type { HostedEndpointView } from "./hosted-endpoint";

// Discovery manifest for the hosted MCP server. Auth = casper_ API key (tools/list
// public, tools/call requires the key); payment is settled by the gateway signer on
// Casper, surfaced in the tool result's _meta["x402/payment-response"]. No caller
// signing, so there is no PAYMENT-SIGNATURE challenge.
export interface HostedDiscoveryManifest {
  auth: {
    header: "x-api-key | Authorization: Bearer";
    mode: "api_key";
    note: string;
    prefix: "casper_";
  };
  endpointUrl: string;
  manifest: { version: 2; visibility: "public" };
  payment: {
    asset: "WCSPR";
    responseMeta: "x402/payment-response";
    settledBy: "casper-gw-gateway-signer";
    x402Version: 2;
  };
  source: { id: string; name: string; sourceType: string };
  tools: Array<{
    description: string | null;
    id: string;
    inputSchema: unknown;
    name: string;
    paymentRequirements: unknown;
    resource: { mimeType: "application/json"; serviceName: "Casper GW"; url: string };
  }>;
  transport: { jsonRpc: "2.0"; methods: ["initialize", "tools/list", "tools/call"]; type: "streamable-http" };
}

export function buildHostedDiscoveryManifest(input: {
  endpoint: HostedEndpointView;
  requestUrl: string;
}): HostedDiscoveryManifest {
  const endpointUrl = hostedEndpointUrl(input.requestUrl);
  return {
    auth: {
      header: "x-api-key | Authorization: Bearer",
      mode: "api_key",
      note: "tools/list is public; tools/call requires a casper_ key",
      prefix: "casper_",
    },
    endpointUrl,
    manifest: { version: 2, visibility: "public" },
    payment: {
      asset: "WCSPR",
      responseMeta: "x402/payment-response",
      settledBy: "casper-gw-gateway-signer",
      x402Version: 2,
    },
    source: {
      id: input.endpoint.source.id,
      name: input.endpoint.source.name,
      sourceType: input.endpoint.source.sourceType,
    },
    tools: input.endpoint.tools.map((tool) => ({
      description: tool.description,
      id: tool.id,
      inputSchema: tool.inputSchema,
      name: tool.name,
      paymentRequirements: tool.paymentRequirements,
      resource: {
        mimeType: "application/json",
        serviceName: "Casper GW",
        url: `${endpointUrl}#${tool.name}`,
      },
    })),
    transport: {
      jsonRpc: "2.0",
      methods: ["initialize", "tools/list", "tools/call"],
      type: "streamable-http",
    },
  };
}

export function discoveryManifestUrl(endpointRequestUrl: string) {
  return `${hostedEndpointUrl(endpointRequestUrl)}/discovery`;
}

function hostedEndpointUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/discovery\/?$/, "");
  return url.toString().replace(/\/$/, "");
}
