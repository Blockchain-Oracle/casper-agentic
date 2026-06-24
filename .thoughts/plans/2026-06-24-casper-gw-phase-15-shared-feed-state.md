# Plan: Casper GW Phase 15 Shared Public Feed State

## Inputs

- `.thoughts/README.md` current gate: Phase 14 is complete; production shared cache/rate-limit hardening is an allowed next slice.
- Phase 13 plan and verification:
  - `.thoughts/plans/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`
  - `.thoughts/verification/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`
- Current code:
  - `src/server/external-action-feed-cache.ts`
  - `src/server/external-action-feed.ts`
  - `src/app/api/explorer/actions/route.ts`
  - `src/db/schema.ts`
  - `tests/unit/external-action-feed.test.ts`
  - `tests/unit/explorer-actions-route.test.ts`
- Prototype reintegration:
  - `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Context7:
  - `/drizzle-team/drizzle-orm-docs`
  - Query: `Drizzle ORM Postgres insert onConflictDoUpdate select delete timestamp jsonb Next.js TypeScript current docs`

## Assumptions

- Postgres is the existing datastore path and is acceptable for a production-style shared feed cache/limiter slice.
- CSPR.cloud remains the source of truth for external WCSPR token actions.
- Runtime must degrade to the existing in-process cache/limiter if Postgres is unavailable, because public explorer proof browsing should fail honestly rather than crash.
- Cache metadata is public; client identity is not public and must stay hashed.

## Open Questions

- No blocking question. A future deployment target may still require Redis or edge-native rate limiting; this phase uses the already accepted Postgres dependency.

## Prototype Reintegration Gate

This is infrastructure hardening only:

- Public explorer remains public.
- External WCSPR rows remain `external_proof`.
- Gateway, policy, and x402 context stay unavailable unless a Casper GW receipt exists.
- No registry/private tools, sandbox, simulated/local modes, OAuth, CSPR.click signing, Mainnet, production custody, or broad design changes.

## Phase 15: Shared Public Feed State

### Goal

Make the public WCSPR feed cache and rate-limit state usable across multiple Node processes by persisting feed pages and rate buckets in Postgres, while retaining the existing in-process path as fallback.

### Work

- Add Drizzle tables and migration for:
  - external feed cache entries keyed by network, payment asset, page, and page size,
  - external feed rate buckets keyed by hashed client identity.
- Add a server-only Postgres-backed store module for:
  - reading fresh/stale feed cache entries,
  - upserting successful CSPR.cloud feed pages,
  - pruning expired feed cache rows,
  - checking and incrementing rate buckets without storing raw client identity,
  - pruning expired rate buckets.
- Update `external-action-feed-cache.ts` so:
  - Postgres state is preferred,
  - existing in-memory maps remain fallback on DB errors,
  - stale fallback still only serves previously real CSPR.cloud rows,
  - public result metadata remains unchanged.
- Update `/api/explorer/actions` only if headers need to reflect shared fallback state; otherwise keep route shape stable.
- Add focused tests for shared cache hit, stale DB fallback, DB-backed rate limiting, and fallback to in-memory behavior when DB operations fail.

### Real Integration Path

The first uncached feed read still calls CSPR.cloud. Only successful CSPR.cloud responses are persisted. Cached and stale responses are labeled through existing cache metadata.

### Mock/Simulation Policy

- Unit tests may mock the shared store and CSPR.cloud.
- Runtime must not fabricate external actions.
- Do not claim x402 settlement or Casper GW receipt context from public feed rows.

### Checks

- Unit tests:
  - shared cache hit avoids CSPR.cloud,
  - shared stale cache serves proof when CSPR.cloud fails,
  - DB-backed rate bucket blocks after limit and does not expose raw identity,
  - DB failure falls back to in-memory path.
- `pnpm db:generate` or equivalent migration creation.
- `pnpm run guard:files`
- `pnpm run guard:product`
- `pnpm run guard:secrets`
- focused tests
- `pnpm run ci`

### Acceptance Criteria Covered

- Public feed resilience improves for multi-process deployments.
- CSPR.cloud is still the source of truth for uncached external actions.
- Client identity remains hashed and is not exposed in API responses, logs, receipts, or explorer UI.
- Product scope stays unchanged.

### Stop Condition

Stop before Redis, edge rate limiting, CSPR.cloud Streaming, public x402 scanner compatibility, OAuth, CSPR.click/browser signing, Mainnet, broad redesign, registry/private tools, simulated/local modes, or production custody.

## Verification Checkpoint

After implementation:

- Write `.thoughts/verification/2026-06-24-casper-gw-phase-15-shared-feed-state.md`.
- Map this plan to schema, migration, code, tests, commands, and reviewer findings.
- Request independent review for proof honesty, DB fallback correctness, identity hashing, product-scope drift, and migration safety.
- Fix blockers before committing.

## Handoff Notes

This phase hardens the existing public WCSPR feed. It intentionally does not implement CSPR.cloud Streaming or broaden explorer indexing beyond the configured payment asset feed.
