import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicKey, payerAddress, payerHash, payeeAddress, requirements } from "./browser-x402-signing-fixtures";
import {
  expectNoBrowserSigningIntent,
  setBrowserPaymentIntentDefaults,
  type BrowserIntentMocks,
} from "./browser-payment-intent-fixtures";

const mocks = vi.hoisted<BrowserIntentMocks>(() => ({
  buildPaymentRequirements: vi.fn(),
  discoverMcpTools: vi.fn(),
  getAccount: vi.fn(),
  getAgentWalletRecord: vi.fn(),
  getFTOwnerships: vi.fn(),
  getSpendPolicyForWallet: vi.fn(),
  getWalletDailySpend: vi.fn(),
  hasDatabaseUrl: vi.fn(),
  persistAttempt: vi.fn(),
  persistAudit: vi.fn(),
  persistPolicyDecision: vi.fn(),
  updateAttemptStatus: vi.fn(),
}));

vi.mock("@/db/client", () => ({ hasDatabaseUrl: mocks.hasDatabaseUrl }));

vi.mock("@/server/env", () => ({
  getRuntimeConfig: () => ({
    casperNetwork: "casper:casper-test",
    csprCloudApiKey: "cspr-cloud-token",
    csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
    facilitatorUrl: "https://x402-facilitator.cspr.cloud",
    mcpUrl: "https://mcp.cspr.trade/mcp",
    paymentAmount: requirements.amount,
    paymentAsset: requirements.asset,
    paymentAssetDecimals: 9,
    paymentAssetName: "Wrapped CSPR",
    paymentAssetSymbol: "WCSPR",
    paymentTimeoutSeconds: 900,
    payeeAccountHash: payeeAddress,
  }),
}));

vi.mock("@/server/cspr-cloud", () => ({
  CsprCloudClient: vi.fn().mockImplementation(function CsprCloudClient() {
    return {
      getAccount: mocks.getAccount,
      getFTOwnerships: mocks.getFTOwnerships,
    };
  }),
}));

vi.mock("@/server/mcp-client", () => ({ discoverMcpTools: mocks.discoverMcpTools }));
vi.mock("@/server/wallet-store", () => ({ getAgentWalletRecord: mocks.getAgentWalletRecord }));
vi.mock("@/server/spend-policy-store", () => ({
  getSpendPolicyForWallet: mocks.getSpendPolicyForWallet,
  getWalletDailySpend: mocks.getWalletDailySpend,
}));
vi.mock("@/server/receipt-store", () => ({
  persistAttempt: mocks.persistAttempt,
  persistAudit: mocks.persistAudit,
  persistPolicyDecision: mocks.persistPolicyDecision,
  updateAttemptStatus: mocks.updateAttemptStatus,
}));
vi.mock("@/server/x402-payment", () => ({ buildPaymentRequirements: mocks.buildPaymentRequirements }));

import { createBrowserPaymentIntent } from "@/server/browser-payment-intent";
import { hashPaidCallInput } from "@/server/paid-call-input-hash";

describe("browser payment intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setBrowserPaymentIntentDefaults(mocks);
  });

  it("returns redacted CSPR.click typed-data params only after policy allows", async () => {
    const result = await createBrowserPaymentIntent({
      args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result).toMatchObject({
      attemptId: "attempt-1",
      paymentRequirements: requirements,
      policy: { allowed: true, reason: "policy allowed before signing/payment" },
      resource: { url: "https://mcp.cspr.trade/mcp#get_quote" },
      status: "ready_for_signature",
      wallet: { accountHash: payerHash, id: "wallet-1", publicKey },
      x402Version: 2,
    });
    expect(result.status).toBe("ready_for_signature");
    if (result.status !== "ready_for_signature") throw new Error("expected ready browser payment intent");
    expect(result.signing.signTypedDataParams).toMatchObject({
      options: {
        returnHashArtifacts: true,
      },
      typedData: {
        domain: {
          chain_name: requirements.network,
          contract_package_hash: `0x${requirements.asset}`,
          name: "Wrapped CSPR",
          version: "1",
        },
        message: {
          from: `0x${payerAddress}`,
          to: `0x${payeeAddress}`,
          value: Number(requirements.amount),
        },
        primaryType: "TransferWithAuthorization",
      },
    });
    expect(result.signing.signTypedDataParams.options?.domainTypes).toContainEqual({
      name: "contract_package_hash",
      type: "bytes32",
    });
    for (const secret of ["cspr-cloud-token", "pem", "tokenHash"]) expect(JSON.stringify(result)).not.toContain(secret);
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
      "attempt-1",
      true,
      "policy allowed before signing/payment",
      expect.objectContaining({
        browserPaymentIntent: {
          inputHash: hashPaidCallInput({ amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" }),
        },
        policyLoaded: true,
        toolName: "get_quote",
      }),
    );
    expect(mocks.persistAudit).toHaveBeenCalledWith(
      "attempt-1",
      "info",
      "Browser payment intent ready after policy",
      expect.objectContaining({ signingMode: "browser-wallet" }),
    );
    expect(mocks.updateAttemptStatus).not.toHaveBeenCalled();
  });

  it("blocks without signing params when spend policy fails", async () => {
    mocks.getSpendPolicyForWallet.mockResolvedValue(null);

    const result = await createBrowserPaymentIntent({
      args: { amount: "10" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result).toMatchObject({
      attemptId: "attempt-1",
      policy: { allowed: false, reason: "no active spend policy for wallet" },
      status: "blocked",
    });
    expectNoBrowserSigningIntent(result);
    expect(mocks.persistPolicyDecision).toHaveBeenCalledTimes(1);
    expect(mocks.persistPolicyDecision).toHaveBeenCalledWith(
      "attempt-1",
      false,
      "no active spend policy for wallet",
      expect.objectContaining({ policyLoaded: false }),
    );
    expect(mocks.updateAttemptStatus).toHaveBeenCalledWith("attempt-1", "blocked", "no active spend policy for wallet");
    expect(mocks.persistAudit).toHaveBeenCalledWith(
      "attempt-1",
      "block",
      "Spend policy blocked before browser signing",
      { reason: "no active spend policy for wallet" },
    );
  });

  it("blocks before CSPR.cloud readiness when the selected wallet cannot use browser signing", async () => {
    mocks.getAgentWalletRecord.mockResolvedValue({
      accountHash: payerHash,
      id: "wallet-1",
      label: "Integration signer",
      network: "casper:casper-test",
      publicKey,
      signingMode: "test-signer",
    });

    const result = await createBrowserPaymentIntent({
      args: { amount: "10" },
      endpointUrl: "https://mcp.cspr.trade/mcp",
      toolName: "get_quote",
      walletId: "wallet-1",
    });

    expect(result).toMatchObject({
      attemptId: "attempt-1",
      policy: { allowed: false, reason: "selected wallet is not configured for browser signing" },
      status: "blocked",
    });
    expectNoBrowserSigningIntent(result);
    expect(mocks.getAccount).not.toHaveBeenCalled();
    expect(mocks.getFTOwnerships).not.toHaveBeenCalled();
  });
});
