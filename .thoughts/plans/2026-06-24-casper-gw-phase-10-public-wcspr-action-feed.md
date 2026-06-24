# Plan: Casper GW Phase 10 Public WCSPR Action Feed

Date: 2026-06-24
Branch: `feat/casper-gw-phase-0`

## Inputs

- `.thoughts/README.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/raw/repos/x402scan/apps/scan/src/lib/pagination.ts`
- `.thoughts/plans/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- Live non-spending CSPR.cloud probe for `GET /ft-token-actions?contract_package_hash=<WCSPR>&page=1&page_size=4`
- Current repo state: `/explorer` has paginated gateway receipt history, exact receipt/deploy/account lookup, and external account-history pagination.

## Assumptions

- This phase is an explorer continuation, not a visual redesign.
- CSPR.cloud remains the source for external Casper indexed data.
- The configured WCSPR package is the only contract-wide feed shown in this phase.
- CSPR.cloud `GET /ft-token-actions` supports `page` and `page_size`, and returns `data`, `item_count`, and `page_count`; this was re-verified on Testnet.
- Contract-wide token actions are external chain/indexer facts only. They do not prove Casper GW provider, tool, policy, x402 verify, or hosted endpoint context unless a matching Casper GW receipt exists.

## Open Questions

- Contract-wide x402-specific classification remains out of scope because the chain/indexer rows do not carry gateway resource URL, MCP tool, or policy context.
- Public-key and CSPR.name search remain outside this phase.
- CSPR.cloud Streaming is deferred; this phase uses bounded REST pagination only.

## Prototype Reintegration Gate

The accepted reintegration path allows public explorer implementation as long as proof layers stay honest and the explorer is not moved into the authenticated app shell.

No mock-backed behavior may be presented as Testnet proof. External feed rows must be CSPR.cloud-backed or explicitly unavailable.

## Phase 1: External Feed Contract

### Goal

Create a public server contract for browsing configured WCSPR token actions without pretending they are Casper GW receipts.

### Work

- Add a server module for contract-wide external action feed normalization.
- Reuse CSPR.cloud `getTokenActionsPage` with `contractPackageHash`, `page`, and `pageSize`.
- Bound public page and page-size inputs.
- Clamp and refetch pages beyond the CSPR.cloud page count.
- Return `unconfigured` or `upstream_error` states instead of empty fake proof.

### Real Integration Path

Read CSPR.cloud Testnet `ft-token-actions` for the configured WCSPR package.

### Mock/Simulation Policy

Unit tests can mock the CSPR.cloud client. Product code must not fabricate external feed rows.

### Checks

- Unit tests for page bounds, CSPR.cloud call shape, unavailable states, upstream failure, and page clamping.

### Acceptance Criteria Covered

- Public explorer is useful beyond local Casper GW receipts.
- External chain facts are separated from gateway, policy, and x402 receipt context.

### Stop Condition

Stop if CSPR.cloud no longer returns stable pagination metadata for contract-package token actions.

## Phase 2: Proof-Only Receipt Detail Assembly

### Goal

Represent each external WCSPR action using the existing four-layer receipt detail model while making unavailable layers explicit.

### Work

- Add a detail builder for external WCSPR actions.
- Label receipts with `external_proof`.
- Set provider/tool/client labels to external feed language, not Casper GW product claims.
- Mark gateway receipt, policy decision, and x402 verify/settle as unavailable.
- Put network, package hash, deploy hash, amount, payer, payee, action type, block height, transform index, page, and CSPR.live link in the Casper proof layer.

### Real Integration Path

Use only action rows returned by CSPR.cloud for the configured payment asset.

### Mock/Simulation Policy

No fake deploy hashes. If an action lacks a deploy hash, do not create a live deploy link.

### Checks

- Unit tests for row separation, no `settled` status, and CSPR.live link only from real returned deploy hashes.

### Acceptance Criteria Covered

- Four proof layers remain separate.
- No external action is mislabeled as paid by Casper GW.

### Stop Condition

Stop if the UI or API would require exposing gateway payloads, wallet keys, provider credentials, or CSPR.cloud tokens.

## Phase 3: Public Explorer Wiring

### Goal

Let public users open and paginate a WCSPR feed from `/explorer` without sign-in, wallet connection, sidebar, or dashboard gating.

### Work

- Add a minimal feed hook and a small explorer control component.
- Add `/api/explorer/actions`.
- Keep gateway receipt history, exact search, external account history, and external WCSPR feed modes distinct.
- Avoid broad UI redesign and avoid growing existing 200-line files materially.

### Real Integration Path

The UI calls `/api/explorer/actions?page=<n>&pageSize=<bounded>` and renders returned receipt details.

### Mock/Simulation Policy

Browser tests may mock the API route. Product runtime must call the server route.

### Checks

- Browser smoke for public feed controls.
- Existing public explorer smoke still confirms no authenticated app sidebar.

### Acceptance Criteria Covered

- Public explorer is public infrastructure.
- External feed rows are transparent proof-only rows.

### Stop Condition

Stop before adding CSPR.click signing, Mainnet, registry/private tools, broad redesign, simulated/local modes, or a general block explorer claim.

## Phase 4: Verification, Audit, And Review

### Goal

Prove the feed is honest, scoped, and does not regress the existing public explorer or Phase 9 account-history pagination.

### Work

- Run focused unit tests.
- Run browser smoke for `/explorer`.
- Run a non-spending live CSPR.cloud feed smoke using the configured WCSPR package.
- Run `pnpm run ci`.
- Write `.thoughts/verification/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`.
- Request independent review and fix blockers before commit.

### Real Integration Path

No spending is required. The live smoke reads CSPR.cloud token-action data only.

### Mock/Simulation Policy

No live-settlement claim is introduced.

### Checks

- `pnpm test`
- `pnpm test:browser`
- `pnpm run ci`
- Non-spending CSPR.cloud WCSPR feed smoke
- Independent reviewer findings fixed before completion

### Acceptance Criteria Covered

- Public explorer can browse external configured-token actions without confusing them with Casper GW receipts.

### Stop Condition

Stop if live CSPR.cloud read access fails in a way that prevents verifying feed behavior.

## Verification Checkpoint

The verification audit must state that this is a bounded WCSPR token-action feed, not a full Casper block explorer, and that external rows do not carry Casper GW gateway/policy/x402 context.

## Handoff Notes

This phase addresses Abu's "explorer for all" concern by exposing public configured-token action evidence while preserving the product truth: Casper GW can only provide rich provider/tool/policy/x402 context for calls that pass through Casper GW.
