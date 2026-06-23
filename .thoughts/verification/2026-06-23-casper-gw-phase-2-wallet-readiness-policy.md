# Verification Audit: Casper GW Phase 2 Wallet Readiness And Policy

Date: 2026-06-23
Branch: `feat/casper-gw-phase-0`
Commits audited: `be179cc`, `b1fdfff`, `c05875a`, `5c0d997`

## Verdict

Pass for the Phase 2 scope.

Phase 2 implements persisted wallet profiles, real CSPR.cloud readiness checks for CSPR gas plus WCSPR, persisted spend policies, fail-closed policy evaluation before x402 signing/payment, minimal wallet UI wiring, browser smoke coverage, and review-fix hardening. Independent review initially failed the checkpoint with two blocking findings and one should-fix; commit `5c0d997` fixed all three, and re-review passed. Phase 2 intentionally does not claim production custody, browser-wallet signing, Mainnet support, or a new live paid settlement.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-2-wallet-readiness-policy.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Diff from `3860346..5c0d997`
- Local CI output from `pnpm run ci`
- Independent review result from reviewer `Bacon`

## Requirement Traceability

- Persisted wallet profiles: implemented in `src/server/wallet-store.ts`, `GET /api/wallets`, and `POST /api/wallets`.
- Casper account normalization: implemented in `src/server/casper-account.ts`; x402 signer addresses with `00` prefix normalize to CSPR.cloud account hashes.
- Real readiness: implemented in `src/server/wallet-readiness.ts` and `GET /api/wallets/[id]/readiness`.
- CSPR.cloud FT ownership path: implemented in `src/server/cspr-cloud.ts` with account-scoped `ft-token-ownership` lookup.
- Persisted spend policy: implemented in `src/server/spend-policy-store.ts`, Drizzle `spend_policies`, and `POST/GET /api/wallets/[id]/policy`.
- Day/session policy fields: `session_limit` migration added; policy evaluator checks daily and session headroom when values are present.
- Fail-closed paid-call path: `src/server/live-paid-call.ts` loads stored policy and blocks before payment payload creation, facilitator verify, settle, or Casper deploy.
- Pre-policy attempt safety: pre-policy persisted attempts use `policy_pending`, not proof-pending status, and receipt rendering treats that state as no x402/no Casper transaction.
- Effective duplicate-account policy display: wallet policy API reads the effective account-hash policy path used by live evaluation.
- Wallet network safety: wallet profile creation uses server-owned `config.casperNetwork` and rejects mismatched client network overrides.
- Minimal UI wiring: implemented in `use-wallet-control`, `wallet-screen`, and `gateway-app`.
- Public explorer separation: unchanged and covered by browser smoke.
- Rejected surfaces: no registry/private tools, sandbox product mode, Simulated/Local product mode, generic send-policy product, or fake deploy hash was introduced.

## Acceptance Criteria Coverage

- AC-05: Operator can create/load wallet profiles and refresh readiness from real CSPR.cloud data. Covered by API tests and non-payment readiness smoke.
- AC-06: Spend policy blocks unsafe calls before signing/payment and produces no Casper transaction. Covered by unit tests and real no-payment policy-block smoke.
- AC-08: Paid console receives real wallet profiles from the wallet-control hook instead of fixture wallet state.
- AC-10: Public explorer remains public/no app sidebar. Covered by browser smoke on desktop and mobile.
- AC-13: Wallet UI avoids fake funded state; readiness comes from the readiness API, and sample receipt history is labeled.
- RQ-20 to RQ-26: Wallet profile, signing-mode honesty, readiness evidence, and funding blockers are represented.
- RQ-27 to RQ-29: Spend policy supports max per call, day/session headroom fields, allowed tools, network/asset, disabled state, and fail-closed blocking.
- RQ-56 to RQ-60: Secrets and signing material remain server-side and are not printed in smoke output.

## Quality Gates

- `pnpm verify`: passed.
  - File guard: passed with all active source files under the configured hard cap and current target warnings cleared.
  - Product guard: passed.
  - Secret guard: passed.
  - Vitest: 20 files, 72 tests passed.
  - Typecheck: passed.
  - Lint: passed.
- `pnpm test:browser`: passed.
  - 10 browser tests passed.
  - 2 mobile-only skips were intentional for desktop-targeted provider/wallet checks.
- `pnpm run ci`: passed.
  - Frozen install, verify, browser smoke, and `next build` passed.

## Independent Review

Reviewer `Bacon` returned an initial **FAIL** with three findings:

- Blocking: pre-policy attempts were initialized as `raw_proof_unavailable`, which could leave a proof-pending receipt if policy evaluation threw before status update.
- Blocking: wallet policy API read by selected wallet id while live evaluation used newest policy across duplicate account hashes.
- Should-fix: wallet profile creation accepted client-supplied network, allowing a non-Testnet displayed wallet to receive Testnet readiness evidence.

Fix commit `5c0d997` resolved the findings:

- Added `policy_pending` receipt status for pre-policy attempts and rendered it as no x402/no Casper transaction.
- Changed wallet policy GET to return the effective policy by normalized wallet account hash.
- Rejected wallet network overrides and always stored the server-owned Casper network.
- Added regression tests for all three paths.

Re-review verdict: **PASS**, with no remaining blocking or should-fix issues.

## Live And Non-Payment Evidence

- Phase 2A readiness smoke:
  - wallet id `85154abb-62c5-4107-b7e3-c48b3c98e281`;
  - CSPR gas detected;
  - WCSPR detected;
  - readiness verdict `ready`;
  - no CSPR.cloud token or signing material printed.
- Phase 2B policy-block smoke:
  - blocked attempt id `7200a0f5-72e4-48c1-b0b1-8dea7acf9e48`;
  - block reason `payment amount exceeds max per call`;
  - no payment payload, x402 verify, settle, deploy hash, or Casper proof claim created;
  - an allow policy was restored afterward for the signer wallet.
- Phase 2C browser smoke:
  - `/app` wallet screen exposes wallet load, wallet save, and spend policy save controls;
  - old fixture wording `ready fixture` and `Hosted encrypted signer` is absent from the wallet surface;
  - `/explorer` remains public and separate from the app shell.
- Review-fix regression coverage:
  - policy evaluation failure after attempt insert does not create proof-pending status;
  - `policy_pending` receipt detail has no Casper proof;
  - wallet policy API asks for effective account-hash policy;
  - wallet create rejects network override.

## Deviations From Plan

- Phase 2 does not run a new paid x402 settlement. This is intentional; the plan says not to spend WCSPR in Phase 2 and to reserve paid-console settlement for Phase 3.
- Browser wallet signing and CSPR.click are not implemented. The UI only records signing-mode labels and does not claim production custody.
- Wallet loading is explicit through a button after operator access is entered; the app does not persist the operator token in browser storage.
- The wallet activity panel still uses sample receipt history, but it is labeled as sample history at point of use.
- No GitHub PR was opened because no remote is configured in this checkout.

## Gaps And Risks

- A direct browser test that fills the operator token and loads real wallet records was not added to normal CI to avoid putting secrets into browser test flows.
- Duplicate wallet profiles are allowed. Policy lookup was hardened to use the newest policy across matching account hashes, but future UX should reduce duplicate profile creation.
- Daily spend aggregation uses stored paid-call attempt statuses as its source of truth; a richer session model can be added in Phase 3 when the paid console owns session ids.
- Wallet funding/wrapping actions are not exposed as UI actions yet; readiness reflects detected chain state only.

## Follow-ups

- Add authenticated browser smoke with an injected operator token only if Abu wants secret-backed browser tests.
- Add UI affordances for funding/wrapping instructions or operator-triggered wrap only after the funding UX is explicitly accepted.
- Phase 3 should wire paid-console settlement through the saved wallet policy and preserve the same no-fake-proof rules.

## Evidence Log

- Phase 2A commit: `be179cc feat: add wallet readiness checkpoint`.
- Phase 2B commit: `b1fdfff feat: add wallet spend policy gate`.
- Phase 2C commit: `c05875a feat: wire wallet control ui`.
- Review-fix commit: `5c0d997 fix: close wallet policy review gaps`.
- Local migration applied: `drizzle/0001_fixed_mattie_franklin.sql`.
- Full local CI: `pnpm run ci` passed after `5c0d997`.
- Independent re-review: PASS after `5c0d997`.
