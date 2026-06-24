# Plan: Casper GW Phase 20 Workflow Guard

## Inputs

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- Existing workflow files:
  - `.github/workflows/ci.yml`
  - `.github/workflows/prune-feed-state.yml`
- Existing package scripts in `package.json`
- Current repo state after Phase 19: file-size guard clean, tests split, no GitHub remote configured.

## Assumptions

- This is a CI/CD enforcement slice only.
- No product runtime, UI, wallet, provider, explorer, x402 settlement, CSPR.cloud, or Casper proof behavior should change.
- The scheduler workflow must remain manual/scheduled only and must stay gated on `secrets.DATABASE_URL`.
- The normal CI workflow must continue to run frozen install, quality guards, unit tests, browser smoke, typecheck/lint through `verify`, and build.

## Open Questions

- None blocking. Opening a GitHub PR remains blocked by missing remote, but local workflow files can still be guarded.

## Prototype Reintegration Gate

Not applicable. This phase does not touch prototype, UI, public explorer behavior, hosted endpoint behavior, wallet signing, or payment settlement.

## Phase 1: Workflow Guard Script

### Goal

Make CI/CD expectations executable so future edits cannot silently remove required gates.

### Work

- Add a workflow guard script under `scripts/`.
- Validate `package.json` scripts:
  - `verify` includes file guard, product guard, secret guard, unit tests, typecheck, and lint.
  - `ci` includes frozen install, `verify`, browser smoke, and build.
- Validate `.github/workflows/ci.yml`:
  - triggers on pull requests and pushes to `main`/`feat/**`;
  - uses pnpm 10.33.0 and Node 20;
  - runs frozen install, Playwright chromium install, `pnpm verify`, `pnpm test:browser`, and `pnpm build`.
- Validate `.github/workflows/prune-feed-state.yml`:
  - is scheduled/manual only;
  - maps `DATABASE_URL` from GitHub secrets;
  - explicitly checks the secret is present;
  - runs frozen install and `pnpm maintenance:prune-feed`.

### Real Integration Path

Local Node script reads the actual workflow files and `package.json`.

### Mock/Simulation Policy

No product mock. Unit tests may exercise the guard helpers with synthetic text.

### Checks

- Unit tests for passing and failing guard cases.
- `pnpm run guard:workflows`
- `pnpm run ci`

### Acceptance Criteria Covered

- CI/CD quality requirements remain enforced in code.
- Scheduler cannot silently become part of normal PR CI or run without database-secret gating.

### Stop Condition

Stop before adding deployment providers, remote scheduling, production CD, or GitHub PR automation without a configured remote.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-24-casper-gw-phase-20-workflow-guard.md`, run independent review, and commit only after reviewer blockers are fixed.

## Handoff Notes

This phase is intentionally not scanner compatibility, browser signing, feed streaming, or production deployment. It closes the CI/CD enforcement concern before the next product slice.
