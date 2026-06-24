# Plan: Casper GW Phase 17 Maintenance Failure Hardening

## Inputs

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-16-feed-state-pruning.md`
- Phase 16 independent review note: database-library failures can include SQL text in stderr.
- Existing code:
  - `scripts/prune-external-feed-state.ts`
  - `src/server/external-action-feed-maintenance.ts`
  - `tests/unit/external-action-feed-maintenance.test.ts`

## Assumptions

- Phase 17 is a quality-hardening slice only.
- The success output contract from Phase 16 stays unchanged.
- Missing `DATABASE_URL` should remain an explicit operator error.
- Unexpected prune failures should not print SQL text, connection strings, raw client identities, deploy payloads, or secret-looking values.

## Open Questions

- None blocking. Remote scheduler execution still requires a GitHub remote and `DATABASE_URL` secret.

## Prototype Reintegration Gate

Not applicable. This slice does not touch prototype, UI, explorer, wallet, provider, payment, x402, or Casper proof behavior.

## Phase 1: Normalize Maintenance Errors

### Goal

Prevent scheduler/CLI stderr from exposing raw database-library details while preserving clear operator failures for missing configuration.

### Work

- Add a typed maintenance error shape in `src/server/external-action-feed-maintenance.ts`.
- Add a formatter for safe CLI failure output.
- Update `scripts/prune-external-feed-state.ts` to print only the safe message.
- Extend unit tests for missing database and database-library failure redaction.

### Real Integration Path

Real local CLI behavior. No mock-backed product path is introduced.

### Mock/Simulation Policy

Mocks are allowed only in unit tests to force failure cases. No user-facing simulated/local product mode.

### Checks

- Focused unit tests for maintenance failure formatting.
- `pnpm typecheck`
- `pnpm lint`
- `pnpm run guard:product`
- `pnpm run guard:secrets`
- `pnpm run guard:files`
- `git diff --check`

### Acceptance Criteria Covered

- Missing `DATABASE_URL` remains actionable.
- Unexpected database errors are normalized to a fixed message/code.
- Failure output does not include raw SQL, connection strings, raw identities, deploy payloads, or CSPR.cloud token strings.
- Success output remains aggregate-only and unchanged.

### Stop Condition

Stop before changing scheduler semantics, public APIs, explorer UI, provider/payment behavior, deployment configuration, or PR/remote setup.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-24-casper-gw-phase-17-maintenance-failure-hardening.md` with requirement traceability, commands, and review evidence before committing.

## Handoff Notes

This slice closes the Phase 16 reviewer’s non-blocking hardening note. It does not verify remote scheduled GitHub Actions execution because no remote is configured in this checkout.
