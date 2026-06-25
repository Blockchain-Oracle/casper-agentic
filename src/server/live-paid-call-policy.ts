import type { RuntimeConfig } from "./env";
import { evaluateSpendPolicy } from "./policy";
import { getSpendPolicyForWallet, getWalletDailySpend } from "./spend-policy-store";

export async function evaluateLivePaidCallPolicy(input: {
  assetBalance: bigint;
  config: RuntimeConfig;
  gasBalance: bigint;
  toolName: string;
  walletAccountHash: string;
}) {
  const storedPolicy = await getSpendPolicyForWallet(input.walletAccountHash);
  const dailySpent = storedPolicy?.dailyLimit
    ? await getWalletDailySpend(input.walletAccountHash, input.config.paymentAsset, input.config.casperNetwork)
    : BigInt(0);
  const policy = storedPolicy
    ? evaluateSpendPolicy({
        allowedAsset: storedPolicy.allowedAsset,
        allowedNetwork: storedPolicy.allowedNetwork,
        allowedTools: storedPolicy.allowedTools,
        assetBalance: input.assetBalance,
        dailyLimit: storedPolicy.dailyLimit,
        dailySpent,
        disabled: storedPolicy.disabled,
        gasBalance: input.gasBalance,
        maxPerCall: storedPolicy.maxPerCall,
        network: input.config.casperNetwork,
        paymentAmount: BigInt(input.config.paymentAmount),
        paymentAsset: input.config.paymentAsset,
        sessionLimit: storedPolicy.sessionLimit,
        sessionSpent: BigInt(0),
        toolName: input.toolName,
      })
    : { allowed: false, reason: "no active spend policy for wallet" };

  return {
    evidence: {
      assetBalance: input.assetBalance.toString(),
      dailyLimit: storedPolicy?.dailyLimit?.toString(),
      dailySpent: dailySpent.toString(),
      gasBalance: input.gasBalance.toString(),
      policyLoaded: Boolean(storedPolicy),
      sessionLimit: storedPolicy?.sessionLimit?.toString(),
      toolName: input.toolName,
    },
    policy,
  };
}
