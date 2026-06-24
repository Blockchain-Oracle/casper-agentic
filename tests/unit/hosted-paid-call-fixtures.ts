import { encodePaymentSignatureHeader } from "@x402/core/http";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";

import type { runHostedPaidToolCall } from "@/server/hosted-paid-call";

export const hostedPaidCallPayerHash = "9accddf69417e3a70e0250e99833dbc7236be6299da01034133d0d2bca01481d";
export const hostedPaidCallPayerAddress = `00${hostedPaidCallPayerHash}`;
export const hostedPaidCallRequestUrl = "https://gw.test/api/mcp/source-1";
export const hostedPaidCallRequirements = {
  amount: "5",
  asset: "asset",
  extra: { name: "Wrapped CSPR", version: "1" },
  maxTimeoutSeconds: 900,
  network: "casper:casper-test",
  payTo: "payee",
  scheme: "exact",
} satisfies PaymentRequirements;

export function hostedPaidCallInput(overrides: Partial<Parameters<typeof runHostedPaidToolCall>[0]> = {}) {
  const endpoint = hostedPaidCallEndpoint();
  return {
    args: { amount: "1" },
    endpoint,
    paymentHeader: encodePaymentSignatureHeader(hostedPaidCallPayload()),
    requestUrl: hostedPaidCallRequestUrl,
    tool: endpoint.tools[0],
    ...overrides,
  };
}

export function hostedPaidCallPayload(): PaymentPayload {
  return {
    accepted: hostedPaidCallRequirements,
    payload: {
      authorization: {
        from: hostedPaidCallPayerAddress,
        nonce: "nonce",
        to: "payee",
        validAfter: "1",
        validBefore: "2",
        value: "5",
      },
      publicKey: "public-key",
      signature: "signature",
    },
    resource: { mimeType: "application/json", url: `${hostedPaidCallRequestUrl}#get_quote` },
    x402Version: 2,
  };
}

export function hostedPaidCallPolicy() {
  return {
    allowedAsset: "asset",
    allowedNetwork: "casper:casper-test",
    allowedTools: ["get_quote"],
    disabled: false,
    maxPerCall: BigInt(5),
  };
}

export function setHostedPaidCallDefaults(mocks: {
  callMcpTool: { mockResolvedValue: (value: unknown) => unknown };
  getAccount: { mockResolvedValue: (value: unknown) => unknown };
  getFTOwnerships: { mockResolvedValue: (value: unknown) => unknown };
  getSpendPolicyForWallet: { mockResolvedValue: (value: unknown) => unknown };
  getWalletDailySpend: { mockResolvedValue: (value: unknown) => unknown };
  persistAttempt: { mockResolvedValue: (value: unknown) => unknown };
  resolveCasperProof: { mockResolvedValue: (value: unknown) => unknown };
  settle: { mockResolvedValue: (value: unknown) => unknown };
  verify: { mockResolvedValue: (value: unknown) => unknown };
}) {
  mocks.persistAttempt.mockResolvedValue({ id: "attempt-1" });
  mocks.verify.mockResolvedValue({ isValid: true, payer: hostedPaidCallPayerAddress });
  mocks.getAccount.mockResolvedValue({ account_hash: hostedPaidCallPayerHash, balance: "10" });
  mocks.getFTOwnerships.mockResolvedValue([{ balance: "10" }]);
  mocks.getSpendPolicyForWallet.mockResolvedValue(hostedPaidCallPolicy());
  mocks.getWalletDailySpend.mockResolvedValue(BigInt(0));
  mocks.settle.mockResolvedValue({
    network: "casper:casper-test",
    payer: hostedPaidCallPayerAddress,
    success: true,
    transaction: "deploy-1",
  });
  mocks.resolveCasperProof.mockResolvedValue({ deploy: { deploy_hash: "deploy-1", status: "processed" } });
  mocks.callMcpTool.mockResolvedValue({
    isError: false,
    result: { content: [{ text: "quote", type: "text" }] },
    text: "quote",
  });
}

function hostedPaidCallEndpoint() {
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
        description: "Quote",
        id: "tool-1",
        inputSchema: {},
        name: "get_quote",
        paymentRequirements: hostedPaidCallRequirements,
        status: "published",
        upstreamTarget: "https://mcp.cspr.trade/mcp#get_quote",
      },
    ],
  };
}
