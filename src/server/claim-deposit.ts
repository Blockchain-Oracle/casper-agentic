import { getDb } from "@/db/client";
import { keyCredits } from "@/db/schema";

import { normalizeCasperAccountHash } from "./casper-account";
import { CsprCloudClient } from "./cspr-cloud";
import { requireIntegrationConfig } from "./env";

// Credit a prepaid WCSPR deposit to an API key, attributed by deploy hash (CEP-18
// has no memo). The user transfers WCSPR to the gateway payee, then claims that
// deploy hash here; each transfer transform credits exactly once (DB unique
// constraint on deploy_hash+transform_idx). Custodial / Testnet — the balance is a
// claim on the pooled gateway WCSPR. Never credits a pending/failed deploy.

export interface ClaimDepositResult {
  amount?: string;
  deployHash: string;
  fromHash?: string;
  reason?: string;
  status: "credited" | "already_claimed" | "pending" | "no_transfer" | "failed";
}

// Turn raw Casper execution errors into something a user can act on. WCSPR/CEP-18
// user error 60001 = insufficient balance — the #1 cause of a failed funding transfer.
function decodeDeployError(message: string): string {
  if (/\b60001\b/.test(message)) {
    return "Your wallet doesn't have enough WCSPR to send this amount (on-chain error 60001).";
  }
  if (/\b60002\b/.test(message)) {
    return "WCSPR transfer not authorized — insufficient allowance (on-chain error 60002).";
  }
  return message;
}

export async function claimDeposit(keyId: string, deployHash: string): Promise<ClaimDepositResult> {
  const config = requireIntegrationConfig();
  const csprCloud = new CsprCloudClient(config);
  const payee = normalizeCasperAccountHash(config.payeeAccountHash);
  const wcspr = config.paymentAsset;

  let deploy;
  try {
    deploy = await csprCloud.getDeploy(deployHash);
  } catch {
    return { deployHash, reason: "deploy not indexed yet — try again shortly", status: "pending" };
  }
  if (deploy.status !== "processed") return { deployHash, reason: `deploy ${deploy.status}`, status: "pending" };
  if (deploy.error_message) return { deployHash, reason: decodeDeployError(deploy.error_message), status: "failed" };

  const actions = await csprCloud.getContractPackageTokenActions(wcspr, deployHash);
  const inbound = actions.filter(
    (action) => action.contract_package_hash === wcspr && action.to_hash?.toLowerCase() === payee,
  );
  if (!inbound.length) {
    return { deployHash, reason: "no WCSPR transfer to the gateway in this deploy", status: "no_transfer" };
  }

  let credited = BigInt(0);
  let fromHash: string | undefined;
  for (const action of inbound) {
    const [row] = await getDb()
      .insert(keyCredits)
      .values({
        amount: action.amount,
        deployHash,
        fromHash: action.from_hash ?? null,
        keyId,
        transformIdx: action.transform_idx,
      })
      .onConflictDoNothing({ target: [keyCredits.deployHash, keyCredits.transformIdx] })
      .returning();
    if (row) {
      credited += BigInt(action.amount);
      fromHash = action.from_hash ?? fromHash;
    }
  }

  if (credited === BigInt(0)) return { deployHash, reason: "deposit already credited", status: "already_claimed" };
  return { amount: credited.toString(), deployHash, fromHash, status: "credited" };
}
