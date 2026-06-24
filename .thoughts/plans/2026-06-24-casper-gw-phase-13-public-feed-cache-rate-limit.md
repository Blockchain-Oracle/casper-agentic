# Plan: Casper GW Phase 13 Public Feed Cache And Rate Limit

## Inputs

- `.thoughts/README.md` current gate: Phase 12 is complete; feed rate-limit/streaming planning is an allowed next slice.
- Phase 10 plan and verification: public WCSPR action feed is CSPR.cloud-backed, proof-only, public, and bounded to the configured WCSPR package.
- Current code:
  - `src/server/external-action-feed.ts`
  - `src/app/api/explorer/actions/route.ts`
  - `src/components/explorer/use-external-action-feed.ts`
  - `src/components/explorer/external-action-feed-bar.tsx`
  - `tests/unit/external-action-feed.test.ts`
  - `tests/unit/explorer-actions-route.test.ts`
  - `tests/browser/explorer-feed.spec.ts`
- Local reference:
  - `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md` notes upstream `429` is a provider-limit signal; public discovery/feed paths should report failures explicitly rather than pretending data is empty.
- Context7:
  - `/vercel/next.js/v16.2.9` confirms Route Handlers can create `NextResponse.json()` and set response headers on the response object.

## Assumptions

- This phase protects the existing public feed path. It is not a streaming implementation.
- CSPR.cloud remains the source of truth for external WCSPR token actions.
- In-process cache/rate limiting is acceptable for the local MVP and CI. Production distributed rate limiting can be a later deployment hardening slice.
- Public feed cache metadata is non-sensitive and can be returned to the browser.

## Open Questions

- No blocking questions. Production proxy/IP behavior should be revisited when a hosting target exists.

## Prototype Reintegration Gate

The public explorer remains public infrastructure. This phase keeps the Phase 10 proof model:

- External WCSPR rows are `external_proof`, not Casper GW receipts.
- Gateway, policy, and x402 layers stay unavailable unless a Casper GW receipt exists.
- No registry/private tools, sandbox, simulated/local modes, CSPR.click signing, Mainnet, OAuth, or production custody.

## Phase 13: Public Feed Cache And Rate Limit

### Goal

Reduce repeated CSPR.cloud calls from the public WCSPR feed and fail honestly under burst traffic or upstream failures.

### Work

- Add a server-only feed cache wrapper keyed by network, configured payment asset, page, and page size.
- Serve fresh cached pages without calling CSPR.cloud again.
- Serve stale cached pages only when CSPR.cloud becomes unavailable or a caller is rate-limited and a cached page exists.
- Add a small in-process per-client rate limiter for `/api/explorer/actions`.
- Add response headers for cache/rate status without exposing client identity or secrets.
- Surface cache/rate state in the existing feed result metadata and, minimally, the existing feed UI.

### Real Integration Path

The first uncached request still uses the real CSPR.cloud REST feed. Cache hits and stale fallback reuse previously real CSPR.cloud results only.

### Mock/Simulation Policy

- Unit tests may mock CSPR.cloud and time.
- Product runtime must not fabricate token actions.
- Stale fallback must be labeled as cached/stale metadata, not fresh proof.

### Checks

- Unit tests for:
  - fresh cache hit avoids a second CSPR.cloud call,
  - upstream failure falls back to stale cached proof with explicit metadata,
  - rate-limited requests return cached proof when available,
  - rate-limited requests without cached proof return `429`,
  - route headers include cache and rate-limit state.
- Browser smoke for `/explorer` feed remains public/no-sidebar and displays proof-only feed behavior.
- Full `pnpm run ci`.

### Acceptance Criteria Covered

- Public explorer remains resilient and does not hammer CSPR.cloud for repeated page views.
- Cache/rate behavior is transparent.
- No external action is mislabeled as a Casper GW receipt or settled x402 call.

### Stop Condition

Stop before implementing CSPR.cloud Streaming, static x402 discovery, CSPR.click/browser signing, Mainnet, broad redesign, registry/private tools, simulated/local modes, or production distributed rate limiting.

## Verification Checkpoint

After implementation:

- Write `.thoughts/verification/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`.
- Map this plan to code, tests, commands, and reviewer findings.
- Request independent review for auth leakage, proof honesty, rate-limit correctness, and file-size regressions.
- Fix blockers before committing.

## Handoff Notes

This phase hardens the existing public WCSPR feed. It intentionally leaves CSPR.cloud Streaming and broader explorer indexing as later accepted-plan work.
