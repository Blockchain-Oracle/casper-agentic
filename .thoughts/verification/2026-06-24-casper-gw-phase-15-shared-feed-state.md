# Verification Audit: Casper GW Phase 15 Shared Public Feed State

## Verdict

Pass.

This audit verifies Phase 15 only: Postgres-backed shared state for the public WCSPR action feed cache and rate limiter. It does not verify CSPR.cloud Streaming, public x402 scanner compatibility, OAuth, CSPR.click/browser signing, Mainnet, Redis/edge limiting, production custody, or broader explorer indexing.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-15-shared-feed-state.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Context7 Drizzle docs: `/drizzle-team/drizzle-orm-docs`
- Changed files:
  - `src/db/schema.ts`
  - `drizzle/0002_first_shatterstar.sql`
  - `drizzle/meta/0002_snapshot.json`
  - `drizzle/meta/_journal.json`
  - `src/server/external-action-feed-state.ts`
  - `src/server/external-action-feed-cache.ts`
  - `src/app/api/explorer/actions/route.ts`
  - `tests/unit/external-action-feed.test.ts`
  - `tests/unit/external-action-feed-shared-state.test.ts`

## Requirement Traceability

| Requirement | Evidence | Result |
| --- | --- | --- |
| Persist public feed cache entries in Postgres. | `externalActionFeedCacheEntries` table in `src/db/schema.ts`; generated migration `drizzle/0002_first_shatterstar.sql`; `writeSharedExternalActionFeedCache` upserts successful CSPR.cloud results. | Pass |
| Persist public feed rate buckets in Postgres without raw identity. | `externalActionFeedRateBuckets` stores `identity_hash`, count, and reset time only; `externalActionFeedRateIdentity` hashes the identity before storage. | Pass |
| Prefer shared state but fall back to in-process behavior on DB errors. | `external-action-feed-cache.ts` wraps shared reads/writes/limiter in catch blocks and returns to memory maps when shared state is missing or unavailable. | Pass |
| Only persist real successful CSPR.cloud feed pages. | `getCachedExternalActionFeed` writes shared cache only when `result.source === "cspr_cloud"`. | Pass |
| Serve stale rows honestly. | Stale shared or memory rows are returned only with `cache.status: "stale"` and an explicit CSPR.cloud unavailable message. | Pass |
| Keep route/API shape stable. | `/api/explorer/actions` still returns the existing result body, `rateLimit`, and cache/rate headers; only `checkExternalActionFeedRateLimit` is now awaited. | Pass |
| Preserve public explorer proof boundaries. | No receipt/payment/provider tables were changed. Feed rows remain external CSPR.cloud proof rows, not Casper GW receipts or x402 settlement proof. | Pass |
| Stop before deferred product surfaces. | No streaming, public scanner route, OAuth, CSPR.click signing, Mainnet, registry/private tools, sandbox, simulated/local modes, or custody changes were added. | Pass |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
| --- | --- |
| Public feed resilience improves for multi-process deployments. | Two separate live smoke processes: first returned `cache: "miss"`, second returned `cache: "hit"` for the same WCSPR page. |
| CSPR.cloud remains the source of truth for uncached rows. | The first live smoke returned `source: "cspr_cloud"` with 2 rows and total 4888 actions; cache persistence occurs only after successful CSPR.cloud result. |
| Client identity remains hashed and unexposed. | Shared rate smoke blocked the second request and reported `rawIdentityExposed: false`; tests assert raw IP is absent from returned limiter objects. |
| Product scope stays unchanged. | `pnpm run guard:product` passed; no banned product surfaces are present in active source. |
| Migration is scoped. | `drizzle/0002_first_shatterstar.sql` creates only `external_action_feed_cache_entries` and `external_action_feed_rate_buckets`. |

## Quality Gates

- `pnpm db:generate`: passed and created `drizzle/0002_first_shatterstar.sql`.
- `pnpm db:migrate`: passed against local default Postgres.
- Focused tests:
  - `pnpm exec vitest run tests/unit/external-action-feed.test.ts tests/unit/external-action-feed-shared-state.test.ts tests/unit/explorer-actions-route.test.ts`
  - Passed: 3 files, 16 tests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm run guard:files`: passed with pre-existing warnings only.
- `pnpm run guard:product`: passed.
- `pnpm run guard:secrets`: passed.
- `pnpm run ci`: passed.
  - Unit tests: 32 files, 148 tests passed.
  - Browser tests: 18 passed, 2 intentional mobile skips.
  - `next build`: passed.

Pre-existing file-size warnings remain:

- `src/app/api/mcp/[sourceId]/route.ts`
- `src/components/screens/test-console-screen.tsx`
- `src/server/hosted-paid-call.ts`
- `src/server/live-paid-call.ts`
- `tests/unit/explorer-search.test.ts`
- `tests/unit/hosted-endpoint-post-routes.test.ts`
- `tests/unit/hosted-paid-call.test.ts`
- `tests/unit/live-paid-call.test.ts`

New Phase 15 source/test files are below the warning threshold:

- `src/server/external-action-feed-state.ts`: 141 lines.
- `src/server/external-action-feed-cache.ts`: 194 lines.
- `tests/unit/external-action-feed.test.ts`: 182 lines.
- `tests/unit/external-action-feed-shared-state.test.ts`: 113 lines.

## Deviations From Plan

- No route response header was added for shared-vs-memory state. The public API shape stayed stable because cache status already covers `hit`, `miss`, and `stale`, and exposing storage backend is not user-facing value.
- Redis and edge-native limiting remain deferred as planned.

## Gaps And Risks

- Postgres rate buckets increment even for over-limit attempts until the reset window. This is acceptable for enforcement and avoids raw identity storage, but a future production limiter may prefer a stricter atomic SQL policy with cap semantics.
- Shared cache is still a cache of CSPR.cloud data, not a chain indexer and not an x402 settlement feed.
- `pruneSharedExternalActionFeedState()` is available but not scheduled in this slice. A production deployment should run it periodically or through an operational job so old cache/rate rows do not accumulate.

## Follow-ups

- Update `.thoughts/README.md` after the final reviewer verdict and commit hash are known.
- If a deployment target requires edge/global limiting, create a separate Context Engineering plan for Redis or provider-native rate limiting.
- Add a scheduled pruning job once deployment/runtime scheduling is chosen.

## Evidence Log

- Context7 Drizzle docs confirmed current Postgres `pgTable`, timestamp/jsonb columns, and `onConflictDoUpdate` upsert patterns.
- Local migration applied successfully.
- Live non-spending shared cache smoke:
  - Process 1: `{ cache: "miss", rows: 2, source: "cspr_cloud", total: 4888 }`
  - Process 2: `{ cache: "hit", rows: 2, source: "cspr_cloud", total: 4888 }`
- Live non-spending shared rate smoke:
  - First: `{ allowed: true, remaining: 0 }`
  - Second: `{ allowed: false, remaining: 0 }`
  - `rawIdentityExposed: false`
- Independent review from sub-agent `Nash` reported no Blocking or Should-fix findings.
