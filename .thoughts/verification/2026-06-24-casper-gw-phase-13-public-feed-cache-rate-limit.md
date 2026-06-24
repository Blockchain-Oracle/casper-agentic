# Verification: Casper GW Phase 13 Public Feed Cache And Rate Limit

## Scope

Phase 13 hardens the existing public WCSPR action feed. It does not add streaming, static x402 discovery, registry/private tools, sandbox modes, CSPR.click signing, Mainnet, OAuth, or production custody.

Implemented:

- In-process cache wrapper for public WCSPR feed reads.
- Fresh cache hits avoid repeated CSPR.cloud calls.
- Stale cached proof can be served when CSPR.cloud is unavailable.
- In-process per-client route rate limit for `/api/explorer/actions`.
- Rate-limited requests return cached proof when available; otherwise they return `429` with `source: "rate_limited"`.
- Public route headers expose cache/rate state without exposing client identity or secrets.
- The route uses `Cache-Control: no-store`; the cache is server-side only so per-client rate metadata cannot be replayed by a shared CDN cache.
- Feed UI shows a small `cache hit/miss/stale` chip while keeping proof-only language unchanged.

Not implemented:

- CSPR.cloud Streaming.
- Distributed production rate limiting.
- Static OpenAPI or `/.well-known/x402` discovery.
- Any new settlement or live payment path.

## Evidence Sources

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`
- Phase 10 plan and audit:
  - `.thoughts/plans/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`
  - `.thoughts/verification/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`
- Local x402scan discovery reference:
  - `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`
- Context7:
  - `/vercel/next.js/v16.2.9`
  - Query: `Route Handler NextResponse JSON response headers status Cache-Control`

## Code Mapping

- `src/server/external-action-feed-cache.ts`
  - Adds cache keying by network, configured payment asset, page, and page size.
  - Adds fresh cache hits, stale fallback, rate-limit buckets, and reset helper for tests.
  - Hashes client identities before storing rate buckets in memory.
- `src/app/api/explorer/actions/route.ts`
  - Uses the cached feed wrapper.
  - Applies per-client in-process rate limiting.
  - Returns `Cache-Control`, `x-casper-gw-feed-cache`, `x-casper-gw-rate-limit-remaining`, and `x-casper-gw-rate-limit-reset` headers.
  - Serializes public rate metadata as `{ limited, remaining, resetAt }`.
- `src/lib/types.ts`
  - Adds optional feed cache/rate metadata and `rate_limited` source.
- `src/components/explorer/external-action-feed-bar.tsx`
  - Shows cache state as metadata only.

## Proof Honesty

- Cached rows are previously real CSPR.cloud rows only.
- Stale fallback is labeled with `cache.status: "stale"`.
- Rate-limited responses without cached proof return no rows and `source: "rate_limited"`.
- Responses are `no-store` at the HTTP layer; shared caches should not reuse per-client rate-limit metadata.
- External rows remain `external_proof`; gateway, policy, and x402 layers stay unavailable unless a separate Casper GW receipt exists.

## Test Evidence

Focused unit tests:

```bash
pnpm exec vitest run tests/unit/external-action-feed.test.ts tests/unit/explorer-actions-route.test.ts
```

Result: 2 files passed, 13 tests passed.

Focused browser:

```bash
pnpm exec playwright test tests/browser/explorer-feed.spec.ts
```

Result: 2 tests passed across desktop and mobile.

Static gates:

```bash
pnpm run guard:files
pnpm run guard:product
pnpm run guard:secrets
pnpm typecheck
pnpm lint
```

Result: passed. No new source file crossed the 200-line warning threshold; existing warning-size files remain under the 300-line hard cap.

Full tests and build:

```bash
pnpm test
pnpm run test:browser
pnpm build
```

Result:

- Unit tests: 30 files passed, 142 tests passed.
- Browser tests: 18 passed, 2 intentional mobile skips.
- Build: passed.

Aggregate gate:

```bash
pnpm run ci
```

Result: passed.

- Frozen install: passed.
- Verify: passed.
- Browser tests: 18 passed, 2 intentional mobile skips.
- Build: passed.

Note: an earlier parallel browser/build run hit Next.js build-lock contention. Sequential browser and aggregate CI runs passed.

## Live Non-Spending Smoke

First smoke without sourcing `.env.local` returned `unconfigured`, as expected.

Second smoke sourced `.env.local` and called the new cache wrapper twice:

- First request: `source: "cspr_cloud"`, `cache: "miss"`, total actions `4888`, rows `2`.
- Second request: `source: "cspr_cloud"`, `cache: "hit"`, rows `2`.
- First returned receipt id: `external-action:93612407db7afca86b94cc2c360bfe29d51161568e96a982082c3e5ee6a529e2:16`.
- No spending occurred.

## Acceptance Mapping

- Public explorer remains resilient and avoids repeated CSPR.cloud calls for repeated page reads: satisfied by cache wrapper tests and live smoke.
- Cache/rate behavior is transparent: satisfied by result metadata, route headers, and browser cache chip.
- No external action is mislabeled as Casper GW/x402 settlement: existing proof-only browser checks and Phase 10 detail model remain intact.

## Residual Risk

- In-process cache and rate buckets are local to a Node process. A production multi-instance deployment needs a shared limiter/cache if abuse protection becomes a launch requirement.
- Client identity depends on `x-forwarded-for` / `x-real-ip` proxy headers. Hosting proxy behavior should be verified after deployment target selection.
- CSPR.cloud Streaming remains deferred.

## Independent Review

Reviewer agent `Curie` reviewed the first Phase 13 diff and found one blocker plus one should-fix:

- Blocker: successful feed responses were marked public-cacheable while including per-client rate-limit metadata. This could let a shared cache replay one client response to another client and bypass the route limiter.
- Should-fix: route JSON returned `{ allowed, remaining, resetAt }` while the public type expected `{ limited, remaining, resetAt }`.

Fixes applied:

- `/api/explorer/actions` now always returns `Cache-Control: no-store`; the feed cache is server-side only.
- Route JSON now serializes `rateLimit: { limited, remaining, resetAt }`.
- Route tests assert `no-store` and the public `rateLimit` shape.
- The feed UI can show a `rate limited` chip when `rateLimit.limited` is true.

Follow-up review:

- `Curie` confirmed no blockers or should-fix findings remain.
- Focused tests and product/secret/file guards passed in the follow-up review.
- Full `pnpm run ci` also passed locally after the fix.
