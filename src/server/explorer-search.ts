import { buildExternalAccountDetail } from "@/lib/external-account-detail";
import { buildExternalProofDetail } from "@/lib/external-proof-detail";
import type { ExplorerSearchResult, ExplorerSearchSource, ReceiptDetail } from "@/lib/types";
import { CsprCloudClient } from "./cspr-cloud";
import { getRuntimeConfig } from "./env";
import { getReceiptDetail, getReceiptDetailByDeployHash, listReceiptDetailsByWallet } from "./receipt-store";

export async function searchExplorer(rawQuery: string): Promise<ExplorerSearchResult> {
  const parsed = parseQuery(rawQuery);
  const { query } = parsed;
  if (!query) return { message: "Enter a receipt id, deploy hash, or account hash.", query, source: "not_found" };

  if (parsed.kind === "receipt" || parsed.kind === "unknown") {
    const receipt = await getReceiptDetail(query);
    if (receipt) return found("casper_gw_receipt", query, receipt, "Matched Casper GW receipt id.");
  }

  if (parsed.kind === "receipt") {
    return { message: "No Casper GW receipt matched that id.", query, source: "not_found" };
  }

  if (!isHexHash(query)) {
    return { message: "No Casper GW receipt matched that id. Deploy/account search requires a 64-character hex hash.", query, source: "not_found" };
  }

  if (parsed.kind !== "account") {
    const gatewayProof = await getReceiptDetailByDeployHash(query);
    if (gatewayProof) return found("casper_gw_receipt", query, gatewayProof, "Matched Casper GW deploy hash.");
  }

  if (parsed.kind !== "deploy") {
    const accountReceipts = await listReceiptDetailsByWallet(query);
    if (accountReceipts.length) {
      return {
        detail: accountReceipts[0],
        matches: accountReceipts,
        message: `Matched ${accountReceipts.length} Casper GW receipt${accountReceipts.length === 1 ? "" : "s"} for this account.`,
        query,
        source: "casper_gw_account",
      };
    }
  }

  if (parsed.kind !== "account") {
    const deployResult = await lookupExternalDeploy(query);
    if (deployResult.source !== "not_found") return deployResult;
  }

  return lookupExternalAccount(query);
}

function found(source: ExplorerSearchSource, query: string, detail: ReceiptDetail, message: string): ExplorerSearchResult {
  return { detail, message, query, source };
}

async function lookupExternalDeploy(deployHash: string): Promise<ExplorerSearchResult> {
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) {
    return {
      message: "CSPR_CLOUD_API_KEY is required for external Casper proof lookup.",
      query: deployHash,
      source: "unconfigured",
    };
  }

  const client = new CsprCloudClient(config);
  try {
    const deploy = await client.getDeploy(deployHash);
    const ftActions = (await client.getContractPackageTokenActions(config.paymentAsset, deployHash)).filter(
      (action) =>
        action.deploy_hash.toLowerCase() === deployHash.toLowerCase() &&
        action.contract_package_hash.toLowerCase() === config.paymentAsset.toLowerCase(),
    );
    const detail = buildExternalProofDetail({
      deploy,
      explorerUrl: `https://testnet.cspr.live/deploy/${deploy.deploy_hash}`,
      ftActions,
      network: config.casperNetwork,
      paymentAsset: config.paymentAsset,
      paymentAssetSymbol: config.paymentAssetSymbol,
    });
    return found("external_casper_proof", deployHash, detail, "Resolved external Casper deploy proof from CSPR.cloud.");
  } catch {
    return { message: "No Casper GW receipt or external Casper deploy proof matched that hash.", query: deployHash, source: "not_found" };
  }
}

async function lookupExternalAccount(accountHash: string): Promise<ExplorerSearchResult> {
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) {
    return {
      message: "CSPR_CLOUD_API_KEY is required for external Casper account lookup.",
      query: accountHash,
      source: "unconfigured",
    };
  }

  const client = new CsprCloudClient(config);
  try {
    const [accountResult, ownershipResult, actionResult] = await Promise.allSettled([
      client.getAccount(accountHash),
      client.getFTOwnerships(accountHash, config.paymentAsset),
      client.getTokenActions({ accountHash, contractPackageHash: config.paymentAsset }),
    ]);
    const account = accountResult.status === "fulfilled" ? accountResult.value : undefined;
    const ownership = ownershipResult.status === "fulfilled" ? ownershipResult.value[0] : undefined;
    const actions =
      actionResult.status === "fulfilled"
        ? actionResult.value.filter(
            (action) =>
              action.contract_package_hash.toLowerCase() === config.paymentAsset.toLowerCase() &&
              (action.from_hash?.toLowerCase() === accountHash || action.to_hash?.toLowerCase() === accountHash),
          )
        : [];
    if (!account && !ownership && !actions.length) {
      return { message: "No Casper GW receipt or external account proof matched that account hash.", query: accountHash, source: "not_found" };
    }

    const detail = buildExternalAccountDetail({
      account,
      accountHash,
      actions,
      network: config.casperNetwork,
      ownership,
      paymentAsset: config.paymentAsset,
      paymentAssetSymbol: config.paymentAssetSymbol,
    });
    return found("external_account_proof", accountHash, detail, "Resolved external Casper account proof from CSPR.cloud.");
  } catch {
    return { message: "No Casper GW receipt or external account proof matched that account hash.", query: accountHash, source: "not_found" };
  }
}

function parseQuery(rawQuery: string): { kind: "account" | "deploy" | "receipt" | "unknown"; query: string } {
  const raw = rawQuery.trim();
  const match = raw.match(/^(account|wallet|deploy|receipt):(.+)$/i);
  const kind = match?.[1]?.toLowerCase();
  const value = (match?.[2] ?? raw).trim();
  const accountHash = normalizeAccountHash(value);
  const query = accountHash ?? (isHexHash(value) ? value.toLowerCase() : value);
  if (kind === "account" || kind === "wallet") return { kind: "account", query };
  if (kind === "deploy") return { kind: "deploy", query };
  if (kind === "receipt") return { kind: "receipt", query };
  if (accountHash && /^account-hash-/i.test(value)) return { kind: "account", query };
  return { kind: "unknown", query };
}

function isHexHash(query: string) {
  return /^[0-9a-f]{64}$/i.test(query);
}

function normalizeAccountHash(query: string) {
  const match = query.match(/^account-hash-([0-9a-f]{64})$/i);
  return match ? match[1].toLowerCase() : undefined;
}
