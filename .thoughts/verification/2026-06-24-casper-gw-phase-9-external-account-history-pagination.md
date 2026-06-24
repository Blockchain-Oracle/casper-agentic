# Verification Audit: Casper GW Phase 9 External Account History Pagination

Date: 2026-06-24
Branch: `feat/casper-gw-phase-0`

## Verdict

Pass.

Phase 9 implements explicit CSPR.cloud-backed external account action pagination for the public explorer without changing the public/private route model or claiming gateway/x402 context for external transactions. Account search now keeps Casper GW receipts first when they exist and attaches a separate external account-history proof stream. External-only account search returns paginated CSPR.cloud WCSPR token-action proof rows.

Initial independent review found one blocker and one should-fix. Both were accepted and fixed. Focused re-review passed with no remaining Blocking or Should-fix findings.

No live spending was required.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-5-explorer-account-search.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-8-explorer-history-pagination.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/raw/repos/x402scan/apps/scan/src/lib/pagination.ts`
- `src/server/cspr-cloud.ts`
- `src/server/external-account-history.ts`
- `src/server/explorer-search.ts`
- `src/app/api/explorer/search/route.ts`
- `src/lib/external-account-detail.ts`
- `src/lib/types.ts`
- `src/components/public-explorer-app.tsx`
- `src/components/screens/explorer-screen.tsx`
- `src/components/explorer/use-explorer-search.ts`
- `src/components/explorer/external-account-history-bar.tsx`
- `tests/unit/cspr-cloud.test.ts`
- `tests/unit/external-account-history.test.ts`
- `tests/unit/explorer-search-route.test.ts`
- `tests/unit/explorer-search.test.ts`
- `tests/browser/smoke.spec.ts`

## Requirement Traceability

- RQ-47: `/explorer` remains public. Evidence: no app-shell route changes; browser smoke still checks no `Primary` authenticated navigation.
- RQ-48: Account search now supports paginated external account action proof through `/api/explorer/search?q=account:<hash>&externalPage=<n>&externalPageSize=<n>`.
- RQ-51: Receipt detail still separates gateway, policy, x402, and Casper layers. External action rows keep policy and x402 marked `unavailable`.
- RQ-52: Public external rows expose CSPR.cloud account/token-action facts only. No CSPR.cloud token, provider credential, wallet key, MCP token, request input, or output is returned.
- RQ-53: External account proof includes account hash, network, payment asset, payment asset balance, action page, total action count, deploy hash, amount, payer, payee, and raw proof link where actions exist.
- RQ-54: The UI states external rows are Casper token-action proof only and do not include Casper GW provider, policy, or x402 context.
- RQ-55: Raw proof links remain `testnet.cspr.live` deploy links when a real action deploy hash exists.
- Failure honesty: rejected CSPR.cloud action-page reads now return `upstream_error` and route-level `503`, not empty proof or `404`.
- Page bounds: requested pages beyond CSPR.cloud `page_count` are clamped by refetching the reported last page, preventing impossible labels like `page 1000 of 3`.

## Acceptance Criteria Coverage

- AC-10: Public explorer and receipt detail remain accessible without app auth or wallet connection. Evidence: browser smoke.
- AC-11: Receipt detail layer separation is preserved. Evidence: `buildExternalAccountDetail` and external-history tests assert unavailable policy/x402 rows.
- AC-12: Public receipt detail redacts secrets and private payloads. Evidence: secret guard passed; external history only uses public indexed token-action fields.
- Phase 9 plan acceptance: external account history uses CSPR.cloud `page` and `page_size`, preserves `item_count`/`page_count`, and does not claim full Casper block explorer coverage.

## Quality Gates

- `pnpm test tests/unit/cspr-cloud.test.ts tests/unit/external-account-history.test.ts tests/unit/explorer-search.test.ts`: passed, 14 tests before review fixes.
- `pnpm test tests/unit/cspr-cloud.test.ts tests/unit/external-account-history.test.ts tests/unit/explorer-search.test.ts tests/unit/explorer-search-route.test.ts`: passed, 18 tests after review fixes.
- `pnpm test tests/unit/external-account-history.test.ts tests/unit/explorer-search.test.ts tests/unit/explorer-search-route.test.ts`: passed, 17 tests after the view-mode race fix.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm guard:files`: passed with warning-only files under 300 lines.
- `pnpm test:browser`: initially failed due to a strict-mode assertion matching two texts; assertion was tightened and rerun passed with 14 tests, 2 intentional mobile skips.
- A later full-CI browser run exposed a real search/history race; explicit history/search view mode fixed it. Focused browser rerun for account-history controls and history-browse clearing passed.
- Non-spending live CSPR.cloud smoke:
  - First eval command failed before network access because `tsx -e` rejected top-level await in CJS output.
  - Rerun with an async wrapper passed.
  - Account: `bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12`
  - Page size: `2`
  - Page 1 result: source `cspr_cloud`, total `6`, total pages `3`, count `2`, first deploy `a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`.
  - Page 2 result: source `cspr_cloud`, page `2`, count `2`, first deploy `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`.
- `pnpm run ci`: passed before review fixes.
  - Frozen install: passed.
  - Guards: passed.
  - Unit tests: 26 files, 114 tests passed.
  - Typecheck: passed.
  - Lint: passed.
  - Browser tests: 14 passed, 2 skipped.
  - Production build: passed.
- Final `pnpm run ci`: passed after review fixes and race fix.
  - Frozen install: passed.
  - Guards: passed with no new source warning from `public-explorer-app.tsx`; existing warning-size files remain under 300 lines.
  - Unit tests: 27 files, 118 tests passed.
  - Typecheck: passed.
  - Lint: passed.
  - Browser tests: 14 passed, 2 skipped.
  - Production build: passed.

## Independent Review

Initial reviewer `Plato` reported:

1. Blocking: `src/server/external-account-history.ts` collapsed rejected CSPR.cloud token-action reads into empty proof/not-found states.
2. Should-fix: requested pages beyond CSPR.cloud `page_count` could render impossible page labels.

Fixes:

- Added `upstream_error` external/search source states.
- `getExternalAccountHistory` now returns `upstream_error` when token-action pagination rejects.
- `/api/explorer/search` maps `upstream_error` to HTTP `503`.
- Added unit coverage for upstream rejection and route status mapping.
- Added page-count clamping with a last-page refetch.
- Added unit coverage for out-of-range page refetch.
- Added explicit history/search view mode so history controls immediately stop rendering exact-search results.
- Focused re-review passed with no remaining Blocking or Should-fix findings.

## Deviations From Plan

- Context7 did not return an exact CSPR.cloud REST API entry; it returned CSPR.click. Current endpoint behavior was verified through official CSPR.cloud docs and non-spending Testnet probes.
- The browser test uses a routed API fixture for deterministic UI coverage. The real CSPR.cloud behavior is covered by the separate non-spending live smoke.

## Gaps And Risks

- This is account-token-action pagination, not a full Casper chain explorer.
- External actions still cannot identify the purchased MCP/API resource unless the payment flowed through Casper GW and has gateway receipt records.
- Public-key and CSPR.name search remain out of scope.
- Contract-wide WCSPR action browsing remains out of scope.
- Existing warning-size files remain under the 300-line hard cap.
- Composite account searches can return HTTP 200 when local Casper GW receipts exist but nested external history is `upstream_error`; this is intentional partial success because the primary local receipt match remains valid.
- Pagination relies on CSPR.cloud returning stable `page_count` and `item_count` metadata after clamp/refetch.

## Follow-ups

- Consider a later plan for public-key/CSPR.name account resolution.
- Consider a later plan for broader contract-wide WCSPR feed browsing if it has product value and rate-limit safeguards.

## Evidence Log

- Plan artifact: `.thoughts/plans/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- Local reference checkpoint used Phase 5 account-search audit, Phase 8 history-pagination audit, raw Casper x402 explorer notes, and x402scan pagination helpers.
- CSPR.cloud live probe confirmed `page_size` is honored and `limit` is ignored for page sizing.
- Full CI passed on 2026-06-24 before review fixes and again after review fixes.
