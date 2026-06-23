import { normalizeCasperAccountHash } from "./casper-account";
import { CsprCloudClient } from "./cspr-cloud";
import type { RuntimeConfig } from "./env";

export interface WalletReadiness {
  accountHash: string;
  assetBalance: string;
  gasBalance: string;
  network: string;
  paymentAsset: string;
  ready: boolean;
  reason: string;
}

export async function getWalletReadiness(config: RuntimeConfig, accountIdentifier: string) {
  const client = new CsprCloudClient(config);
  const account = await client.getAccount(normalizeCasperAccountHash(accountIdentifier));
  const ownerships = await client.getFTOwnerships(account.account_hash, config.paymentAsset);
  const assetBalance = ownerships[0]?.balance ?? "0";
  const gasBalance = account.balance ?? "0";
  const ready = BigInt(gasBalance) > BigInt(0) && BigInt(assetBalance) >= BigInt(config.paymentAmount);

  return {
    accountHash: account.account_hash,
    assetBalance,
    gasBalance,
    network: config.casperNetwork,
    paymentAsset: config.paymentAsset,
    ready,
    reason: ready ? "gas and payment asset detected" : "requires CSPR gas and WCSPR payment asset",
  } satisfies WalletReadiness;
}
