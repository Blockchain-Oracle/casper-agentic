import { expect, type Mock } from "vitest";

import { publicKey, payerHash, payeeAddress, requirements } from "./browser-x402-signing-fixtures";

export type BrowserIntentMocks = {
  buildPaymentRequirements: Mock;
  discoverMcpTools: Mock;
  getAccount: Mock;
  getAgentWalletRecord: Mock;
  getFTOwnerships: Mock;
  getSpendPolicyForWallet: Mock;
  getWalletDailySpend: Mock;
  hasDatabaseUrl: Mock;
  persistAttempt: Mock;
  persistAudit: Mock;
  persistPolicyDecision: Mock;
  updateAttemptStatus: Mock;
};

export function browserIntentStoredPolicy(overrides: Record<string, unknown> = {}) {
  return {
    allowedAsset: requirements.asset,
    allowedNetwork: requirements.network,
    allowedTools: ["get_quote"],
    disabled: false,
    maxPerCall: BigInt(requirements.amount),
    ...overrides,
  };
}

export function setBrowserPaymentIntentDefaults(mocks: BrowserIntentMocks) {
  mocks.hasDatabaseUrl.mockReturnValue(true);
  mocks.discoverMcpTools.mockResolvedValue([{ name: "get_quote" }]);
  mocks.getAgentWalletRecord.mockResolvedValue({
    accountHash: payerHash,
    id: "wallet-1",
    label: "Browser wallet",
    network: "casper:casper-test",
    publicKey,
    signingMode: "browser-wallet",
  });
  mocks.getAccount.mockResolvedValue({ account_hash: payerHash, balance: "10" });
  mocks.getFTOwnerships.mockResolvedValue([{ balance: "10" }]);
  mocks.getWalletDailySpend.mockResolvedValue(BigInt(0));
  mocks.getSpendPolicyForWallet.mockResolvedValue(browserIntentStoredPolicy());
  mocks.buildPaymentRequirements.mockReturnValue({ ...requirements, payTo: payeeAddress });
  mocks.persistAttempt.mockResolvedValue({ id: "attempt-1" });
}

export function expectNoBrowserSigningIntent(result: unknown) {
  expect(result).not.toHaveProperty("signing");
  expect(result).not.toHaveProperty("paymentPayload");
  expect(JSON.stringify(result)).not.toContain("signTypedDataParams");
}
