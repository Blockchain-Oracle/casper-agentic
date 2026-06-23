# Verification Audit: Casper GW Phase 5 Explorer Account Search

Date: 2026-06-23
Branch: `feat/casper-gw-phase-0`
Commits audited: `acd1517`, `bb9260e`

## Verdict

Conditional pass, pending independent review.

The public explorer now supports account/wallet hash search without weakening Phase 4 proof boundaries. Casper GW account matches return rich local receipts first. External account lookup falls back to CSPR.cloud account, token ownership, and configured-token action data, while gateway, policy, and x402 context remain explicitly unavailable.

Local verification, browser smoke, production build, Chrome inspection, and non-spending CSPR.cloud account lookup evidence all passed. Final completion still requires independent review.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-5-explorer-account-search.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-4-public-explorer-proof-lookup.md`
- `src/app/api/explorer/search/route.ts`
- `src/server/explorer-search.ts`
- `src/server/receipt-store.ts`
- `src/server/cspr-cloud.ts`
- `src/lib/external-account-detail.ts`
- `src/lib/external-proof-detail.ts`
- `src/lib/types.ts`
- `src/components/public-explorer-app.tsx`
- `src/components/screens/explorer-screen.tsx`
- `tests/unit/explorer-search.test.ts`
- `tests/browser/smoke.spec.ts`
- CSPR.cloud docs for account FT actions, generic FT token actions, and FT token ownership.

## Requirement Traceability

- RQ-47: `/explorer` remains public. Evidence: browser smoke and Chrome inspection found no `Primary` authenticated nav/sidebar.
- RQ-48: Explorer supports search by receipt id, deploy hash, and now account/wallet hash. Evidence: query parsing in `searchExplorer`, `account:`/`wallet:` prefixes, account-hash prefix normalization, and browser search label update.
- RQ-51: Receipt detail keeps four layers. Evidence: local account matches render persisted receipt layers; external account proof renders unavailable gateway/policy/x402 rows and Casper account/token rows.
- RQ-52: Public receipts redact private inputs/outputs and credentials. Evidence: account lookup returns public CSPR.cloud account/action facts only; `pnpm guard:secrets` passed.
- RQ-53: Casper proof includes account hash, network, payment asset package, token balance, and recent action proof where available. Evidence: `buildExternalAccountDetail`.
- RQ-54: External account proof states that account/token facts do not prove gateway/provider/tool/policy/x402 context. Evidence: external account notes and unavailable rows.
- RQ-55: Real raw proof links point to `testnet.cspr.live` only for real token-action deploy hashes.

## Acceptance Criteria Coverage

- AC-10: Public explorer and receipt detail are accessible without app auth or wallet connection. Evidence: browser smoke and Chrome inspection.
- AC-11: Receipt layer separation is preserved. Evidence: local account search resolved Casper GW account receipts; external account proof kept non-chain layers unavailable.
- AC-12: Public receipt detail redacts private inputs/outputs, provider secrets, MCP tokens, and internal policy config. Evidence: unit tests plus `guard:secrets`.
- Phase 5 extension: account search returns rich Casper GW receipts first and external CSPR.cloud account proof only when no local gateway match exists.

## Quality Gates

- `pnpm run ci`: passed.
  - Frozen install: passed.
  - File guard: passed with existing warnings only:
    - `src/components/screens/test-console-screen.tsx`: 232 lines.
    - `src/server/live-paid-call.ts`: 238 lines.
    - `tests/unit/explorer-search.test.ts`: 242 lines.
    - `tests/unit/live-paid-call.test.ts`: 290 lines.
  - Product guard: passed.
  - Secret guard: passed.
  - Vitest: 22 files, 94 tests passed.
  - Typecheck: passed.
  - Lint: passed.
  - Browser smoke: 10 tests passed, 2 intentional mobile skips.
  - Production build: passed.
- Targeted tests:
  - `pnpm test tests/unit/explorer-search.test.ts tests/unit/receipt-store.test.ts`: passed.
  - `pnpm test tests/unit/explorer-search.test.ts`: passed after account-hash prefix regression fix.
- Chrome inspection: passed.
  - `/explorer` showed account-search label.
  - Account search for the Phase 3 wallet showed `Casper GW account receipts`, `CSPR.trade MCP`, and no authenticated app nav.

## Live Proof Evidence

Local account search:

- Query: `account:bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12`
- Result source: `casper_gw_account`
- Matched local receipts: `3`
- Selected status: `settled`

External account proof lookup:

- Command path: direct `searchExplorer(...)` call with `CSPR_CLOUD_API_KEY` loaded and `DATABASE_URL` temporarily unset so local receipts would not short-circuit the external path.
- Query: `account:bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12`
- Result source: `external_account_proof`
- Status: `external_proof`
- Casper rows: account hash, network, public key, CSPR gas balance, payment asset package, payment asset balance, recent payment actions, latest deploy hash, latest amount, latest payer, latest payee, latest raw proof.

## Deviations From Plan

- Full account-history pagination remains deferred. The external account proof shows a bounded recent slice from CSPR.cloud.
- CSPR.name resolution remains deferred.
- The configured payee value in `.env.local` appears to be a 66-character public-key style value, not a 64-character account hash, so live external account smoke used the known Phase 3 payer wallet account hash.

## Gaps And Risks

- Independent review is pending.
- Account-wide search is not a replacement for CSPR.live and does not claim full chain history.
- External account proof depends on `CSPR_CLOUD_API_KEY`; without it, the search returns `unconfigured`.
- `tests/unit/explorer-search.test.ts` is over the 200-line warning target but under the 300-line hard cap.

## Follow-ups

- Add explicit pagination/cursor UI only after a dedicated plan.
- Split `tests/unit/explorer-search.test.ts` if the next explorer slice expands it further.
- Consider accepting public-key account inputs only after confirming the correct CSPR.cloud account-identifier semantics and adding tests.

## Evidence Log

- Plan commit: `acd1517 docs: plan explorer account search`.
- Implementation commit: `bb9260e feat: add explorer account search`.
- `pnpm run ci`: passed with 94 tests, browser smoke, and production build.
- Chrome inspection: passed for local account search.
- Non-spending external account lookup: passed through CSPR.cloud.
