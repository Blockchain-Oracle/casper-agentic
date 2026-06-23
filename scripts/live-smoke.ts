import { loadEnvConfig } from "@next/env";

import { closeDb } from "../src/db/client";
import { normalizeCasperAccountHash } from "../src/server/casper-account";
import { requireIntegrationConfig } from "../src/server/env";
import { runLivePaidToolCall } from "../src/server/live-paid-call";
import { createSpendPolicy, getEffectiveSpendPolicyViewForWallet } from "../src/server/spend-policy-store";
import { createAgentWallet, listAgentWallets } from "../src/server/wallet-store";
import { getConfiguredSignerAddress } from "../src/server/x402-payment";

loadEnvConfig(process.cwd());

async function main() {
  const config = requireIntegrationConfig();
  const signerHash = normalizeCasperAccountHash(getConfiguredSignerAddress(config));
  const wallet = await ensureSignerWallet(signerHash, config.casperNetwork);
  await ensureAllowPolicy(wallet.id, signerHash, config);
  const result = await runLivePaidToolCall({
    args: { amount: "10", token_in: "CSPR", token_out: "WCSPR", type: "exact_in" },
    endpointUrl: config.mcpUrl,
    toolName: "get_quote",
    walletId: wallet.id,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "settled") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDb();
});

async function ensureSignerWallet(accountHash: string, network: string) {
  const wallets = await listAgentWallets();
  const existing = wallets.find((wallet) => normalizeCasperAccountHash(wallet.accountHash) === accountHash);
  if (existing) return existing;
  return createAgentWallet({
    accountHash,
    label: "Phase 3 Testnet signer",
    network,
    signingMode: "test-signer",
  });
}

async function ensureAllowPolicy(
  walletId: string,
  accountHash: string,
  config: ReturnType<typeof requireIntegrationConfig>,
) {
  const current = await getEffectiveSpendPolicyViewForWallet(accountHash);
  const paymentAmount = BigInt(config.paymentAmount);
  const currentMax = current ? BigInt(current.maxPerCall) : BigInt(0);
  const acceptsTool = current?.allowedTools.includes("get_quote") ?? false;
  if (current && !current.disabled && currentMax >= paymentAmount && acceptsTool) return current;

  return createSpendPolicy({
    allowedAsset: config.paymentAsset,
    allowedNetwork: config.casperNetwork,
    allowedTools: ["get_quote"],
    maxPerCall: config.paymentAmount,
    walletId,
  });
}
