# Plan: Casper GW Phase 16 Feed State Pruning

## Inputs

- `.thoughts/README.md` current gate: Phase 15 is complete; scheduled operational pruning is an allowed next slice.
- Phase 15 plan and verification:
  - `.thoughts/plans/2026-06-24-casper-gw-phase-15-shared-feed-state.md`
  - `.thoughts/verification/2026-06-24-casper-gw-phase-15-shared-feed-state.md`
- Current code:
  - `src/server/external-action-feed-state.ts`
  - `src/server/external-action-feed-cache.ts`
  - `src/db/schema.ts`
  - `.github/workflows/ci.yml`
- Local references:
  - `.thoughts/raw/repos/x402scan/apps/scan/src/lib/cron.ts`
  - `.thoughts/raw/repos/x402scan/apps/scan/src/app/api/cron/warm-cache/route.ts`
  - `.thoughts/raw/repos/Cards402/backend/test/integration/jobs.test.js`

## Assumptions

- This project has no GitHub remote configured yet, so any hosted scheduled workflow cannot be proven end to end in GitHub.
- A deterministic CLI maintenance command is the safest implementation now; it can be invoked by GitHub Actions, Vercel Cron, system cron, or a deployment scheduler later.
- Public explorer behavior must not change.
- The command must require `DATABASE_URL` by default so a scheduler misconfiguration fails loudly.

## Open Questions

- No blocking questions. The final production scheduler target remains a later deployment decision.

## Prototype Reintegration Gate

This is infrastructure maintenance only:

- No public route.
- No UI.
- No new explorer semantics.
- No registry/private tools, sandbox, simulated/local modes, public scanner compatibility, OAuth, CSPR.click signing, Mainnet, or custody work.

## Phase 16: Feed State Pruning

### Goal

Provide a deterministic, CI-verifiable maintenance command that prunes expired shared public feed cache rows and expired shared rate buckets from Postgres.

### Work

- Update `pruneSharedExternalActionFeedState()` to return deletion counts and database configuration state.
- Add a CLI script under `scripts/` that:
  - loads `.env.local`,
  - requires `DATABASE_URL` unless explicitly run in dry/no-op mode,
  - calls `pruneSharedExternalActionFeedState()`,
  - prints only aggregate counts and timestamps,
  - does not print connection strings, client identities, CSPR.cloud keys, or row payloads.
- Add a `pnpm` script for the pruning command.
- Add focused tests for:
  - missing `DATABASE_URL` fails loudly,
  - successful pruning prints counts only,
  - CLI output does not leak raw identity or feed payload data.
- Add an optional GitHub Actions scheduled workflow only if it is gated by repository secrets and does not affect normal PR CI.

### Real Integration Path

The pruning command uses the existing Drizzle/Postgres database path. It never reads CSPR.cloud and never creates, mutates, or claims receipt/payment proof.

### Mock/Simulation Policy

- Unit tests may mock the pruning function.
- Runtime pruning must operate only against Postgres rows when `DATABASE_URL` is configured.

### Checks

- Focused unit tests for maintenance CLI.
- `pnpm run maintenance:prune-feed` against local Postgres.
- `pnpm run guard:files`
- `pnpm run guard:product`
- `pnpm run guard:secrets`
- `pnpm run ci`

### Acceptance Criteria Covered

- Expired shared feed state can be cleaned without manual SQL.
- Misconfigured scheduler runs fail safely before pretending maintenance succeeded.
- No secrets or raw identities are exposed in maintenance output.
- The public explorer remains unchanged.

### Stop Condition

Stop before implementing a public maintenance API, deployment-specific scheduler setup requiring a remote, CSPR.cloud Streaming, public x402 scanner compatibility, OAuth, CSPR.click/browser signing, Mainnet, broad redesign, registry/private tools, simulated/local modes, or production custody.

## Verification Checkpoint

After implementation:

- Write `.thoughts/verification/2026-06-24-casper-gw-phase-16-feed-state-pruning.md`.
- Map this plan to code, tests, command output, and reviewer findings.
- Request independent review for secret leakage, destructive behavior, scheduler safety, and product-scope drift.
- Fix blockers before committing.

## Handoff Notes

This phase provides the maintenance command and optional workflow shape. Actual hosted scheduling remains dependent on the eventual remote/deployment environment.
