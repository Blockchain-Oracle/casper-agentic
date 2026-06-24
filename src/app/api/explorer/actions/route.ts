import { NextRequest, NextResponse } from "next/server";

import {
  buildRateLimitedFeed,
  checkExternalActionFeedRateLimit,
  getCachedExternalActionFeed,
} from "@/server/external-action-feed-cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const input = {
    page: request.nextUrl.searchParams.get("page"),
    pageSize: request.nextUrl.searchParams.get("pageSize"),
  };
  const rateLimit = checkExternalActionFeedRateLimit(clientIdentity(request));
  const result = rateLimit.allowed
    ? await getCachedExternalActionFeed(input)
    : await getCachedExternalActionFeed(input, { fetchOnMiss: false }) ?? buildRateLimitedFeed(input);
  const status = responseStatus(result.source);
  const response = NextResponse.json({
    ...result,
    rateLimit: {
      limited: !rateLimit.allowed,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt.toISOString(),
    },
  }, { status });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("x-casper-gw-feed-cache", result.cache?.status ?? "none");
  response.headers.set("x-casper-gw-rate-limit-remaining", String(rateLimit.remaining));
  response.headers.set("x-casper-gw-rate-limit-reset", rateLimit.resetAt.toISOString());
  return response;
}

function responseStatus(source: string) {
  if (source === "rate_limited") return 429;
  return source === "unconfigured" || source === "upstream_error" ? 503 : 200;
}

function clientIdentity(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "anonymous";
}
