# Verification Audit: Casper GW Phase 4 Public Explorer Proof Lookup

Date: 2026-06-23
Branch: `feat/casper-gw-phase-0`
Commits audited: `a61193b`, `92b611c`

## Verdict

Conditional pass, pending independent review.

The public explorer now supports two proof paths without mixing their trust boundaries:

- Casper GW receipt/deploy lookup resolves rich four-layer gateway receipts from the local datastore.
- Unknown deploy-hash lookup falls back to CSPR.cloud and renders limited external Casper proof with gateway, policy, and x402 context explicitly unavailable.

Local verification, browser smoke, production build, Chrome inspection, and non-spending CSPR.cloud lookup evidence all passed. Final completion still requires independent review.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-4-public-explorer-proof-lookup.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `src/app/api/explorer/search/route.ts`
- `src/server/explorer-search.ts`
- `src/server/receipt-store.ts`
- `src/lib/external-proof-detail.ts`
- `src/lib/types.ts`
- `src/components/public-explorer-app.tsx`
- `src/components/screens/explorer-screen.tsx`
- `tests/unit/explorer-search.test.ts`
- `tests/browser/smoke.spec.ts`
- CSPR.cloud docs for deploy and FT action lookup.

## Requirement Traceability

- RQ-47: `/explorer` remains public. Evidence: browser smoke and Chrome inspection found no `Primary` authenticated nav/sidebar.
- RQ-48: Explorer supports search by receipt id or deploy hash. Evidence: `GET /api/explorer/search?q=...`, `searchExplorer`, and the public search input.
- RQ-51: Receipt detail keeps four layers. Evidence: existing persisted receipt detail still renders gateway, policy, x402, and Casper panels; external proof detail renders unavailable rows for non-chain layers rather than merging them.
- RQ-52: Public receipts redact private inputs/outputs and credentials. Evidence: no new route returns secrets; external lookup returns only CSPR.cloud deploy/action facts; `pnpm guard:secrets` passed.
- RQ-53: Casper proof includes deploy hash, network, status, raw proof link, and token-action payer/payee/amount when available. Evidence: `buildExternalProofDetail` and live external lookup rows.
- RQ-54: Explorer states Casper proof covers payment/deploy facts only, not full gateway context. Evidence: external x402/policy notes explicitly say unavailable/not attached.
- RQ-55: Real deploy links point to `testnet.cspr.live`. Evidence: external and gateway proof paths render raw proof links only from real hashes.

## Acceptance Criteria Coverage

- AC-10: Public explorer and receipt detail are accessible without app auth or wallet connection. Evidence: browser smoke and Chrome inspection.
- AC-11: Receipt layer separation is preserved. Evidence: Casper GW receipt hash search resolved the Phase 3 receipt with full gateway context, while external hash search showed gateway/policy/x402 as unavailable.
- AC-12: Public receipt detail redacts private inputs/outputs, provider secrets, MCP tokens, and internal policy config. Evidence: unit tests plus `guard:secrets`.
- Phase 4 extension: unknown deploy hashes can still resolve as external Casper proof without pretending to be Casper GW receipts. Evidence: CSPR.cloud lookup for wrap transaction hash `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`.

## Quality Gates

- `pnpm verify`: passed.
  - File guard: passed with existing warnings only:
    - `src/components/screens/test-console-screen.tsx`: 232 lines.
    - `src/server/live-paid-call.ts`: 238 lines.
    - `tests/unit/live-paid-call.test.ts`: 290 lines.
  - Product guard: passed.
  - Secret guard: passed.
  - Vitest: 22 files, 88 tests passed.
  - Typecheck: passed.
  - Lint: passed.
- `pnpm test:browser`: passed.
  - 10 browser tests passed.
  - 2 intentional mobile skips.
- `pnpm build`: passed.
- `pnpm run ci`: passed.
  - frozen install, guards, 88 tests, typecheck, lint, browser smoke, and production build.
- Chrome inspection: passed.
  - `/explorer` showed search controls and no authenticated primary nav.
  - External hash search showed `External Casper proof`, raw proof link, and unavailable x402 context.
  - Gateway deploy hash search showed `Casper GW receipt`, `CSPR.trade MCP`, and `Settled`.

## Live Proof Evidence

Non-spending CSPR.cloud lookup:

- Command path: direct `searchExplorer(...)` call with env from `.env.local`.
- Query: `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`
- Result source: `external_casper_proof`
- Status: `external_proof`
- Casper rows: deploy hash, network, deploy status, block height, timestamp, payment asset package, amount, payer, payee, token action, raw proof.

Gateway receipt precedence lookup:

- Query: `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`
- Result source: `casper_gw_receipt`
- Attempt id: `dfb14079-44e0-4006-b66f-99e1f22f0fc0`
- Provider: `CSPR.trade MCP`
- Status: `settled`

## Deviations From Plan

- Account-hash search remains limited to filtering displayed Casper GW receipts. Chain-wide account indexing is intentionally deferred.
- External lookup currently targets deploy hashes only.
- External proof uses the configured payment asset package to look for matching token actions. Non-WCSPR deploys can still show raw deploy proof but will not show a payment-token action.

## Gaps And Risks

- Independent review is pending.
- External lookup depends on `CSPR_CLOUD_API_KEY`; without it, the API returns `unconfigured` and does not claim external proof.
- CSPR.cloud response latency can make first external lookup slower than DB-backed receipt lookup.
- The external proof status is a new receipt status used for public display, not a paid-call attempt status in Postgres.

## Follow-ups

- Add account-hash search with pagination only after a dedicated plan.
- Add richer external non-WCSPR deploy display if Abu wants generic Casper deploy inspection beyond x402 payment proof.
- Consider caching external proof lookups if public traffic grows.

## Evidence Log

- Plan commit: `a61193b docs: plan public explorer proof lookup`.
- Implementation commit: `92b611c feat: add public explorer proof lookup`.
- `pnpm verify`: passed with 88 tests.
- `pnpm test:browser`: passed with 10 tests and 2 intentional skips.
- `pnpm build`: passed.
- `pnpm run ci`: passed.
- Chrome inspection: passed for external proof and Casper GW receipt search paths.
