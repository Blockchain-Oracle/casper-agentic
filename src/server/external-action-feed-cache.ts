import type { ExternalActionFeedResult, ReceiptHistoryPagination } from "@/lib/types";

import { getRuntimeConfig } from "./env";
import {
  getExternalActionFeed,
  normalizeExternalActionFeedInput,
  type ExternalActionFeedInput,
} from "./external-action-feed";
import {
  checkSharedExternalActionFeedRateLimit,
  externalActionFeedCacheKey,
  externalActionFeedRateIdentity,
  readSharedExternalActionFeedCache,
  writeSharedExternalActionFeedCache,
} from "./external-action-feed-state";

const CACHE_TTL_MS = 30_000;
const STALE_TTL_MS = 5 * 60_000;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface CacheEntry {
  createdAt: number;
  result: ExternalActionFeedResult;
  staleUntil: number;
}

interface RateBucket {
  count: number;
  resetAt: number;
}

export interface ExternalActionFeedRateLimit {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

const cache = new Map<string, CacheEntry>();
const rateBuckets = new Map<string, RateBucket>();

export function getCachedExternalActionFeed(
  input?: ExternalActionFeedInput,
  options?: { fetchOnMiss?: true; now?: number },
): Promise<ExternalActionFeedResult>;
export function getCachedExternalActionFeed(
  input: ExternalActionFeedInput | undefined,
  options: { fetchOnMiss: false; now?: number },
): Promise<ExternalActionFeedResult | null>;
export async function getCachedExternalActionFeed(
  input: ExternalActionFeedInput = {},
  options: { fetchOnMiss?: boolean; now?: number } = {},
): Promise<ExternalActionFeedResult | null> {
  const now = options.now ?? Date.now();
  const key = externalActionFeedCacheKey(input);
  const shared = await readSharedCache(input, now);
  if (shared && now - shared.createdAt <= CACHE_TTL_MS) {
    return withCache(shared.result, "hit", shared.createdAt);
  }

  const entry = cache.get(key);
  if (entry && now - entry.createdAt <= CACHE_TTL_MS) {
    return withCache(entry.result, "hit", entry.createdAt);
  }
  if (options.fetchOnMiss === false) {
    const stale = staleEntry(shared, now) ?? staleEntry(entry, now);
    return stale ? withCache(stale.result, "stale", stale.createdAt) : null;
  }

  const result = await getExternalActionFeed(input);
  if (result.source === "cspr_cloud") {
    const nextEntry = { createdAt: now, result, staleUntil: now + STALE_TTL_MS };
    cache.set(key, nextEntry);
    await writeSharedCache(input, nextEntry);
    return withCache(result, "miss", now);
  }
  const stale = staleEntry(shared, now) ?? staleEntry(entry, now);
  if (result.source === "upstream_error" && stale) {
    return withCache(
      {
        ...stale.result,
        message: `${stale.result.message} Cached because CSPR.cloud is currently unavailable.`,
      },
      "stale",
      stale.createdAt,
    );
  }
  return withCache(result, "miss", now);
}

export async function checkExternalActionFeedRateLimit(
  identity: string,
  options: { limit?: number; now?: number; windowMs?: number } = {},
): Promise<ExternalActionFeedRateLimit> {
  const shared = await checkSharedRateLimit(identity, options);
  if (shared) return shared;
  return checkMemoryRateLimit(identity, options);
}

export function checkMemoryRateLimit(
  identity: string,
  options: { limit?: number; now?: number; windowMs?: number } = {},
) {
  const limit = options.limit ?? RATE_LIMIT_MAX;
  const now = options.now ?? Date.now();
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS;
  if (limit <= 0) return { allowed: true, remaining: 0, resetAt: new Date(now + windowMs) };

  const key = externalActionFeedRateIdentity(identity);
  const current = rateBuckets.get(key);
  const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + windowMs };
  if (bucket.count >= limit) {
    rateBuckets.set(key, bucket);
    return { allowed: false, remaining: 0, resetAt: new Date(bucket.resetAt) };
  }

  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return { allowed: true, remaining: Math.max(0, limit - bucket.count), resetAt: new Date(bucket.resetAt) };
}

export function buildRateLimitedFeed(input: ExternalActionFeedInput = {}): ExternalActionFeedResult {
  const normalized = normalizeExternalActionFeedInput(input);
  const config = getRuntimeConfig();
  return {
    matches: [],
    message: "External WCSPR feed rate limit reached. Retry after the reset time.",
    network: config.casperNetwork,
    pagination: toPagination(normalized.page, normalized.pageSize),
    source: "rate_limited",
  };
}

export function resetExternalActionFeedRuntimeState() {
  cache.clear();
  rateBuckets.clear();
}

function withCache(
  result: ExternalActionFeedResult,
  status: NonNullable<ExternalActionFeedResult["cache"]>["status"],
  generatedAt: number,
): ExternalActionFeedResult {
  return {
    ...result,
    cache: {
      generatedAt: new Date(generatedAt).toISOString(),
      status,
      ttlSeconds: Math.ceil(CACHE_TTL_MS / 1000),
    },
  };
}

function staleEntry(entry: CacheEntry | null | undefined, now: number) {
  return entry && now <= entry.staleUntil ? entry : null;
}

async function readSharedCache(input: ExternalActionFeedInput, now: number) {
  try {
    return await readSharedExternalActionFeedCache(input, now);
  } catch {
    return null;
  }
}

async function writeSharedCache(input: ExternalActionFeedInput, entry: CacheEntry) {
  try {
    await writeSharedExternalActionFeedCache(input, entry);
  } catch {
    // In-process state remains the fallback when Postgres is unavailable.
  }
}

async function checkSharedRateLimit(
  identity: string,
  options: { limit?: number; now?: number; windowMs?: number },
) {
  try {
    return await checkSharedExternalActionFeedRateLimit(identity, options);
  } catch {
    return null;
  }
}

function toPagination(page: number, pageSize: number): ReceiptHistoryPagination {
  return {
    hasNextPage: false,
    hasPreviousPage: page > 1,
    page,
    pageSize,
    totalCount: 0,
    totalPages: 1,
  };
}
