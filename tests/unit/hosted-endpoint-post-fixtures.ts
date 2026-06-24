import { NextRequest } from "next/server";

export function hostedEndpointPostRequest(init: { body: unknown; paymentSignature?: string }) {
  const headers = new Headers({
    authorization: "Bearer cgw_test_limited",
    "content-type": "application/json",
  });
  if (init.paymentSignature) headers.set("payment-signature", init.paymentSignature);

  return new NextRequest("https://gw.test/api/mcp/source-1", {
    body: JSON.stringify(init.body),
    headers,
    method: "POST",
  });
}

export function hostedEndpointPostView() {
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
        inputSchema: {
          properties: { amount: { type: "string" } },
          type: "object",
        },
        name: "get_quote",
        paymentRequirements: {
          amount: "7500000000",
          asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
          extra: { decimals: "9", name: "Wrapped CSPR", symbol: "WCSPR", version: "1" },
          maxTimeoutSeconds: 900,
          network: "casper:casper-test",
          payTo: "009accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d",
          scheme: "exact",
        },
        status: "published",
        upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
      },
    ],
  };
}
