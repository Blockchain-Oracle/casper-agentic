import { eq, lt, sql } from "drizzle-orm";
import { createHash } from "node:crypto";

import { getDb, hasDatabaseUrl } from "@/db/client";
import { externalActionFeedCacheEntries, externalActionFeedRateBuckets } from "@/db/schema";
import type { ExternalActionFeedResult } from "@/lib/types";

import { getRuntimeConfig } from "./env";
import { normalizeExternalActionFeedInput, type ExternalActionFeedInput } from "./external-action-feed";
import type { ExternalActionFeedRateLimit } from "./external-action-feed-cache";

export interface StoredExternalActionFeedCacheEntry {
  createdAt: number;
  result: ExternalActionFeedResult;
  staleUntil: number;
}

export interface ExternalActionFeedPruneResult {
  cacheEntriesDeleted: number;
  databaseConfigured: boolean;
  prunedAt: Date;
  rateBucketsDeleted: number;
}

export function externalActionFeedCacheKey(input: ExternalActionFeedInput) {
  const normalized = normalizeExternalActionFeedInput(input);
  const config = getRuntimeConfig();
  return [
    config.casperNetwork,
    config.paymentAsset.toLowerCase(),
    normalized.page,
    normalized.pageSize,
  ].join(":");
}

export async function readSharedExternalActionFeedCache(input: ExternalActionFeedInput, now: number) {
  if (!hasDatabaseUrl()) return null;
  const key = externalActionFeedCacheKey(input);
  const [row] = await getDb()
    .select()
    .from(externalActionFeedCacheEntries)
    .where(eq(externalActionFeedCacheEntries.cacheKey, key))
    .limit(1);
  if (!row) return null;
  if (row.staleUntil.getTime() < now) {
    await deleteSharedExternalActionFeedCache(input);
    return null;
  }
  return {
    createdAt: row.createdAt.getTime(),
    result: row.result as ExternalActionFeedResult,
    staleUntil: row.staleUntil.getTime(),
  };
}

export async function writeSharedExternalActionFeedCache(input: ExternalActionFeedInput, entry: StoredExternalActionFeedCacheEntry) {
  if (!hasDatabaseUrl()) return;
  const normalized = normalizeExternalActionFeedInput(input);
  const config = getRuntimeConfig();
  const now = new Date(entry.createdAt);
  await getDb()
    .insert(externalActionFeedCacheEntries)
    .values({
      cacheKey: externalActionFeedCacheKey(input),
      createdAt: now,
      network: config.casperNetwork,
      page: normalized.page,
      pageSize: normalized.pageSize,
      paymentAsset: config.paymentAsset.toLowerCase(),
      result: entry.result,
      staleUntil: new Date(entry.staleUntil),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: externalActionFeedCacheEntries.cacheKey,
      set: {
        createdAt: now,
        network: config.casperNetwork,
        page: normalized.page,
        pageSize: normalized.pageSize,
        paymentAsset: config.paymentAsset.toLowerCase(),
        result: entry.result,
        staleUntil: new Date(entry.staleUntil),
        updatedAt: now,
      },
    });
}

export async function deleteSharedExternalActionFeedCache(input: ExternalActionFeedInput) {
  if (!hasDatabaseUrl()) return;
  await getDb()
    .delete(externalActionFeedCacheEntries)
    .where(eq(externalActionFeedCacheEntries.cacheKey, externalActionFeedCacheKey(input)));
}

export async function pruneSharedExternalActionFeedState(now = Date.now()): Promise<ExternalActionFeedPruneResult> {
  if (!hasDatabaseUrl()) {
    return {
      cacheEntriesDeleted: 0,
      databaseConfigured: false,
      prunedAt: new Date(now),
      rateBucketsDeleted: 0,
    };
  }
  const cutoff = new Date(now);
  const cacheRows = await getDb()
    .delete(externalActionFeedCacheEntries)
    .where(lt(externalActionFeedCacheEntries.staleUntil, cutoff))
    .returning({ cacheKey: externalActionFeedCacheEntries.cacheKey });
  const bucketRows = await getDb()
    .delete(externalActionFeedRateBuckets)
    .where(lt(externalActionFeedRateBuckets.resetAt, cutoff))
    .returning({ identityHash: externalActionFeedRateBuckets.identityHash });

  return {
    cacheEntriesDeleted: cacheRows.length,
    databaseConfigured: true,
    prunedAt: cutoff,
    rateBucketsDeleted: bucketRows.length,
  };
}

export async function checkSharedExternalActionFeedRateLimit(
  identity: string,
  options: { limit?: number; now?: number; windowMs?: number } = {},
): Promise<ExternalActionFeedRateLimit | null> {
  if (!hasDatabaseUrl()) return null;
  const limit = options.limit ?? 30;
  const now = options.now ?? Date.now();
  const windowMs = options.windowMs ?? 60_000;
  if (limit <= 0) return { allowed: true, remaining: 0, resetAt: new Date(now + windowMs) };

  const nowDate = new Date(now);
  const nextResetAt = new Date(now + windowMs);
  const [bucket] = await getDb()
    .insert(externalActionFeedRateBuckets)
    .values({
      count: 1,
      createdAt: nowDate,
      identityHash: externalActionFeedRateIdentity(identity),
      resetAt: nextResetAt,
      updatedAt: nowDate,
    })
    .onConflictDoUpdate({
      target: externalActionFeedRateBuckets.identityHash,
      set: {
        count: sql<number>`case when ${externalActionFeedRateBuckets.resetAt} <= ${nowDate} then 1 else ${externalActionFeedRateBuckets.count} + 1 end`,
        resetAt: sql<Date>`case when ${externalActionFeedRateBuckets.resetAt} <= ${nowDate} then ${nextResetAt} else ${externalActionFeedRateBuckets.resetAt} end`,
        updatedAt: nowDate,
      },
    })
    .returning({
      count: externalActionFeedRateBuckets.count,
      resetAt: externalActionFeedRateBuckets.resetAt,
    });

  const count = bucket?.count ?? 1;
  const resetAt = bucket?.resetAt ?? nextResetAt;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

export function externalActionFeedRateIdentity(identity: string) {
  return createHash("sha256").update(identity || "anonymous").digest("hex");
}
