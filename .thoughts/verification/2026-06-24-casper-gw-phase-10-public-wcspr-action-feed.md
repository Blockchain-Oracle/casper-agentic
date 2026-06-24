# Verification Audit: Casper GW Phase 10 Public WCSPR Action Feed

Date: 2026-06-24
Branch: `feat/casper-gw-phase-0`

## Verdict

Pass.

Phase 10 adds a bounded public feed for the configured WCSPR token-action stream through CSPR.cloud. The feed is public explorer infrastructure, not an authenticated dashboard surface. It does not claim every WCSPR action is a Casper GW/x402 receipt. External rows are rendered as `external_proof`; gateway context, policy decision, and x402 verify/settle are explicitly unavailable unless a separate Casper GW receipt exists.

No live spending was required.

Independent reviewer `Socrates` found no Blocking or Should-fix findings. The reviewer confirmed the feed remains public, bounded, proof-only, and does not leak CSPR.cloud keys, wallet keys, provider credentials, client tokens, or upstream payloads.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/raw/repos/x402scan/apps/scan/src/lib/pagination.ts`
- `src/server/cspr-cloud.ts`
- `src/server/external-action-feed.ts`
- `src/app/api/explorer/actions/route.ts`
- `src/lib/external-action-detail.ts`
- `src/lib/types.ts`
- `src/components/public-explorer-app.tsx`
- `src/components/explorer/external-action-feed-bar.tsx`
- `src/components/explorer/use-external-action-feed.ts`
- `src/components/explorer/public-explorer-header.tsx`
- `tests/unit/external-action-feed.test.ts`
- `tests/unit/explorer-actions-route.test.ts`
- `tests/browser/explorer-feed.spec.ts`
- `playwright.config.ts`

## Requirement Traceability

- Public explorer remains public: `/explorer` exposes the feed with no sign-in, wallet connection, authenticated app sidebar, or app shell.
- External WCSPR feed is bounded to the configured payment asset package and CSPR.cloud REST pagination.
- External rows use status `external_proof`, not `settled`.
- External rows separate layers:
  - gateway context: gateway receipt not found,
  - policy decision: unavailable,
  - x402 verify/settle: unavailable,
  - Casper proof: network, package hash, deploy hash, amount, payer, payee, action type, block height, transform index, page metadata, and raw proof link.
- CSPR.cloud failures are not treated as empty proof. Missing config and upstream failures return explicit `unconfigured` or `upstream_error` states; the route maps those to `503`.
- Out-of-range feed pages clamp/refetch the last CSPR.cloud page instead of rendering impossible page labels.
- No broad redesign, private registry, sandbox, simulated/local mode, CSPR.click signing, Mainnet, or production custody was introduced.

## Acceptance Criteria Coverage

- Public explorer can browse configured-token actions that did not necessarily pass through Casper GW.
- Chain/indexer proof is separated from Casper GW-specific receipt context.
- The UI states that feed rows are public token-action proof only and not Casper GW receipts unless a gateway record matches.
- The browser smoke checks the feed on desktop and mobile and confirms the authenticated app sidebar is absent.

## Quality Gates

- Context7 Playwright docs checked:
  - `/microsoft/playwright`
  - Query: `Playwright Test defineConfig workers fullyParallel local CI worker configuration`
  - Result used: `workers` is the supported config property for limiting parallel test processes.
- Focused unit tests:
  - `pnpm test -- tests/unit/external-action-feed.test.ts tests/unit/explorer-actions-route.test.ts`
  - Passed as part of the full unit suite: 29 files, 125 tests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm guard:files`: passed with existing warning-size files under 300 lines.
- Focused browser test:
  - `pnpm exec playwright test tests/browser/explorer-feed.spec.ts`
  - Passed: 2 tests.
- First full `pnpm run ci` attempt:
  - Unit, typecheck, lint, and guards passed.
  - Browser run failed with desktop navigation timeouts across multiple tests while mobile tests later passed.
  - Diagnosis: local Playwright run used too many parallel workers against the Next production server. This was a stability failure in local test orchestration, not a feed assertion failure.
  - Fix: cap local Playwright workers at `2`; GitHub CI remains `1`.
- `pnpm test:browser` after worker cap:
  - Passed: 16 browser tests, 2 intentional mobile skips.
- Final `pnpm run ci`:
  - Frozen install: passed.
  - File/product/secret guards: passed.
  - Unit tests: 29 files, 125 tests passed.
  - Typecheck: passed.
  - Lint: passed.
  - Browser tests: 16 passed, 2 intentional mobile skips.
  - Production build: passed.

## Live Non-Spending Smoke

Initial direct CSPR.cloud probe before implementation:

- Endpoint shape: `GET /ft-token-actions?contract_package_hash=<WCSPR>&page=1&page_size=4`
- Result: HTTP 200 with `item_count`, `page_count`, and `data`.
- Total actions: `4870`
- Total pages at page size 4: `1218`
- First deploy: `a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`
- First amount: `7500000000`
- First package: `3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e`

Post-implementation smoke through `getExternalActionFeed`:

- First inline `tsx -e` command failed before code execution because top-level await is not supported in the CJS inline output mode.
- Rerun with async wrapper passed.
- Source: `cspr_cloud`
- Total actions: `4870`
- Total pages: `1218`
- Page: `1`
- Returned rows: `4`
- First receipt id: `external-action:a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e:16`
- First receipt status: `external_proof`

## Independent Review

Reviewer: `Socrates`

Result: Pass, no Blocking or Should-fix findings.

Reviewer checks:

- `pnpm test -- tests/unit/external-action-feed.test.ts tests/unit/explorer-actions-route.test.ts`: passed.
- `pnpm guard:files`: passed with existing warning-only files under the 300-line hard cap.
- `pnpm exec playwright test tests/browser/explorer-feed.spec.ts`: passed on desktop and mobile.

Reviewer residual risks:

- Browser feed test uses a routed fixture; live CSPR.cloud behavior is covered by the separate non-spending smoke.
- Pagination depends on CSPR.cloud continuing to return stable `item_count` and `page_count`.

## Deviations From Plan

- The implementation adds a local Playwright worker cap because the first full browser run exposed a local server-concurrency flake. This is a quality/stability change, not a product change.
- The browser feed test uses a routed API fixture for deterministic UI coverage. The real CSPR.cloud behavior is covered by the non-spending live smoke.

## Gaps And Risks

- This is a bounded WCSPR token-action feed, not a full Casper block explorer.
- External WCSPR actions cannot reveal MCP/API resource URL, provider, tool, policy decision, or facilitator verification unless the call also has Casper GW receipt records.
- CSPR.cloud Streaming is not implemented in this phase.
- Public-key and CSPR.name search remain out of scope.
- Existing warning-size files remain under the 300-line hard cap.
- Pagination relies on CSPR.cloud continuing to return stable `item_count` and `page_count` metadata.

## Evidence Log

- Plan artifact: `.thoughts/plans/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`
- Local reference checkpoint used Phase 9 account-history audit, raw Casper x402 explorer notes, prototype reintegration handoff, and x402scan pagination helpers.
- Full CI passed after the Playwright worker cap.
