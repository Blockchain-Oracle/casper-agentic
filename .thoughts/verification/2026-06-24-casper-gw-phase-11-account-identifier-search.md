# Verification Audit: Casper GW Phase 11 Account Identifier Search

Date: 2026-06-24
Branch: `feat/casper-gw-phase-0`

## Verdict

Pass.

Phase 11 adds public-key and CSPR.name search to the public explorer by resolving those identifiers server-side through CSPR.cloud, then reusing the existing Casper GW account receipt and external account-history paths. The feature resolves accounts only; it does not claim public keys or CSPR.names prove Casper GW provider/tool/policy/x402 context unless a matching Casper GW receipt exists.

No live spending was required.

Independent reviewer `Beauvoir` found no blocking issues and two should-fix issues. Both were accepted and fixed before commit.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-11-account-identifier-search.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/research/2026-06-18-casper-x402-onchain-identification.md`
- `.thoughts/raw/repos/docs-redux/src/pages/condor/jsonrpc-comp/rpc-1.5/state_get_account_info.json.md`
- `.thoughts/raw/repos/cspr-trade-mcp/docs/llms.txt`
- CSPR.cloud live REST probes for `/accounts/{account_hash}`, `/accounts/{public_key}`, and `/cspr-name-resolutions/faucet.cspr`
- `src/server/cspr-cloud.ts`
- `src/server/explorer-identifiers.ts`
- `src/server/explorer-search.ts`
- `src/components/screens/explorer-screen.tsx`
- `tests/unit/cspr-cloud.test.ts`
- `tests/unit/explorer-identifier-search.test.ts`
- `tests/unit/explorer-search.test.ts`
- `tests/browser/explorer-identifier.spec.ts`
- `tests/browser/smoke.spec.ts`

## Requirement Traceability

- Public explorer remains public: no app auth, wallet connection, or authenticated sidebar was added.
- Public-key search accepts full Casper public key hex values:
  - Ed25519: `01` + 64 hex characters.
  - Secp256k1: `02` + 66 hex characters.
- CSPR.name search accepts valid `.cspr` names and resolves them through CSPR.cloud.
- Resolved identifiers are converted to account hashes server-side, then the existing local receipt and CSPR.cloud account-history paths are reused.
- Missing CSPR.cloud config returns `unconfigured`.
- Invalid/unresolved public keys or names return `not_found`.
- Non-404 CSPR.cloud lookup failures return `upstream_error`.
- Search field wording now includes receipt id, deploy hash, account hash, public key, and CSPR.name.
- No private registry, sandbox, simulated/local mode, CSPR.click signing, Mainnet, or production custody was introduced.

## Acceptance Criteria Coverage

- Public users can search with account hashes, public keys, or CSPR.names.
- Local Casper GW receipts remain the richer source when the resolved account has gateway records.
- External-only account results remain `external_proof`, with gateway/policy/x402 unavailable.
- CSPR.cloud keys and provider/wallet/client secrets stay server-side.

## Quality Gates

- Context7 was checked for CSPR.cloud API docs and returned CSPR.click rather than the CSPR.cloud REST API. Official CSPR.cloud docs and live non-spending REST probes were used for the named endpoint behavior.
- Focused unit tests before review:
  - `pnpm test -- tests/unit/cspr-cloud.test.ts tests/unit/explorer-search.test.ts tests/unit/explorer-identifier-search.test.ts`
  - Passed as part of the full unit suite: 30 files, 129 tests.
- Focused unit tests after review fixes:
  - `pnpm test -- tests/unit/cspr-cloud.test.ts tests/unit/explorer-search.test.ts tests/unit/explorer-identifier-search.test.ts tests/unit/explorer-search-route.test.ts`
  - Passed: 30 files, 134 tests.
- `pnpm guard:files`: passed with existing warning-size files under 300 lines.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- Focused browser smoke:
  - `pnpm exec playwright test tests/browser/explorer-identifier.spec.ts tests/browser/smoke.spec.ts tests/browser/explorer-feed.spec.ts`
  - Passed: 18 tests, 2 intentional mobile skips.
- Final `pnpm run ci`:
  - Frozen install: passed.
  - File/product/secret guards: passed.
  - Unit tests: 30 files, 129 tests passed.
  - Typecheck: passed.
  - Lint: passed.
  - Browser tests: 18 passed, 2 intentional mobile skips.
  - Production build: passed.

## Live Non-Spending Smoke

Initial direct CSPR.cloud probe:

- `GET /accounts/{account_hash}` for known Testnet payer returned `public_key`.
- `GET /accounts/{public_key}` returned the same account hash.
- `GET /cspr-name-resolutions/faucet.cspr` returned `resolved_hash`.
- `GET /accounts/{resolved_hash}` returned a public key and account hash for the name.

Post-implementation smoke through `searchExplorer`:

- Public-key query:
  - Source: `casper_gw_account`
  - Resolved account: `bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12`
  - Message: `Resolved public key to a Casper account. Matched 5 Casper GW receipts for this account.`
  - External account source: `cspr_cloud`
- CSPR.name query:
  - Query: `faucet.cspr`
  - Source: `external_account_proof`
  - Resolved account: `b383c7cc23d18bc1b42406a1b2d29fc8dba86425197b6f553d7fd61375b5e446`
  - Message: `Resolved faucet.cspr to a Casper account. Resolved 0 external WCSPR actions for this account through CSPR.cloud.`
  - External account source: `cspr_cloud`

The first smoke command printed valid output but stayed open because the DB pool kept Node alive. It was stopped and rerun with `closeDb()` in `finally`; the corrected command exited successfully.

## Independent Review

Reviewer: `Beauvoir`

Result: Pass after should-fix items were addressed.

Findings:

1. Should-fix: CSPR.name validation bounded each label but not total name length or label count. Fix: added a DNS-style total length cap of 253 characters before CSPR.cloud lookup and added an overlong-name test.
2. Should-fix: Identifier tests did not cover 404 vs upstream failure behavior. Fix: added tests for public-key 404, public-key upstream failure, CSPR.name 404, and CSPR.name upstream failure.

Reviewer-verified checks:

- `pnpm test -- tests/unit/cspr-cloud.test.ts tests/unit/explorer-search.test.ts tests/unit/explorer-identifier-search.test.ts tests/unit/explorer-search-route.test.ts`
- `pnpm guard:files`

## Deviations From Plan

- Reverse CSPR.name display on account rows was not added because the live account response did not return a name field for the tested account. Forward CSPR.name resolution is implemented.
- Browser test uses a routed API fixture for deterministic UI coverage. Live CSPR.cloud behavior is covered by the separate non-spending smoke.

## Gaps And Risks

- CSPR.name autocomplete, fuzzy search, and reverse name lookup remain out of scope.
- Public-key-to-account conversion depends on CSPR.cloud; no standalone Casper SDK conversion path was added.
- Public-key and CSPR.name lookup resolve accounts only. They do not prove x402 resource URL, MCP tool, provider, policy, or facilitator state for external-only transactions.
- Existing warning-size files remain under the 300-line hard cap.

## Evidence Log

- Plan artifact: `.thoughts/plans/2026-06-24-casper-gw-phase-11-account-identifier-search.md`
- Full CI passed on 2026-06-24 after implementation.
