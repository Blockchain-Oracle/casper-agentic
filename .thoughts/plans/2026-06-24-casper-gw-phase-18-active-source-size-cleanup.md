# Plan: Casper GW Phase 18 Active Source Size Cleanup

## Inputs

- `AGENTS.md`
- `.thoughts/README.md`
- Current guard output from Phases 16 and 17.
- Oversized active source files:
  - `src/app/api/mcp/[sourceId]/route.ts`
  - `src/components/screens/test-console-screen.tsx`
  - `src/server/hosted-paid-call.ts`
  - `src/server/live-paid-call.ts`
- Current tests covering those surfaces:
  - `tests/unit/hosted-endpoint-post-routes.test.ts`
  - `tests/unit/hosted-paid-call.test.ts`
  - `tests/unit/live-paid-call.test.ts`
  - browser smoke tests through `pnpm run ci`

## Assumptions

- This is a quality slice only. It must preserve behavior and product scope.
- The goal is to remove active source warnings where practical by extracting existing helpers/components.
- Test-file warnings may remain unless they can be reduced without large churn.
- No public x402 discovery, CSPR.click signing, feed streaming, Mainnet, OAuth, registry, sandbox, or settlement behavior is part of this slice.

## Open Questions

- None blocking.

## Prototype Reintegration Gate

Not applicable. This slice does not change prototype, UI behavior, explorer behavior, payment behavior, wallet behavior, or Casper proof behavior.

## Phase 1: Split Hosted MCP Route Helpers

### Goal

Move JSON-RPC parsing/response helpers out of `src/app/api/mcp/[sourceId]/route.ts` so the route reads as orchestration.

### Work

- Add a server-only JSON-RPC helper module.
- Keep exact response shapes and status behavior.
- Run hosted endpoint route tests.

### Checks

- `pnpm exec vitest run tests/unit/hosted-endpoint-post-routes.test.ts`

## Phase 2: Split Hosted Paid-Call Helpers

### Goal

Move payment-header decoding, error/output helpers, payer normalization, settle request wrapping, redaction, and verify-failure persistence out of `src/server/hosted-paid-call.ts`.

### Work

- Add typed hosted-paid-call helper modules.
- Keep existing public exports available to current route/tests.
- Run hosted paid-call tests.

### Checks

- `pnpm exec vitest run tests/unit/hosted-paid-call.test.ts tests/unit/hosted-endpoint-post-routes.test.ts`

## Phase 3: Split Live Paid-Call Helpers

### Goal

Move input validation/redaction and spend-policy evidence assembly out of `src/server/live-paid-call.ts`.

### Work

- Add server-only helper modules.
- Keep `runLivePaidToolCall`, `PaidCallInputError`, and `isPaidCallInputError` available from the current import path.
- Run live paid-call tests.

### Checks

- `pnpm exec vitest run tests/unit/live-paid-call.test.ts tests/unit/paid-call-routes.test.ts`

## Phase 4: Optional Test Console Component Split

### Goal

If still needed, extract display-only subcomponents from `src/components/screens/test-console-screen.tsx` while preserving UI behavior.

### Work

- Split endpoint target and discovered tools panel into a sibling component only if it keeps props manageable.

### Checks

- Browser smoke through `pnpm run ci`.

## Verification Checkpoint

- `pnpm run guard:files` should no longer warn for the active source files touched by this slice.
- `pnpm typecheck`, `pnpm lint`, focused tests, and `pnpm run ci` must pass.
- Write `.thoughts/verification/2026-06-24-casper-gw-phase-18-active-source-size-cleanup.md`.
- Run independent review focused on accidental behavior changes and product-scope drift.

## Handoff Notes

This phase should reduce source-size friction before larger CSPR.click, feed streaming, or public scanner compatibility planning. It should not change user-facing behavior.
