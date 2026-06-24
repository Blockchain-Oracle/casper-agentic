import type { EndpointAccessScope } from "./endpoint-access";
import type { HostedEndpointView } from "./hosted-endpoint";

export interface HostedDiscoveryManifest {
  auth: {
    header: "Authorization";
    scheme: "Bearer";
    tokenPresented: false;
    valueFormat: "Bearer <client-access-token>";
  };
  endpointUrl: string;
  manifest: {
    scope: "authorized-source";
    visibility: "authorized-source";
    version: 1;
  };
  payment: {
    challengeHeader: "PAYMENT-REQUIRED";
    requestHeader: "PAYMENT-SIGNATURE";
    responseHeader: "PAYMENT-RESPONSE";
    x402Version: 2;
  };
  scope: EndpointAccessScope;
  source: {
    id: string;
    name: string;
    sourceType: string;
  };
  tools: Array<{
    description: string | null;
    id: string;
    inputSchema: unknown;
    name: string;
    paymentRequirements: unknown;
    resource: {
      mimeType: "application/json";
      serviceName: "Casper GW";
      url: string;
    };
  }>;
  transport: {
    jsonRpc: "2.0";
    methods: ["initialize", "tools/list", "tools/call"];
    type: "streamable-http";
  };
}

export function buildHostedDiscoveryManifest(input: {
  endpoint: HostedEndpointView;
  requestUrl: string;
  scope: EndpointAccessScope;
}): HostedDiscoveryManifest {
  const endpointUrl = hostedEndpointUrl(input.requestUrl);
  return {
    auth: {
      header: "Authorization",
      scheme: "Bearer",
      tokenPresented: false,
      valueFormat: "Bearer <client-access-token>",
    },
    endpointUrl,
    manifest: {
      scope: "authorized-source",
      visibility: "authorized-source",
      version: 1,
    },
    payment: {
      challengeHeader: "PAYMENT-REQUIRED",
      requestHeader: "PAYMENT-SIGNATURE",
      responseHeader: "PAYMENT-RESPONSE",
      x402Version: 2,
    },
    scope: input.scope,
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
