# Plan: Casper GW Phase 4 Public Explorer Proof Lookup

## Inputs

- `.thoughts/README.md`
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- Current repo state on `feat/casper-gw-phase-0`
- CSPR.cloud docs checked on 2026-06-23:
  - `GET /deploys/{deploy_hash}` returns raw deploy data.
  - REST API responses are wrapped in `data`.
  - Testnet REST base URL is `https://api.testnet.cspr.cloud`.
  - Fungible token actions expose `deploy_hash`, `contract_package_hash`, `from_hash`, `to_hash`, `amount`, and action metadata.

## Assumptions

- Phase 4 should preserve Phase 0-3 proof honesty. The explorer may show external Casper proof, but must not invent missing gateway, provider, tool, policy, or x402 context.
- The first external lookup target is deploy hash search. Account-wide indexing can be a later slice because it requires pagination, filtering, and clearer UX scope.
- CSPR.cloud is the real external proof source. Casper GW should not run a node or build a chain-wide indexer in this phase.
- Existing WCSPR package config remains the payment-token anchor for external payment-action lookup.
- Browser signing, production custody, Mainnet, registry, and broad redesign remain out of scope.

## Open Questions

- Should Phase 5 add account-hash search with pagination, or keep account search limited to filtering Casper GW receipts until a dedicated plan exists?
- Should external non-WCSPR deploys be displayed as generic Casper deploy proof only, or should the UI suppress them from the x402-oriented proof lane?

## Prototype Reintegration Gate

The accepted reintegration direction says `/explorer` is public infrastructure, not a gated app dashboard. The explorer must distinguish:

- rich Casper GW receipts from our persisted gateway database,
- external Casper proof from CSPR.cloud when a deploy hash is not in our database,
- unavailable gateway context for external proofs.

No downloaded prototype mock or old fixture language should be treated as product truth.

## Phase 1: Plan And API Contract

### Goal

Add a narrow, documented API contract for public explorer search that can return Casper GW receipt details or external Casper proof details.

### Work

- Add a server module for explorer search orchestration.
- Add or extend a public API route for explorer search.
- Keep `/api/receipts` backward compatible for the existing feed.

### Real Integration Path

- Casper GW receipt lookup reads Postgres receipt tables.
- External deploy lookup calls CSPR.cloud `GET /deploys/{deploy_hash}` and WCSPR token action lookup for that deploy hash.

### Mock/Simulation Policy

- Fixture fallback remains local/dev-only when `DATABASE_URL` is absent and must stay labeled.
- External proof lookup must not fabricate deploys, token actions, or x402 context.

### Checks

- Unit tests for input classification, DB-hit behavior, external fallback behavior, and error/redaction behavior.

### Acceptance Criteria Covered

- RQ-47, RQ-48, RQ-51, RQ-52, RQ-53, RQ-54, RQ-55.

### Stop Condition

- Stop if CSPR.cloud config is unavailable in a context where external lookup is being claimed as real.

## Phase 2: Explorer UI Search And Detail States

### Goal

Make `/explorer` feel like public infrastructure: searchable, honest, and useful for both rich Casper GW receipts and external Casper deploy proofs.

### Work

- Add search input for receipt id or deploy hash.
- Show result source labels:
  - `Casper GW receipt`
  - `External Casper proof`
  - `Not found`
- Render external proof with gateway/policy/x402 context explicitly unavailable.
- Keep top-level public nav and no app sidebar.

### Real Integration Path

- The client calls the public explorer search API.
- Existing receipt feed continues to load from persisted receipts.

### Mock/Simulation Policy

- No simulated/local mode.
- No fake deploy hash.
- No external proof row unless CSPR.cloud returns deploy data.

### Checks

- Browser smoke for public explorer search controls and no authenticated app shell.
- Unit tests for external detail rendering.

### Acceptance Criteria Covered

- AC-10, AC-11, AC-12 and the Phase 4 extension: external deploy lookup shows only objective Casper proof.

### Stop Condition

- Stop if the UI cannot represent external proof without implying missing gateway/policy context.

## Phase 3: Verification And Review

### Goal

Prove the implementation matches the plan and does not regress Phase 0-3 proof honesty.

### Work

- Run `pnpm verify`, `pnpm test:browser`, and `pnpm build`.
- Use Chrome for human UX inspection of `/explorer` after implementation.
- Write `.thoughts/verification/2026-06-23-casper-gw-phase-4-public-explorer-proof-lookup.md`.
- Request independent code review before declaring the gate complete.
- Update `.thoughts/README.md` only after verification and review pass.

### Real Integration Path

- If credentials are present, verify one external deploy-hash lookup against the existing real Phase 3 deploy hash:
  `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`.

### Mock/Simulation Policy

- Any fallback sample receipt remains visibly labeled and excluded from proof claims.

### Checks

- `pnpm verify`
- `pnpm test:browser`
- `pnpm build`
- Chrome visual inspection
- Independent review

### Acceptance Criteria Covered

- The explorer remains public and honest, supports receipt/deploy lookup, separates layers, and preserves redaction.

### Stop Condition

- Stop before marking Phase 4 complete if tests fail, external proof is mislabeled as gateway context, a deploy hash is faked, or reviewer finds a blocker.

## Verification Checkpoint

Use the Abu Context Engineering verification-audit skill after implementation and before final status. The audit must map plan/spec/story requirements to code, tests, browser/Chrome evidence, and any live CSPR.cloud proof lookup evidence.

## Handoff Notes

- This phase intentionally does not attempt chain-wide account indexing.
- This phase intentionally does not replace CSPR.live.
- External Casper proof is valuable but limited: it proves on-chain deploy/token-action facts, not the gateway/provider/policy context available only for Casper GW receipts.
