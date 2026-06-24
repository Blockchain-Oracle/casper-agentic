import { hasDatabaseUrl } from "@/db/client";

import {
  pruneSharedExternalActionFeedState,
  type ExternalActionFeedPruneResult,
} from "./external-action-feed-state";

export interface FeedStatePruneOutput {
  cacheEntriesDeleted: number;
  databaseConfigured: boolean;
  prunedAt: string;
  rateBucketsDeleted: number;
}

export interface FeedStatePruneFailureOutput {
  error: FeedStatePruneErrorCode;
  message: string;
}

export type FeedStatePruneErrorCode = "database_url_required" | "feed_state_prune_failed";

const DATABASE_URL_REQUIRED_MESSAGE = "DATABASE_URL is required to prune shared public feed state.";
const GENERIC_PRUNE_FAILURE_MESSAGE = "Failed to prune shared public feed state.";

export class FeedStatePruneMaintenanceError extends Error {
  constructor(readonly code: FeedStatePruneErrorCode, message: string) {
    super(message);
    this.name = "FeedStatePruneMaintenanceError";
  }
}

export async function runFeedStatePrune(options: { allowMissingDatabase?: boolean; now?: number } = {}) {
  if (!hasDatabaseUrl() && !options.allowMissingDatabase) {
    throw new FeedStatePruneMaintenanceError("database_url_required", DATABASE_URL_REQUIRED_MESSAGE);
  }
  return formatFeedStatePruneResult(await pruneSharedExternalActionFeedState(options.now));
}

export function formatFeedStatePruneResult(result: ExternalActionFeedPruneResult): FeedStatePruneOutput {
  return {
    cacheEntriesDeleted: result.cacheEntriesDeleted,
    databaseConfigured: result.databaseConfigured,
    prunedAt: result.prunedAt.toISOString(),
    rateBucketsDeleted: result.rateBucketsDeleted,
  };
}

export function formatFeedStatePruneError(error: unknown): FeedStatePruneFailureOutput {
  if (error instanceof FeedStatePruneMaintenanceError) {
    return {
      error: error.code,
      message: error.message,
    };
  }

  return {
    error: "feed_state_prune_failed",
    message: GENERIC_PRUNE_FAILURE_MESSAGE,
  };
}
