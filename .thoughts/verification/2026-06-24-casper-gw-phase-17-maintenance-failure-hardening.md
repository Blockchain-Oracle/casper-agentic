# Verification Audit: Casper GW Phase 17 Maintenance Failure Hardening

## Verdict

Passed. Local implementation, focused tests, explicit CLI failure checks, static gates, full CI, and independent review passed.

This audit verifies Phase 17 only: safe error formatting for the shared public feed prune maintenance command. It does not verify remote GitHub scheduler execution, deployment scheduler setup, public APIs, explorer UI, provider behavior, wallet policy, payment settlement, CSPR.click/browser signing, Mainnet, or production custody.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-17-maintenance-failure-hardening.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-16-feed-state-pruning.md`
- Changed files:
  - `src/server/external-action-feed-maintenance.ts`
  - `scripts/prune-external-feed-state.ts`
  - `tests/unit/external-action-feed-maintenance.test.ts`

## Requirement Traceability

| Requirement | Evidence | Result |
| --- | --- | --- |
| Preserve explicit missing `DATABASE_URL` failure. | `runFeedStatePrune()` throws `FeedStatePruneMaintenanceError` with code `database_url_required` and the same actionable message. | Pass |
| Normalize unexpected prune failures. | `formatFeedStatePruneError()` maps non-maintenance errors to fixed code `feed_state_prune_failed` and fixed message `Failed to prune shared public feed state.` | Pass |
| Keep success output unchanged. | `formatFeedStatePruneResult()` and the success path in `scripts/prune-external-feed-state.ts` were not changed. | Pass |
| Avoid raw database/identity/payload leakage in failure output. | Unit test injects an error containing SQL text, a connection string, a raw IP-like identity, and a secret-like value; formatted output omits them. | Pass |
| Keep product scope unchanged. | No route, UI, explorer, receipt, provider, wallet, payment, x402, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody files changed. | Pass |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
| --- | --- |
| Missing `DATABASE_URL` remains actionable. | `DATABASE_URL= pnpm maintenance:prune-feed; test $? -ne 0` prints `error: "database_url_required"` and the database-url-required message. |
| Unexpected database failures do not expose raw details. | `DATABASE_URL='postgres://user:secret@127.0.0.1:1/db' pnpm maintenance:prune-feed; test $? -ne 0` prints only `feed_state_prune_failed` and the fixed generic message. |
| Success output remains aggregate-only. | Phase 17 does not change the success formatter or success script path; Phase 16 success checks remain valid. |
| Unit tests cover safe formatting. | `tests/unit/external-action-feed-maintenance.test.ts` now has 5 focused tests. |

## Quality Gates

- Focused tests:
  - `pnpm exec vitest run tests/unit/external-action-feed-maintenance.test.ts`
  - Passed: 1 file, 5 tests.
- CLI missing database failure:
  - `DATABASE_URL= pnpm maintenance:prune-feed; test $? -ne 0`
  - Passed by failing the command as expected and printing structured safe JSON.
- CLI unexpected database failure:
  - `DATABASE_URL='postgres://user:secret@127.0.0.1:1/db' pnpm maintenance:prune-feed; test $? -ne 0`
  - Passed by failing the command as expected and printing only generic safe JSON.
- Static gates:
  - `pnpm typecheck`: passed.
  - `pnpm lint`: passed.
  - `pnpm run guard:product`: passed.
  - `pnpm run guard:secrets`: passed.
  - `pnpm run guard:files`: passed with pre-existing warnings only.
- Full CI:
  - `pnpm run ci`: passed.
  - Unit tests: 33 files, 153 tests passed.
  - Browser tests: 18 passed, 2 intentional mobile skips.
  - `next build`: passed.
- Independent review:
  - Reviewer `Wegener` reported no Blocking or Should-fix findings.
  - Reviewer verified raw database error redaction, missing `DATABASE_URL` behavior, scheduler scope, product-scope boundaries, tests, lint, typecheck, and guards.

Pre-existing file-size warnings remain:

- `src/app/api/mcp/[sourceId]/route.ts`
- `src/components/screens/test-console-screen.tsx`
- `src/server/hosted-paid-call.ts`
- `src/server/live-paid-call.ts`
- `tests/unit/explorer-search.test.ts`
- `tests/unit/hosted-endpoint-post-routes.test.ts`
- `tests/unit/hosted-paid-call.test.ts`
- `tests/unit/live-paid-call.test.ts`

New or changed Phase 17 source/test files are below the warning threshold:

- `src/server/external-action-feed-maintenance.ts`: 60 lines.
- `scripts/prune-external-feed-state.ts`: 19 lines.
- `tests/unit/external-action-feed-maintenance.test.ts`: 113 lines.

## Deviations From Plan

- None.

## Gaps And Risks

- Remote scheduled workflow execution still cannot be proven because no GitHub remote is configured.
- The generic failure output intentionally hides raw database errors. Operators will need local logs, reproduction, or a future controlled debug path for deeper diagnosis.

## Follow-ups

- Update `.thoughts/README.md` after review and commit.

## Evidence Log

- This phase directly closes the Phase 16 reviewer's non-blocking hardening note.
- The intentionally bad database URL command did not print the connection string, secret segment, host, SQL, or driver error.
- Full `pnpm run ci` passed after the failure formatter and test updates.
- Independent review passed with no Blocking or Should-fix findings.
