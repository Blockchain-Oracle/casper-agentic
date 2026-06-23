# Plan: Casper GW Phase 2 Wallet Readiness And Policy

Date: 2026-06-23
Status: Draft for execution after Phase 1 verification

## Inputs

- `.thoughts/README.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-1-provider-gateway.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-1-provider-gateway.md`
- Current repo state at `abeb955`.

## Assumptions

- Phase 0 and Phase 1 are satisfied locally.
- CSPR.cloud remains the real account/balance/FT ownership data path.
- The current local signer is only for integration verification, not final wallet UX.
- CSPR.click/browser signing remains later product work.
- Wallet Phase 2 must not run a live paid call; it prepares wallet readiness and fail-closed policy for the Phase 3 paid console.
- `CASPER_PAYEE_ACCOUNT_HASH`, `CSPR_CLOUD_API_KEY`, `DATABASE_URL`, and WCSPR package configuration stay server-side.

## Open Questions

- Which wallet profile should be the primary judge wallet if multiple Testnet accounts exist?
- Should Phase 2 create a new generated Testnet wallet profile, or only register/connect an Abu-provided Testnet account hash/public key?
- Should the UI include a direct WCSPR wrap action in this phase, or only show fund/wrap instructions and readiness polling?

## Prototype Reintegration Gate

- No static `funded` or `ready` pill may be treated as implementation truth.
- Wallet readiness must be derived from CSPR.cloud account gas balance plus CEP-18/WCSPR ownership balance.
- Spend policy must block before signing/payment and must create an auditable record without a Casper transaction.
- Do not implement production custody or claim CSPR.click signing until a real browser wallet signing path is built and verified.
- Keep wallet policy as spend/permission controls for agent paid tool calls. Do not introduce a generic send-policy product.

## Phase 2A: Wallet Store And Real Readiness APIs

### Goal

Persist wallet profiles and expose real CSPR.cloud readiness results for each wallet.

### Work

- Add `src/server/wallet-store.ts` for wallet profile CRUD and latest policy lookup.
- Add `GET /api/wallets` and `POST /api/wallets`, operator-gated.
- Update `GET /api/wallets/[id]/readiness` to resolve a persisted wallet id or account hash before calling CSPR.cloud.
- Return readiness with separate CSPR gas balance, WCSPR payment-asset balance, network, payment asset, ready verdict, and reason.
- Preserve signing-mode honesty: local/test signer or connected/browser signer labels only, no production custody claim.

### Real Integration Path

CSPR.cloud account and FT ownership queries are real. Wallet profile creation is datastore-backed. No on-chain transaction is created in this phase.

### Mock/Simulation Policy

Fixtures can remain only where clearly labeled as sample UI fallback. Readiness verdicts in real routes must not use fixture balances.

### Checks

- Unit/API tests for wallet create/list, secret redaction, id/account-hash readiness resolution, and missing CSPR.cloud config.
- Existing `pnpm verify` and product/secret guards.

### Acceptance Criteria Covered

RQ-20 to RQ-26, RQ-56 to RQ-60; AC-04 and AC-05 partially.

### Stop Condition

A persisted wallet profile can be queried for readiness, and the response is derived from CSPR.cloud gas + WCSPR balance evidence.

## Phase 2B: Spend Policy Persistence And Fail-Closed Evaluation

### Goal

Persist per-wallet spend policy and evaluate policy before any wallet signing/payment path.

### Work

- Add policy create/read routes under `/api/wallets/[id]/policy`.
- Validate max-per-call, allowed network, allowed asset, allowed tools, disabled state, and optional daily/session limit fields.
- Make policy evaluation use persisted wallet policy where available.
- Persist policy decisions/audit records for allowed and blocked attempts.
- Ensure blocked policy attempts cannot call x402 verify/settle or create a Casper deploy.

### Real Integration Path

Policy persistence and decision records are real Postgres records. No x402 settlement is attempted for blocked calls.

### Mock/Simulation Policy

Unit test fixtures are allowed. Product UI must not present policy-block scenario toggles as real controls.

### Checks

- Unit tests for policy validation, allow/block decisions, disabled policy, wrong network/asset/tool, and no-settlement behavior.
- API tests for create/read policy routes.

### Acceptance Criteria Covered

RQ-27 to RQ-29, RQ-36 to RQ-38, RQ-50, RQ-57 to RQ-59; AC-06.

### Stop Condition

A policy-blocked call path creates a persisted policy/audit record and no Casper transaction or x402 settlement record.

## Phase 2C: Minimal Wallet UI Wiring

### Goal

Replace the wallet fixture readiness panel with real wallet profile, readiness, and policy API wiring while avoiding broad redesign.

### Work

- Add wallet registration controls for account hash/public key/signing mode.
- Load persisted wallet profiles.
- Poll or refresh readiness from `/api/wallets/[id]/readiness`.
- Show separate gas and WCSPR readiness states.
- Wire policy form to persisted policy route.
- Keep funding/wrap action honest: either instructions or an explicitly operator-triggered command path, no fake funded transition.

### Real Integration Path

UI reads Postgres wallet/policy data and CSPR.cloud readiness. Funding itself is not claimed unless a real on-chain balance change is observed.

### Mock/Simulation Policy

Any remaining wallet activity or historical receipts shown from fixtures must be labeled sample data at point of use.

### Checks

- Browser smoke for wallet route showing no fake production custody claim and no fake ready state.
- Browser smoke for public explorer still public/no sidebar.
- `pnpm verify`, `pnpm run ci`.

### Acceptance Criteria Covered

AC-05, AC-06, AC-08, AC-10, AC-13.

### Stop Condition

The operator can register/load a Testnet wallet, refresh real CSPR.cloud readiness, save spend policy, and see truthful blockers without fake funding/proof claims.

## Verification Checkpoint

Before claiming Phase 2 complete:

- Run `pnpm verify`.
- Run `pnpm run ci`.
- Run a non-payment wallet readiness smoke against a real Testnet wallet/account hash.
- Write `.thoughts/verification/YYYY-MM-DD-casper-gw-phase-2-wallet-readiness-policy.md`.
- Spawn an independent reviewer for wallet secret handling, policy fail-closed behavior, fixture leakage, and proof honesty.
- Fix blockers before PR/handoff.

## Handoff Notes

- Do not run `pnpm smoke:live` as part of Phase 2 unless Phase 3 starts; it spends WCSPR.
- Do not store private keys, seed phrases, or browser wallet authorization in Postgres.
- A wallet can be `registered` without being `ready`; only CSPR.cloud balances can make it ready.
- No GitHub PR can be opened until a remote is configured in this checkout.
