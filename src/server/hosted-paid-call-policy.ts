import type { PaymentRequirements } from "@x402/core/types";

import { CsprCloudClient } from "./cspr-cloud";
import { evaluateSpendPolicy } from "./policy";
import { getSpendPolicyForWallet, getWalletDailySpend } from "./spend-policy-store";
import type { HostedSettlementConfig } from "./hosted-settlement-config";

export async function evaluateHostedPolicy(input: {
  config: HostedSettlementConfig;
  payer: string;
  requirements: PaymentRequirements;
  toolName: string;
}) {
  const csprCloud = new CsprCloudClient(input.config);
  const account = await csprCloud.getAccount(input.payer);
  const ownerships = await csprCloud.getFTOwnerships(account.account_hash, input.requirements.asset);
  const assetBalance = BigInt(ownerships[0]?.balance ?? "0");
  const gasBalance = BigInt(account.balance ?? "0");
  const storedPolicy = await getSpendPolicyForWallet(input.payer);
  const dailySpent = storedPolicy?.dailyLimit
    ? await getWalletDailySpend(input.payer, input.requirements.asset, input.requirements.network)
    : BigInt(0);
  const decision = storedPolicy
    ? evaluateSpendPolicy({
        allowedAsset: storedPolicy.allowedAsset,
        allowedNetwork: storedPolicy.allowedNetwork,
        allowedTools: storedPolicy.allowedTools,
        assetBalance,
        dailyLimit: storedPolicy.dailyLimit,
        dailySpent,
        disabled: storedPolicy.disabled,
        gasBalance,
        maxPerCall: storedPolicy.maxPerCall,
        network: input.requirements.network,
        paymentAmount: BigInt(input.requirements.amount),
        paymentAsset: input.requirements.asset,
        sessionLimit: storedPolicy.sessionLimit,
        sessionSpent: BigInt(0),
        toolName: input.toolName,
      })
    : { allowed: false, reason: "no active spend policy for wallet" };

  const reason =
    decision.allowed && decision.reason === "policy allowed before signing/payment"
      ? "policy allowed before settlement"
      : decision.reason;

  return {
    ...decision,
    reason,
    evidence: {
      assetBalance: assetBalance.toString(),
      dailyLimit: storedPolicy?.dailyLimit?.toString(),
      dailySpent: dailySpent.toString(),
      gasBalance: gasBalance.toString(),
      policyLoaded: Boolean(storedPolicy),
      sessionLimit: storedPolicy?.sessionLimit?.toString(),
      toolName: input.toolName,
    },
  };
}
