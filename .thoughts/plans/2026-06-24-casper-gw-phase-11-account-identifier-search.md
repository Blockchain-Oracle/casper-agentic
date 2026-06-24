# Plan: Casper GW Phase 11 Account Identifier Search

Date: 2026-06-24
Branch: `feat/casper-gw-phase-0`

## Inputs

- `.thoughts/README.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/research/2026-06-18-casper-x402-onchain-identification.md`
- `.thoughts/raw/repos/docs-redux/src/pages/condor/jsonrpc-comp/rpc-1.5/state_get_account_info.json.md`
- `.thoughts/raw/repos/cspr-trade-mcp/docs/llms.txt`
- `.thoughts/plans/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`
- Live non-spending CSPR.cloud probe:
  - `GET /accounts/{account_hash}` returns `public_key`.
  - `GET /accounts/{public_key}` resolves the same `account_hash`.
  - `GET /cspr-name-resolutions/faucet.cspr` returns `resolved_hash`.
  - `GET /accounts/{resolved_hash}` resolves the named account.
- Current repo state: `/explorer` supports receipt, deploy, account-hash, external account history, and configured WCSPR feed browsing.

## Assumptions

- CSPR.cloud is the source of truth for account identifier resolution in this phase.
- Public keys are public data and safe to display in proof rows.
- CSPR.name resolution is public name-service data and safe to display as lookup context.
- Public key formats accepted in this phase are Casper full public-key hex forms:
  - Ed25519: `01` + 64 hex characters.
  - Secp256k1: `02` + 66 hex characters.
- CSPR.name search is limited to `.cspr` names that resolve through CSPR.cloud.

## Open Questions

- Reverse CSPR.name lookup for every account is not required. If CSPR.cloud account responses include a name field later, it can be shown as extra context.
- Name autocomplete and fuzzy search remain out of scope.
- Public-key-to-account conversion without CSPR.cloud remains out of scope unless a stable Casper SDK utility is added in a separate plan.

## Prototype Reintegration Gate

The accepted explorer path allows public lookup improvements as long as external rows stay proof-only and the public explorer is not moved into the authenticated app shell.

No mock-backed identifier resolution may be presented as Testnet proof. Public key and CSPR.name lookups must be CSPR.cloud-backed or explicitly unavailable.

## Phase 1: CSPR.cloud Identifier Client

### Goal

Add the CSPR.cloud client surface needed to resolve CSPR.name records and account public keys without exposing API keys to the browser.

### Work

- Add a typed `getCsprNameResolution(name)` client method.
- Preserve the existing `getAccount(accountIdentifier)` path for account hash or public key.
- Normalize CSPR.name and public-key inputs server-side.

### Real Integration Path

Use CSPR.cloud Testnet REST:

- `GET /accounts/{account_identifier}`
- `GET /cspr-name-resolutions/{name}`

### Mock/Simulation Policy

Unit tests can mock CSPR.cloud responses. Product runtime must not fabricate name resolutions or account hashes.

### Checks

- Unit test URL paths and public-key/name resolution behavior.
- Secret scan must still pass.

### Acceptance Criteria Covered

- Public explorer can accept more real Casper identifiers without becoming a fake block explorer.

### Stop Condition

Stop if CSPR.cloud identifier resolution changes shape or cannot distinguish missing names from upstream failure safely.

## Phase 2: Explorer Search Resolution

### Goal

Let `/api/explorer/search` accept public keys and `.cspr` names, resolve them to account hashes, then use the existing Casper GW account receipt and external account-history paths.

### Work

- Extend query parsing for:
  - `public-key:<hex>`
  - `public:<hex>`
  - raw full public-key hex
  - `name:<name.cspr>`
  - raw `<name>.cspr`
- Resolve public keys through `GET /accounts/{public_key}`.
- Resolve names through `GET /cspr-name-resolutions/{name}` then account lookup.
- Preserve receipt-id, deploy-hash, and account-hash behavior.
- Return explicit `unconfigured`, `upstream_error`, or `not_found` states; do not collapse upstream failures into proof.

### Real Integration Path

Resolve identifiers server-side with CSPR.cloud, then call existing account-history and local receipt lookup code.

### Mock/Simulation Policy

No fixture fallback for identifier resolution.

### Checks

- Unit tests for public key, prefixed public key, CSPR.name, missing config, unresolved name, and upstream failure.

### Acceptance Criteria Covered

- Public explorer remains useful for users who know wallet public keys or CSPR.names rather than account hashes.
- External account context remains proof-only.

### Stop Condition

Stop if resolution requires client-side CSPR.cloud credentials or wallet connection.

## Phase 3: Public Explorer UI Wording

### Goal

Make the existing search input accurately describe accepted identifiers without a redesign.

### Work

- Update search field label/placeholder to include public key and CSPR.name.
- Keep account-history and external feed controls separate.
- Keep `/explorer` public/no-sidebar.

### Real Integration Path

The UI still calls `/api/explorer/search` only.

### Mock/Simulation Policy

Browser tests may route API responses for deterministic UI coverage. Runtime search must call the server route.

### Checks

- Browser smoke for CSPR.name or public-key search wording and result state.

### Acceptance Criteria Covered

- Public search communicates what it can resolve.

### Stop Condition

Stop before adding autocomplete, wallet connect, Mainnet, registry/private tools, or broad redesign.

## Phase 4: Verification, Audit, And Review

### Goal

Prove account identifier search is honest, scoped, and does not regress receipt/deploy/account search.

### Work

- Run focused unit tests.
- Run browser smoke for `/explorer`.
- Run non-spending live CSPR.cloud public-key and CSPR.name smoke.
- Run `pnpm run ci`.
- Write `.thoughts/verification/2026-06-24-casper-gw-phase-11-account-identifier-search.md`.
- Request independent review and fix blockers before commit.

### Real Integration Path

No spending is required. The live smoke reads CSPR.cloud account/name data only.

### Mock/Simulation Policy

No live-settlement claim is introduced.

### Checks

- `pnpm test`
- `pnpm test:browser`
- `pnpm run ci`
- Non-spending CSPR.cloud identifier smoke
- Independent reviewer findings fixed before completion

### Acceptance Criteria Covered

- Public explorer accepts account hash, public key, and CSPR.name without confusing those identifiers with x402 settlement context.

### Stop Condition

Stop if CSPR.cloud read access fails in a way that prevents verifying identifier resolution.

## Verification Checkpoint

The verification audit must state that public-key and CSPR.name lookup resolve accounts only. They do not prove Casper GW provider/tool/policy/x402 context unless a matching Casper GW receipt exists.

## Handoff Notes

This phase keeps improving the public explorer as a useful inspection surface while preserving the hybrid boundary: CSPR.cloud proves public chain/account/name facts; Casper GW records explain gateway-specific paid tool context.
