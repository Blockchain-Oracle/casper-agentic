import { buildExternalActionDetail } from "@/lib/external-action-detail";
import type { ExternalActionFeedResult, ReceiptHistoryPagination } from "@/lib/types";

import { CsprCloudClient, type CsprCloudFTAction } from "./cspr-cloud";
import { getRuntimeConfig } from "./env";

export interface ExternalActionFeedInput {
  page?: number | string | null;
  pageSize?: number | string | null;
}

const DEFAULT_ACTION_FEED_PAGE_SIZE = 4;
const MAX_ACTION_FEED_PAGE = 1000;
const MAX_ACTION_FEED_PAGE_SIZE = 25;

export async function getExternalActionFeed(input: ExternalActionFeedInput = {}): Promise<ExternalActionFeedResult> {
  const normalized = normalizeExternalActionFeedInput(input);
  const config = getRuntimeConfig();
  const emptyPagination = toPagination(normalized.page, normalized.pageSize, 0, 1);
  if (!config.csprCloudApiKey) {
    return emptyFeed("CSPR_CLOUD_API_KEY is required for the external WCSPR feed.", "unconfigured", emptyPagination);
  }

  const client = new CsprCloudClient(config);
  try {
    let actionPage = await client.getTokenActionsPage({
      contractPackageHash: config.paymentAsset,
      page: normalized.page,
      pageSize: normalized.pageSize,
    });
    const reportedTotalPages = Math.max(1, actionPage.pageCount);
    if (normalized.page > reportedTotalPages) {
      actionPage = await client.getTokenActionsPage({
        contractPackageHash: config.paymentAsset,
        page: reportedTotalPages,
        pageSize: normalized.pageSize,
      });
    }

    const totalPages = Math.max(1, actionPage.pageCount);
    const page = Math.min(normalized.page, totalPages);
    const pagination = toPagination(page, normalized.pageSize, actionPage.itemCount, totalPages);
    const pageInfo = {
      page,
      pageSize: normalized.pageSize,
      totalCount: actionPage.itemCount,
      totalPages,
    };
    const actions = actionPage.data.filter((action) => actionMatchesPackage(action, config.paymentAsset));
    const matches = actions.map((action) =>
      buildExternalActionDetail({
        action,
        actionPage: pageInfo,
        network: config.casperNetwork,
        paymentAsset: config.paymentAsset,
        paymentAssetSymbol: config.paymentAssetSymbol,
      }),
    );

    return {
      detail: matches[0],
      matches,
      message: `Resolved ${actionPage.itemCount} external ${config.paymentAssetSymbol} action${
        actionPage.itemCount === 1 ? "" : "s"
      } for the configured payment asset through CSPR.cloud.`,
      network: config.casperNetwork,
      pagination,
      source: "cspr_cloud",
    };
  } catch {
    return emptyFeed(
      "CSPR.cloud external WCSPR action feed is unavailable.",
      "upstream_error",
      emptyPagination,
      config.casperNetwork,
    );
  }
}

export function normalizeExternalActionFeedInput(input: ExternalActionFeedInput) {
  return {
    page: boundedInt(input.page, 1, 1, MAX_ACTION_FEED_PAGE),
    pageSize: boundedInt(input.pageSize, DEFAULT_ACTION_FEED_PAGE_SIZE, 1, MAX_ACTION_FEED_PAGE_SIZE),
  };
}

function emptyFeed(
  message: string,
  source: ExternalActionFeedResult["source"],
  pagination: ReceiptHistoryPagination,
  network = "casper:casper-test",
): ExternalActionFeedResult {
  return { matches: [], message, network, pagination, source };
}

function actionMatchesPackage(action: CsprCloudFTAction, paymentAsset: string) {
  return action.contract_package_hash.toLowerCase() === paymentAsset.toLowerCase();
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

function boundedInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
