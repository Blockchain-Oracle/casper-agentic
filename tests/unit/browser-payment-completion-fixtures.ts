import type { Mock } from "vitest";

import { browserSigningInput, payerHash } from "./browser-x402-signing-fixtures";

import { hashPaidCallInput } from "@/server/paid-call-input-hash";
import { buildBrowserX402PaymentPayload } from "@/lib/browser-x402-signing";
import type { PaymentPayload } from "@x402/core/types";

export type BrowserCompletionMocks = {
  buildPaymentRequirements: Mock;
  callMcpTool: Mock;
  getAccount: Mock;
  getFTOwnerships: Mock;
  getPaidCallAttempt: Mock;
  getLatestPolicyDecisionForAttempt: Mock;
  getSpendPolicyForWallet: Mock;
  getWalletDailySpend: Mock;
  hasDatabaseUrl: Mock;
  persistAudit: Mock;
  persistCasperProof: Mock;
  persistPolicyDecision: Mock;
  persistX402Record: Mock;
  resolveCasperProof: Mock;
  settle: Mock;
  updateAttemptStatus: Mock;
  verify: Mock;
};

const browserCompletionResult = buildBrowserX402PaymentPayload(browserSigningInput());
if (browserCompletionResult.status !== "signed") throw new Error("browser completion fixture must sign");
export const browserCompletionPayload: PaymentPayload = browserCompletionResult.paymentPayload;

export function browserCompletionInput(overrides: Record<string, unknown> = {}) {
  return {
    args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
    attemptId: "attempt-1",
    endpointUrl: "https://mcp.cspr.trade/mcp",
    paymentPayload: browserCompletionPayload,
    toolName: "get_quote",
    ...overrides,
  };
}

export function setBrowserCompletionDefaults(mocks: BrowserCompletionMocks) {
  mocks.hasDatabaseUrl.mockReturnValue(true);
  mocks.getPaidCallAttempt.mockResolvedValue({
    client: "csprclick-browser-intent",
    id: "attempt-1",
    status: "policy_pending",
    toolName: "get_quote",
    walletAccountHash: payerHash,
  });
  mocks.getLatestPolicyDecisionForAttempt.mockResolvedValue({
    allowed: true,
    evaluatedPolicy: {
      browserPaymentIntent: {
        inputHash: hashPaidCallInput(browserCompletionInput().args),
      },
    },
    reason: "policy allowed before signing/payment",
  });
  mocks.getAccount.mockResolvedValue({ account_hash: payerHash, balance: "10" });
  mocks.getFTOwnerships.mockResolvedValue([{ balance: "10" }]);
  mocks.getWalletDailySpend.mockResolvedValue(BigInt(0));
  mocks.getSpendPolicyForWallet.mockResolvedValue({
    allowedAsset: "asset",
    allowedNetwork: "casper:casper-test",
    allowedTools: ["get_quote"],
    dailyLimit: BigInt(100),
    disabled: false,
    maxPerCall: BigInt(5),
  });
  mocks.buildPaymentRequirements.mockReturnValue({
    amount: "5",
    asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
    extra: { name: "Wrapped CSPR", version: "1" },
    maxTimeoutSeconds: 900,
    network: "casper:casper-test",
    payTo: "00aa35d1c9dcaadea97c34d79b55b6af07aa9d760e5dd1aabf78a45fb39e0723fa",
    scheme: "exact",
  });
  mocks.verify.mockResolvedValue({
    isValid: true,
    payer: `00${payerHash}`,
  });
  mocks.settle.mockResolvedValue({ success: true, transaction: "deploy-1" });
  mocks.resolveCasperProof.mockResolvedValue({
    deploy: { deploy_hash: "deploy-1", status: "processed" },
    ftAction: { amount: "5" },
  });
  mocks.callMcpTool.mockResolvedValue({ isError: false, result: { quote: "ok" }, text: "quote" });
}
