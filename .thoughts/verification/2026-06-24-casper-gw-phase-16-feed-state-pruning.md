# Verification Audit: Casper GW Phase 16 Feed State Pruning

## Verdict

Passed. Local implementation, focused tests, maintenance command checks, full CI, and independent review passed.

This audit verifies Phase 16 only: deterministic pruning for expired shared public feed cache rows and shared rate buckets. It does not verify hosted deployment scheduling, public maintenance APIs, CSPR.cloud Streaming, public x402 scanner compatibility, OAuth, CSPR.click/browser signing, Mainnet, or production custody.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-16-feed-state-pruning.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-15-shared-feed-state.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-15-shared-feed-state.md`
- Local references:
  - `.thoughts/raw/repos/x402scan/apps/scan/src/lib/cron.ts`
  - `.thoughts/raw/repos/x402scan/apps/scan/src/app/api/cron/warm-cache/route.ts`
  - `.thoughts/raw/repos/Cards402/backend/test/integration/jobs.test.js`
- Changed files:
  - `src/server/external-action-feed-state.ts`
  - `src/server/external-action-feed-maintenance.ts`
  - `scripts/prune-external-feed-state.ts`
  - `tests/unit/external-action-feed-maintenance.test.ts`
  - `.github/workflows/prune-feed-state.yml`
  - `package.json`

## Requirement Traceability

| Requirement | Evidence | Result |
| --- | --- | --- |
| Return aggregate prune counts and database configuration state. | `pruneSharedExternalActionFeedState()` now returns `cacheEntriesDeleted`, `rateBucketsDeleted`, `databaseConfigured`, and `prunedAt`. | Pass |
| Delete only expired shared feed state. | Pruning deletes rows where `staleUntil < cutoff` for cache entries and `resetAt < cutoff` for rate buckets. | Pass |
| Provide deterministic maintenance command. | `scripts/prune-external-feed-state.ts` loads env, calls `runFeedStatePrune()`, prints JSON aggregate output, and closes DB. | Pass |
| Fail loudly when `DATABASE_URL` is missing. | `runFeedStatePrune()` throws unless `allowMissingDatabase` is explicitly set; CLI check was run with `DATABASE_URL=` and failed with the expected message. | Pass |
| Avoid secret/raw identity/payload leakage. | Output shape contains only counts, databaseConfigured, and timestamp; unit tests assert no connection string, raw identity, deploy payload, or CSPR.cloud key appears. | Pass |
| Add scheduler shape without affecting normal PR CI. | `.github/workflows/prune-feed-state.yml` runs only on `workflow_dispatch` and hourly schedule, requires `DATABASE_URL` secret, and is not part of normal `pull_request` CI. | Pass |
| Keep public explorer behavior unchanged. | No public routes, UI, explorer, receipt, provider, payment, or x402 files were changed. | Pass |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
| --- | --- |
| Expired shared feed state can be cleaned without manual SQL. | `pnpm maintenance:prune-feed` ran locally and deleted 2 cache entries, 0 rate buckets. |
| Misconfigured scheduler runs fail safely. | `DATABASE_URL= pnpm maintenance:prune-feed` exited non-zero and printed `DATABASE_URL is required to prune shared public feed state.` |
| Explicit no-database no-op exists for local validation. | `DATABASE_URL= pnpm maintenance:prune-feed --allow-missing-database` returned zero counts with `databaseConfigured: false`. |
| No secrets or raw identities are exposed in maintenance output. | Unit tests check output for absence of `postgres://`, `203.0.113.10`, `deploy_hash`, and `CSPR_CLOUD_API_KEY`; secret guard passed. |
| Public explorer remains unchanged. | Full browser smoke passed after the maintenance changes. |

## Quality Gates

- Focused tests:
  - `pnpm exec vitest run tests/unit/external-action-feed-maintenance.test.ts tests/unit/external-action-feed-shared-state.test.ts tests/unit/external-action-feed.test.ts`
  - Passed: 3 files, 16 tests.
- Maintenance command:
  - `pnpm maintenance:prune-feed`
  - Passed with aggregate output:
    - `cacheEntriesDeleted: 2`
    - `databaseConfigured: true`
    - `rateBucketsDeleted: 0`
- Explicit no-database no-op:
  - `DATABASE_URL= pnpm maintenance:prune-feed --allow-missing-database`
  - Passed with zero counts and `databaseConfigured: false`.
- Missing database failure:
  - `DATABASE_URL= pnpm maintenance:prune-feed; test $? -ne 0`
  - Passed by failing the command as expected.
- Static gates:
  - `pnpm typecheck`: passed.
  - `pnpm lint`: passed.
  - `pnpm run guard:files`: passed with pre-existing warnings only.
  - `pnpm run guard:product`: passed.
  - `pnpm run guard:secrets`: passed.
- Full CI:
  - `pnpm run ci`: passed.
  - Unit tests: 33 files, 152 tests passed.
  - Browser tests: 18 passed, 2 intentional mobile skips.
  - `next build`: passed.
- Independent review:
  - Reviewer `Fermat` reported no Blocking or Should-fix findings.
  - Reviewer verified destructive scope, scheduler safety, aggregate-only output, and product-scope boundaries.

Pre-existing file-size warnings remain:

- `src/app/api/mcp/[sourceId]/route.ts`
- `src/components/screens/test-console-screen.tsx`
- `src/server/hosted-paid-call.ts`
- `src/server/live-paid-call.ts`
- `tests/unit/explorer-search.test.ts`
- `tests/unit/hosted-endpoint-post-routes.test.ts`
- `tests/unit/hosted-paid-call.test.ts`
- `tests/unit/live-paid-call.test.ts`

New Phase 16 files are below the warning threshold:

- `src/server/external-action-feed-maintenance.ts`: 29 lines.
- `scripts/prune-external-feed-state.ts`: 19 lines.
- `tests/unit/external-action-feed-maintenance.test.ts`: 83 lines.
- `.github/workflows/prune-feed-state.yml`: 37 lines.
- `src/server/external-action-feed-state.ts`: 168 lines.

## Deviations From Plan

- A scheduled GitHub Actions workflow was added as an optional scheduler shape. It is gated by `DATABASE_URL` secret and only runs on `workflow_dispatch` or schedule, not on PR CI.
- No Vercel Cron route was added because there is no accepted deployment target and the plan explicitly stopped before deployment-specific scheduler setup.

## Gaps And Risks

- The scheduled GitHub workflow cannot be proven remotely because this checkout has no GitHub remote configured.
- If a future deployment does not use GitHub Actions, it should call the same `pnpm maintenance:prune-feed` command from its scheduler.
- Non-blocking hardening: database-library failures can include SQL text in stderr. A later hardening slice can normalize maintenance failure output to a fixed operator-facing message.

## Follow-ups

- Once a remote/deployment target exists, confirm the `DATABASE_URL` secret and scheduled workflow execution in that environment.

## Evidence Log

- Local x402scan reference uses a cron secret for protected maintenance routes; this phase avoided a public maintenance route entirely.
- Cards402 reference tests verify pruning by proving stale rows are removed and fresh rows are preserved; this phase follows the same aggregate-prune concept for shared feed rows.
- Full `pnpm run ci` passed after the maintenance command and workflow changes.
- Independent review passed with no Blocking or Should-fix findings.
