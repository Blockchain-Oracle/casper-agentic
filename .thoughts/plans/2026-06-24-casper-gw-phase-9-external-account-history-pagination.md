# Plan: Casper GW Phase 9 External Account History Pagination

Date: 2026-06-24
Branch: `feat/casper-gw-phase-0`

## Inputs

- `.thoughts/README.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-5-explorer-account-search.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-8-explorer-history-pagination.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/raw/repos/x402scan/apps/scan/src/lib/pagination.ts`
- Current repo state: `/explorer` has paginated Casper GW receipt history, exact receipt/deploy/account lookup, and bounded external account proof.

## Assumptions

- This phase is an explorer continuation, not a visual redesign.
- CSPR.cloud remains the source for external Casper indexed data.
- External account history is still chain/indexer proof only. It cannot prove Casper GW provider, tool, policy, x402 verify, or hosted endpoint context for transactions outside Casper GW.
- CSPR.cloud `GET /ft-token-actions` supports `page` and `page_size`, and returns `data`, `item_count`, and `page_count`; this was verified by a non-spending Testnet probe.
- `limit` is not the accepted page-size parameter for this endpoint.

## Open Questions

- Public-key and CSPR.name search remain outside this phase.
- A future phase may add broader contract-wide WCSPR feed browsing, but this phase only paginates external account history after an account search.

## Prototype Reintegration Gate

The current prototype reintegration gate allows scoped implementation but not broad design work. This phase only strengthens the public explorer mechanics.

No mock-backed behavior may be presented as Testnet proof. External history must be CSPR.cloud-backed or explicitly unavailable.

## Phase 1: CSPR.cloud Paginated Action Client

### Goal

Preserve CSPR.cloud pagination metadata for fungible-token actions instead of dropping it to a plain array.

### Work

- Add a typed paginated CSPR.cloud response model.
- Add a `getTokenActionsPage` client method using `page` and `page_size`.
- Keep existing list-returning methods stable for current deploy/account proof paths.
- Bound public page and page-size inputs.

### Real Integration Path

Use CSPR.cloud Testnet REST with the configured WCSPR package and account hash filters.

### Mock/Simulation Policy

Unit tests can mock the CSPR.cloud client. Product code must not fabricate action pages.

### Checks

- Unit tests for URL query parameters, pagination metadata, and page bounds.
- Secret scan must still pass.

### Acceptance Criteria Covered

- RQ-48, RQ-52, RQ-53, RQ-54, RQ-55.
- AC-10, AC-11, AC-12.

### Stop Condition

Stop if CSPR.cloud stops returning stable `item_count` and `page_count` metadata for account action pages.

## Phase 2: External Account History Contract

### Goal

Make account search expose paginated external account action proof while preserving local Casper GW receipt matches.

### Work

- Add a server module for external account history normalization and receipt-detail assembly.
- Extend explorer search options with `externalPage` and `externalPageSize`.
- When account search has Casper GW local matches, keep those rich receipts first and attach external account history separately.
- When no local matches exist, return external account action proof as the primary account result.
- Keep gateway, policy, and x402 layers marked unavailable for external-only actions.

### Real Integration Path

Resolve account, WCSPR ownership, and paginated WCSPR token actions through CSPR.cloud.

### Mock/Simulation Policy

No fixture fallback for external history. If CSPR.cloud is not configured, return an unconfigured external state.

### Checks

- Unit tests for local-plus-external search, external-only search, unavailable state, and action-page detail rows.
- Avoid growing existing warning-size tests; add a focused new test file where needed.

### Acceptance Criteria Covered

- RQ-47 through RQ-55 where account explorer proof is touched.
- Story 10: public receipt/explorer.

### Stop Condition

Stop if external action data would require exposing private gateway payloads, wallet keys, CSPR.cloud tokens, or provider credentials.

## Phase 3: Public Explorer UI Wiring

### Goal

Let users page external account action proof from `/explorer` after account search without leaving the public explorer.

### Work

- Add minimal account-history page controls for external account proof.
- Keep normal Casper GW receipt history controls separate from external account action controls.
- Make external action rows visibly `external_proof`.
- Do not put the explorer inside the authenticated app shell.

### Real Integration Path

The UI calls `/api/explorer/search` with `externalPage` and `externalPageSize`.

### Mock/Simulation Policy

No simulated external history. Existing local fixture receipt history remains only for missing `DATABASE_URL` and must stay labeled as sample receipts.

### Checks

- Browser smoke for public explorer account search and external pagination controls.
- Browser smoke must still confirm no authenticated app sidebar/nav.

### Acceptance Criteria Covered

- RQ-47, RQ-48, RQ-51, RQ-54.
- AC-10, AC-11, AC-12.

### Stop Condition

Stop before adding CSPR.click/browser signing, Mainnet, registry/private tools, broad redesign, or simulated/local product modes.

## Phase 4: Verification, Audit, And Review

### Goal

Prove Phase 9 is honest, scoped, and does not regress existing explorer or hosted endpoint behavior.

### Work

- Run focused unit and browser tests.
- Run `pnpm run ci`.
- Run a non-spending live CSPR.cloud account-history smoke using the known Testnet payer account.
- Write `.thoughts/verification/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`.
- Request independent review and fix blockers before handoff.

### Real Integration Path

No spending is required. The live smoke reads CSPR.cloud account/token-action data only.

### Mock/Simulation Policy

No live-settlement claim is introduced.

### Checks

- `pnpm test`
- `pnpm test:browser`
- `pnpm run ci`
- Non-spending CSPR.cloud account-history smoke.
- Independent reviewer findings fixed before completion.

### Acceptance Criteria Covered

- RQ-47 through RQ-55 for public explorer proof.

### Stop Condition

Stop if live CSPR.cloud read access fails in a way that prevents verifying pagination behavior.

## Verification Checkpoint

The verification audit must state that this is account-token-action pagination, not a full Casper block explorer, and that external actions still do not carry Casper GW gateway/policy/x402 context.

## Handoff Notes

This phase is meant to address the explorer-for-all concern without pretending Casper GW can infer x402 resource or policy context from arbitrary chain transactions.
