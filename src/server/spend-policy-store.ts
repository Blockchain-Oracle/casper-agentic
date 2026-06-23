import { desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/client";
import { agentWallets, spendPolicies } from "@/db/schema";

import { casperAccountAliases } from "./casper-account";

export interface StoredSpendPolicy {
  allowedAsset: string;
  allowedNetwork: string;
  allowedTools: string[];
  disabled: boolean;
  maxPerCall: bigint;
}

export async function getSpendPolicyForWallet(accountHash: string): Promise<StoredSpendPolicy | null> {
  const aliases = casperAccountAliases(accountHash);
  const [wallet] = await getDb()
    .select()
    .from(agentWallets)
    .where(inArray(agentWallets.accountHash, aliases))
    .limit(1);
  if (!wallet) return null;

  const [policy] = await getDb()
    .select()
    .from(spendPolicies)
    .where(eq(spendPolicies.walletId, wallet.id))
    .orderBy(desc(spendPolicies.createdAt))
    .limit(1);
  if (!policy) return null;

  return {
    allowedAsset: policy.allowedAsset,
    allowedNetwork: policy.allowedNetwork,
    allowedTools: Array.isArray(policy.allowedTools) ? policy.allowedTools.filter(isString) : [],
    disabled: policy.disabled,
    maxPerCall: BigInt(policy.maxPerCall),
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
