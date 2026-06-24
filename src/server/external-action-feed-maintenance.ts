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

export async function runFeedStatePrune(options: { allowMissingDatabase?: boolean; now?: number } = {}) {
  if (!hasDatabaseUrl() && !options.allowMissingDatabase) {
    throw new Error("DATABASE_URL is required to prune shared public feed state.");
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
