# Plan: Casper GW Phase 19 Test File Size Cleanup

## Inputs

- `AGENTS.md`
- `.thoughts/README.md`
- Phase 18 verification audit and guard output.
- Remaining oversized files from `pnpm run guard:files`:
  - `tests/unit/explorer-search.test.ts`
  - `tests/unit/hosted-endpoint-post-routes.test.ts`
  - `tests/unit/hosted-paid-call.test.ts`
  - `tests/unit/live-paid-call.test.ts`

## Assumptions

- This is a test-structure quality slice only.
- The accepted behavior and production source must not change.
- Shared test helpers/fixtures are acceptable if each helper stays below the warning threshold and does not hide critical assertions.

## Open Questions

- None blocking.

## Prototype Reintegration Gate

Not applicable. This slice does not touch prototype, UI/product behavior, explorer behavior, wallet behavior, provider behavior, payment behavior, or Casper proof behavior.

## Work

- Extract fixture builders from oversized unit test files into focused helper files.
- Split oversized test files only when helper extraction is not enough.
- Keep mocks local enough to remain readable and deterministic.
- Preserve the same test coverage and command behavior.

## Checks

- Focused test runs for the touched test groups.
- `pnpm run guard:files` must have no warnings.
- `pnpm typecheck`
- `pnpm lint`
- `pnpm run guard:product`
- `pnpm run guard:secrets`
- `pnpm run ci`

## Acceptance Criteria

- No file-size warnings remain.
- Unit test count remains stable or increases only due to mechanical splitting.
- Production source diff is empty.
- No public route, UI, explorer, provider, wallet, x402, settlement, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody behavior changes.

## Verification Checkpoint

- Write `.thoughts/verification/2026-06-24-casper-gw-phase-19-test-file-size-cleanup.md`.
- Run independent review focused on accidental coverage loss, hidden behavior change, and guard status.
- Commit only after review passes.
