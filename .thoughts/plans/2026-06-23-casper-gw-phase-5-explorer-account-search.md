# Plan: Casper GW Phase 5 Explorer Account Search

## Inputs

- `.thoughts/README.md`
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-4-public-explorer-proof-lookup.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-4-public-explorer-proof-lookup.md`
- Current repo state on `feat/casper-gw-phase-0`
- CSPR.cloud docs checked on 2026-06-23:
  - `GET /accounts/{account_identifier}/ft-token-actions` returns account FT token actions and supports `deploy_hash`, `from_block_height`, and `to_block_height`.
  - `GET /ft-token-actions` supports `contract_package_hash` and `account_hash` filters.
  - `GET /accounts/{account_identifier}/ft-token-ownership` returns account token ownership balances.
  - FT token action fields include `deploy_hash`, `contract_package_hash`, `from_hash`, `to_hash`, `amount`, `block_height`, and `timestamp`.

## Assumptions

- Phase 5 should extend the public explorer search path, not redesign the explorer.
- Account hash search means a 64-character account hash or a query prefixed with `account:` or `wallet:`.
- Casper GW account matches should show rich local receipts first when the account appears as a payer/wallet in persisted receipt records.
- External account proof may show account facts, configured payment-token balance, and recent configured payment-token actions from CSPR.cloud.
- External account proof must not claim provider/tool/policy/x402 context unless the action maps to a Casper GW receipt.
- Chain-wide account history with full pagination is deferred; Phase 5 may show a bounded recent slice and label it as such.

## Open Questions

- Should a later phase add cursor/page controls for full CSPR.cloud account history?
- Should the explorer eventually support CSPR.name resolution as an account search input?

## Prototype Reintegration Gate

The accepted reintegration direction says `/explorer` is public infrastructure. Account search must keep the same public/no-sidebar shape and the same proof honesty rules:

- local Casper GW receipts are rich gateway records,
- external account proof is chain/indexer data only,
- missing gateway, policy, and x402 context must be explicitly unavailable.

No old registry, sandbox, private tool, simulated/local, or fake proof behavior is allowed.

## Phase 1: Account Search Contract

### Goal

Extend the public explorer search contract to return account-oriented results without breaking existing receipt id and deploy hash lookup.

### Work

- Add query classification for `receipt:`, `deploy:`, `account:`, and `wallet:` prefixes.
- Add local datastore search by wallet/account hash.
- Add external account proof lookup through CSPR.cloud.
- Keep deploy-hash lookup precedence for Casper GW receipt/proof matches.

### Real Integration Path

- Local account search reads `paid_call_attempts.wallet_account_hash` and joins persisted receipt layers.
- External account search calls CSPR.cloud account, token ownership, and token-action endpoints.

### Mock/Simulation Policy

- Fixture fallback remains sample-only and visibly labeled.
- External account proof must not be fabricated. If CSPR.cloud is not configured, return `unconfigured`.

### Checks

- Unit tests for prefix classification, local account matches, external account proof, unconfigured state, and receipt/deploy regression.

### Acceptance Criteria Covered

- RQ-47, RQ-48, RQ-51, RQ-52, RQ-53, RQ-54, RQ-55.

### Stop Condition

- Stop if account search cannot distinguish local gateway receipts from external chain/account proof.

## Phase 2: Public Explorer UI Account Results

### Goal

Show account search results in the existing public explorer without turning it into a dashboard.

### Work

- Update the search placeholder/copy to include account hash.
- For local account matches, show the matched receipt list and selected receipt detail.
- For external account proof, show account balance/action facts in the proof panels with gateway/policy/x402 marked unavailable.
- Keep no auth, no wallet connect, and no app sidebar.

### Real Integration Path

- Client calls `/api/explorer/search` and renders source labels returned by the API.

### Mock/Simulation Policy

- No simulated account history.
- No fake token actions.
- No fake deploy hash links.

### Checks

- Browser smoke for account-search affordance and public explorer boundary.
- Chrome inspection after implementation.

### Acceptance Criteria Covered

- Public viewer can search by account/wallet and understand what is gateway-backed versus external proof only.

### Stop Condition

- Stop if external account proof appears as a settled x402/gateway receipt.

## Phase 3: Verification And Review

### Goal

Prove the implementation matches the plan and does not regress Phase 4.

### Work

- Run `pnpm verify`, `pnpm test:browser`, `pnpm build`, and `pnpm run ci`.
- Use Chrome to inspect `/explorer`.
- Run a non-spending CSPR.cloud account lookup using a known account from the Phase 3 wrap/payment evidence.
- Write `.thoughts/verification/2026-06-23-casper-gw-phase-5-explorer-account-search.md`.
- Request independent review before marking complete.
- Update `.thoughts/README.md` only after review passes.

### Real Integration Path

- Use a known Testnet account hash from existing persisted live proof as the external account lookup smoke target.

### Mock/Simulation Policy

- Any no-DB fallback remains labeled `Sample receipts`.

### Checks

- `pnpm verify`
- `pnpm test:browser`
- `pnpm build`
- `pnpm run ci`
- Chrome inspection
- Independent review

### Acceptance Criteria Covered

- Explorer stays public, supports account search, preserves proof-layer boundaries, and avoids fake gateway/x402 claims for external account results.

### Stop Condition

- Stop before completion if tests fail, external proof is mislabeled, secrets leak, account search loses a richer Casper GW receipt match, or reviewer finds a blocker.

## Verification Checkpoint

Use the Abu Context Engineering verification-audit skill after implementation and before final status. The audit must map plan/spec/story requirements to code, tests, browser/Chrome evidence, and non-spending CSPR.cloud account lookup evidence.

## Handoff Notes

- This phase intentionally does not implement full account-history pagination.
- This phase intentionally does not replace CSPR.live.
- This phase intentionally does not add CSPR.name search.
- External account proof is useful for public inspection, but only Casper GW receipts can show provider, tool, policy, and x402 facilitator context.
