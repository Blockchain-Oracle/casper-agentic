import { buildExternalProofDetail } from "@/lib/external-proof-detail";
import type { ExternalAccountHistoryResult, ExplorerSearchResult, ExplorerSearchSource, ReceiptDetail } from "@/lib/types";
import { CsprCloudClient } from "./cspr-cloud";
import { getRuntimeConfig } from "./env";
import { getExternalAccountHistory } from "./external-account-history";
import { isHexHash, parseExplorerQuery, resolveAccountIdentifier } from "./explorer-identifiers";
import { getReceiptDetail, getReceiptDetailByDeployHash, listReceiptDetailsByWallet } from "./receipt-store";

export interface ExplorerSearchOptions {
  externalPage?: number | string | null;
  externalPageSize?: number | string | null;
}

export async function searchExplorer(rawQuery: string, options: ExplorerSearchOptions = {}): Promise<ExplorerSearchResult> {
  const parsed = parseExplorerQuery(rawQuery);
  const { query } = parsed;
  if (!query) return { message: "Enter a receipt id, deploy hash, or account hash.", query, source: "not_found" };

  if (parsed.kind === "public_key" || parsed.kind === "cspr_name") {
    const resolved = await resolveAccountIdentifier(parsed);
    if (resolved.source !== "resolved") return { message: resolved.message, query, source: resolved.source };
    return (
      (await searchAccount(resolved.accountHash, options, resolved.message)) ?? {
        message: `${resolved.message} No Casper GW receipt or external account proof matched that account hash.`,
        query: resolved.accountHash,
        source: "not_found",
      }
    );
  }

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
    const accountResult = await searchAccount(query, options, "", parsed.kind === "account");
    if (accountResult) return accountResult;
  }

  if (parsed.kind !== "account") {
    const deployResult = await lookupExternalDeploy(query);
    if (deployResult.source !== "not_found") return deployResult;
  }

  const externalAccount = await lookupExternalAccountHistory(query, options);
  return externalAccountResult(query, externalAccount);
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

async function lookupExternalAccountHistory(accountHash: string, options: ExplorerSearchOptions) {
  return getExternalAccountHistory({
    accountHash,
    page: options.externalPage,
    pageSize: options.externalPageSize,
  });
}

async function searchAccount(
  accountHash: string,
  options: ExplorerSearchOptions,
  messagePrefix = "",
  includeExternal = true,
): Promise<ExplorerSearchResult | undefined> {
  const accountReceipts = await listReceiptDetailsByWallet(accountHash);
  const externalAccount = includeExternal ? await lookupExternalAccountHistory(accountHash, options) : undefined;
  const prefix = messagePrefix ? `${messagePrefix} ` : "";
  if (accountReceipts.length) {
    return {
      detail: accountReceipts[0],
      ...(externalAccount && externalAccount.source !== "not_found" ? { externalAccount } : {}),
      matches: accountReceipts,
      message: `${prefix}Matched ${accountReceipts.length} Casper GW receipt${
        accountReceipts.length === 1 ? "" : "s"
      } for this account.`,
      query: accountHash,
      source: "casper_gw_account",
    };
  }
  if (externalAccount) return externalAccountResult(accountHash, externalAccount, messagePrefix);
  return undefined;
}

function externalAccountResult(
  query: string,
  externalAccount: ExternalAccountHistoryResult,
  messagePrefix = "",
): ExplorerSearchResult {
  const prefix = messagePrefix ? `${messagePrefix} ` : "";
  if (externalAccount.source === "cspr_cloud") {
    return {
      detail: externalAccount.detail,
      externalAccount,
      matches: externalAccount.matches,
      message: `${prefix}${externalAccount.message}`,
      query,
      source: "external_account_proof",
    };
  }
  if (externalAccount.source === "unconfigured") {
    return { externalAccount, message: `${prefix}${externalAccount.message}`, query, source: "unconfigured" };
  }
  if (externalAccount.source === "upstream_error") {
    return { externalAccount, message: `${prefix}${externalAccount.message}`, query, source: "upstream_error" };
  }
  return {
    externalAccount,
    message: `${prefix}No Casper GW receipt or external account proof matched that account hash.`,
    query,
    source: "not_found",
  };
}
