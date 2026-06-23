# Plan: Casper GW Phase 8 Public Explorer History Pagination

Date: 2026-06-23
Branch: `feat/casper-gw-phase-0`

## Inputs

- `.thoughts/README.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-5-explorer-account-search.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-7-hosted-endpoint-settlement.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/raw/repos/x402scan/apps/scan/src/lib/pagination.ts`
- `.thoughts/raw/repos/x402scan/apps/scan/src/services/db/composer/tool-call.ts`
- Current repo state: public explorer has unpaginated `/api/receipts`, lookup search in `/api/explorer/search`, and no explicit receipt-history pagination contract.

## Assumptions

- Phase 8 is an explorer continuation, not a redesign pass.
- The source of truth for rich Casper GW history remains persisted gateway receipts.
- External Casper deploy/account lookup remains proof-only and cannot invent gateway, provider, policy, or x402 context for transactions not created through Casper GW.
- x402scan is used as a practical reference for paginated activity tables and explicit resource/payment context; its chain support is not copied.

## Open Questions

- CSPR.cloud external account action pagination is not accepted as a product promise in this phase unless current docs/API behavior prove a stable cursor/page contract.
- CSPR.name and public-key-to-account resolution remain outside this phase.

## Prototype Reintegration Gate

The current prototype reintegration gate allows implementation but does not approve broad visual redesign. This phase changes only the public explorer history mechanics and minimal controls needed to expose them.

No mock-backed behavior may be presented as Testnet proof. Fixture rows remain visibly labeled as `Sample receipts` when no database is configured.

## Phase 1: Server-Side Receipt History Contract

### Goal

Make `/api/receipts` return paginated, server-filtered Casper GW receipt history.

### Work

- Add a typed pagination/filter query model for receipt history.
- Support page, page size, status, provider, tool, wallet/account, network, and text query where persisted data exists.
- Return pagination metadata and a source label.
- Keep fixture fallback bounded and visibly labeled.

### Real Integration Path

Postgres + Drizzle reads from `paid_call_attempts` and related receipt-layer tables. No chain lookup is required for local receipt history.

### Mock/Simulation Policy

Fixtures are allowed only when `DATABASE_URL` is absent and must remain labeled as sample receipts.

### Checks

- Unit tests for query parsing, bounds, filters, and pagination metadata.
- File-size guard must remain below the hard cap.

### Acceptance Criteria Covered

- RQ-47, RQ-48, RQ-49, RQ-50, RQ-51, RQ-52.
- Story 10: public receipt/explorer.

### Stop Condition

Stop if receipt filters require exposing redacted private request/output data or internal policy configuration.

## Phase 2: Public Explorer UI Wiring

### Goal

Expose history pagination/filtering in `/explorer` without app auth, wallet connection, sidebar, or redesign.

### Work

- Fetch `/api/receipts` with page/status/filter parameters.
- Add previous/next controls and a concise server-result count.
- Keep search lookup separate from history browsing.
- Reset to page 1 when filters change.

### Real Integration Path

The UI consumes the real API contract. Existing search continues to use `/api/explorer/search` for receipt/deploy/account lookup.

### Mock/Simulation Policy

Sample rows remain labeled and do not claim settlement beyond fixture labels.

### Checks

- Browser smoke for public/no-sidebar explorer and pagination controls.
- Existing search smoke remains valid.

### Acceptance Criteria Covered

- RQ-47, RQ-48, RQ-49, RQ-54.
- AC-10, AC-11, AC-12.

### Stop Condition

Stop if UI work drifts into top-level redesign, private registry, sandbox, simulated/local modes, or authenticated explorer framing.

## Phase 3: Verification, Audit, And Review

### Goal

Prove the slice is honest, scoped, and does not regress Phase 7.

### Work

- Run focused unit tests.
- Run `pnpm run ci`.
- Run browser smoke.
- Write `.thoughts/verification/2026-06-23-casper-gw-phase-8-explorer-history-pagination.md`.
- Run independent review before handoff.

### Real Integration Path

No spending is required. Local persisted receipts and fixture fallback are enough to verify the history contract.

### Mock/Simulation Policy

No live-settlement claim is introduced.

### Checks

- `pnpm test`
- `pnpm test:browser`
- `pnpm run ci`
- Independent reviewer findings fixed before completion.

### Acceptance Criteria Covered

- RQ-47 through RQ-55 where this slice touches explorer history.

### Stop Condition

Stop before live spending, CSPR.click/browser signing, Mainnet, broad redesign, registry/private tools, or production custody.

## Verification Checkpoint

The verification audit must map requirements to files, tests, and browser evidence. It must explicitly state that external account lookup is still bounded proof unless a separate accepted plan expands it.

## Handoff Notes

This phase should make the explorer feel like public infrastructure by allowing receipt history browsing at scale. It should not pretend to be a full Casper chain explorer.
