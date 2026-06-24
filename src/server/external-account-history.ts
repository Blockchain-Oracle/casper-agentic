import { buildExternalAccountDetail } from "@/lib/external-account-detail";
import type { ExternalAccountHistoryResult, ReceiptHistoryPagination } from "@/lib/types";

import { CsprCloudClient, type CsprCloudFTAction } from "./cspr-cloud";
import { getRuntimeConfig } from "./env";

export interface ExternalAccountHistoryInput {
  accountHash: string;
  page?: number | string | null;
  pageSize?: number | string | null;
}

const DEFAULT_EXTERNAL_ACTION_PAGE_SIZE = 4;
const MAX_EXTERNAL_ACTION_PAGE = 1000;
const MAX_EXTERNAL_ACTION_PAGE_SIZE = 25;

export async function getExternalAccountHistory(
  input: ExternalAccountHistoryInput,
): Promise<ExternalAccountHistoryResult> {
  const normalized = normalizeExternalAccountHistoryInput(input);
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) {
    return emptyExternalResult(
      normalized.accountHash,
      "CSPR_CLOUD_API_KEY is required for external account history.",
      "unconfigured",
      undefined,
      config.casperNetwork,
    );
  }

  const client = new CsprCloudClient(config);
  try {
    const [accountResult, ownershipResult, actionResult] = await Promise.allSettled([
      client.getAccount(normalized.accountHash),
      client.getFTOwnerships(normalized.accountHash, config.paymentAsset),
      client.getTokenActionsPage({
        accountHash: normalized.accountHash,
        contractPackageHash: config.paymentAsset,
        page: normalized.page,
        pageSize: normalized.pageSize,
      }),
    ]);
    if (actionResult.status === "rejected") {
      return emptyExternalResult(
        normalized.accountHash,
        "CSPR.cloud external account action history is unavailable.",
        "upstream_error",
        toPagination(normalized.page, normalized.pageSize, 0, 1),
        config.casperNetwork,
      );
    }

    const account = accountResult.status === "fulfilled" ? accountResult.value : undefined;
    const ownership = ownershipResult.status === "fulfilled" ? ownershipResult.value[0] : undefined;
    let actionPage = actionResult.value;
    const reportedTotalPages = Math.max(1, actionPage.pageCount);
    if (normalized.page > reportedTotalPages) {
      actionPage = await client.getTokenActionsPage({
        accountHash: normalized.accountHash,
        contractPackageHash: config.paymentAsset,
        page: reportedTotalPages,
        pageSize: normalized.pageSize,
      });
    }
    const actions = actionPage.data.filter((action) => actionMatchesAccount(action, normalized.accountHash, config.paymentAsset));
    const totalCount = actionPage.itemCount;
    const totalPages = Math.max(1, actionPage.pageCount);
    const page = Math.min(normalized.page, totalPages);
    const pagination = toPagination(page, normalized.pageSize, totalCount, totalPages);

    if (!account && !ownership && totalCount === 0) {
      return emptyExternalResult(
        normalized.accountHash,
        "No external account proof matched that account hash.",
        "not_found",
        pagination,
        config.casperNetwork,
      );
    }

    const pageInfo = {
      page,
      pageSize: normalized.pageSize,
      totalCount,
      totalPages,
    };
    const overview = buildExternalAccountDetail({
      account,
      accountHash: normalized.accountHash,
      actionPage: pageInfo,
      actions,
      network: config.casperNetwork,
      ownership,
      paymentAsset: config.paymentAsset,
      paymentAssetSymbol: config.paymentAssetSymbol,
      receiptId: `account:${normalized.accountHash}:page:${normalized.page}`,
    });
    const matches = actions.length
      ? actions.map((action) =>
          buildExternalAccountDetail({
            account,
            accountHash: normalized.accountHash,
            actionPage: pageInfo,
            actions: [action],
            network: config.casperNetwork,
            ownership,
            paymentAsset: config.paymentAsset,
            paymentAssetSymbol: config.paymentAssetSymbol,
            receiptId: externalActionId(normalized.accountHash, action),
          }),
        )
      : [overview];

    return {
      accountHash: normalized.accountHash,
      detail: matches[0] ?? overview,
      matches,
      message: `Resolved ${totalCount} external ${config.paymentAssetSymbol} action${
        totalCount === 1 ? "" : "s"
      } for this account through CSPR.cloud.`,
      network: config.casperNetwork,
      pagination,
      source: "cspr_cloud",
    };
  } catch {
    return emptyExternalResult(
      normalized.accountHash,
      "CSPR.cloud external account action history is unavailable.",
      "upstream_error",
      undefined,
      config.casperNetwork,
    );
  }
}

export function normalizeExternalAccountHistoryInput(input: ExternalAccountHistoryInput) {
  return {
    accountHash: normalizeAccountHash(input.accountHash),
    page: boundedInt(input.page, 1, 1, MAX_EXTERNAL_ACTION_PAGE),
    pageSize: boundedInt(input.pageSize, DEFAULT_EXTERNAL_ACTION_PAGE_SIZE, 1, MAX_EXTERNAL_ACTION_PAGE_SIZE),
  };
}

function emptyExternalResult(
  accountHash: string,
  message: string,
  source: ExternalAccountHistoryResult["source"],
  pagination = toPagination(1, DEFAULT_EXTERNAL_ACTION_PAGE_SIZE, 0, 1),
  network = "casper:casper-test",
): ExternalAccountHistoryResult {
  return { accountHash, matches: [], message, network, pagination, source };
}

function actionMatchesAccount(action: CsprCloudFTAction, accountHash: string, paymentAsset: string) {
  return (
    action.contract_package_hash.toLowerCase() === paymentAsset.toLowerCase() &&
    (action.from_hash?.toLowerCase() === accountHash || action.to_hash?.toLowerCase() === accountHash)
  );
}

function externalActionId(accountHash: string, action: CsprCloudFTAction) {
  return `external-account:${accountHash}:${action.deploy_hash}:${action.transform_idx}`;
}

function toPagination(
  page: number,
  pageSize: number,
  totalCount: number,
  totalPages = Math.max(1, Math.ceil(totalCount / pageSize)),
): ReceiptHistoryPagination {
  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize,
    totalCount,
    totalPages,
  };
}

function normalizeAccountHash(value: string) {
  const prefixed = value.match(/^account-hash-([0-9a-f]{64})$/i);
  return (prefixed?.[1] ?? value).toLowerCase();
}

function boundedInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
