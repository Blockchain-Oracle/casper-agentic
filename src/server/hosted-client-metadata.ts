import type { EndpointAccessScope } from "./endpoint-access";
import type { HostedEndpointView } from "./hosted-endpoint";

export interface HostedEndpointClientMetadata {
  auth: {
    header: "Authorization";
    scheme: "Bearer";
    tokenPresented: false;
    valueFormat: "Bearer <client-access-token>";
  };
  endpointUrl: string;
  payment: {
    challengeHeader: "PAYMENT-REQUIRED";
    protected: true;
    requestHeader: "PAYMENT-SIGNATURE";
    responseHeader: "PAYMENT-RESPONSE";
    x402Version: 2;
  };
  scope: EndpointAccessScope;
  tools: Array<{
    amount: string | null;
    asset: string | null;
    id: string;
    name: string;
    network: string | null;
    payTo: string | null;
    scheme: string | null;
  }>;
  transport: {
    jsonRpc: "2.0";
    methods: ["initialize", "tools/list", "tools/call"];
    strategy: "http-first";
    type: "streamable-http";
  };
}

export function buildHostedClientMetadata(input: {
  endpoint: HostedEndpointView;
  requestUrl: string;
  scope: EndpointAccessScope;
}): HostedEndpointClientMetadata {
  return {
    auth: {
      header: "Authorization",
      scheme: "Bearer",
      tokenPresented: false,
      valueFormat: "Bearer <client-access-token>",
    },
    endpointUrl: normalizeAbsoluteUrl(input.requestUrl),
    payment: {
      challengeHeader: "PAYMENT-REQUIRED",
      protected: true,
      requestHeader: "PAYMENT-SIGNATURE",
      responseHeader: "PAYMENT-RESPONSE",
      x402Version: 2,
    },
    scope: input.scope,
    tools: input.endpoint.tools.map((tool) => ({
      amount: tool.paymentRequirements?.amount ?? null,
      asset: tool.paymentRequirements?.asset ?? null,
      id: tool.id,
      name: tool.name,
      network: tool.paymentRequirements?.network ?? null,
      payTo: tool.paymentRequirements?.payTo ?? null,
      scheme: tool.paymentRequirements?.scheme ?? null,
    })),
    transport: {
      jsonRpc: "2.0",
      methods: ["initialize", "tools/list", "tools/call"],
      strategy: "http-first",
      type: "streamable-http",
    },
  };
}

function normalizeAbsoluteUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  return url.toString();
}
