# Verification Audit: Phase 23 Wallet Signing Readiness Boundary

## Verdict

Pass.

Phase 23 removes stale hosted-custody language and adds a truthful wallet-signing readiness contract. It does not install CSPR.click, does not implement browser signing, does not change x402 settlement, and does not claim production custody.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-2-wallet-readiness-policy.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- Context7 CSPR.click docs for transaction signing/sending, active public-key requirement, status updates, cancellation, errors, and timeout.

## Requirement Traceability

| Requirement | Evidence | Status |
| --- | --- | --- |
| Remove stale hosted-custody language from active source. | `src/components/screens/settings-screen.tsx` now says Testnet signer integration path, integration verification only, CSPR.click not enabled, and production custody not claimed. `src/lib/fixture-records.ts` no longer says `Hosted encrypted signer`. | Pass |
| Prevent stale hosted-custody wording from returning. | `scripts/guard-product-scope.mjs` now rejects `Hosted encrypted signer` in active source. | Pass |
| Expose signing readiness without secrets. | `src/server/wallet-signing-readiness.ts` returns status only; tests assert signer PEM content and paths are absent. | Pass |
| Keep CSPR.click/browser signing disabled. | Readiness returns `browserWallet.status: "not_enabled"` and lists future gates. | Pass |
| Preserve policy-before-signing. | Readiness returns `policyTiming: "before_signing"`; no payment code was changed. | Pass |
| Keep files under quality limits. | All changed active source/test files remain under 200 lines; `pnpm run guard:files` passed. | Pass |

## Acceptance Criteria Coverage

- API health:
  - `GET /api/health/integrations` now includes `walletSigning`.
  - `tests/unit/integration-health-route.test.ts` verifies CSPR.click is not enabled and signer material is not exposed.
- Server readiness model:
  - `tests/unit/wallet-signing-readiness.test.ts` covers configured signer, missing signer config, CSPR.click future gates, and redaction.
- UI copy:
  - `tests/browser/smoke.spec.ts` verifies settings show configured Testnet signer, integration verification only, CSPR.click not enabled, and no hosted encrypted signer copy.

## Quality Gates

- `pnpm exec vitest run tests/unit/wallet-signing-readiness.test.ts tests/unit/integration-health-route.test.ts`
  - Passed: 2 files, 6 tests.
- `pnpm run guard:product`
  - Passed.
- `pnpm run guard:secrets`
  - Passed.
- `pnpm run guard:files`
  - Passed.
- `pnpm exec playwright test tests/browser/smoke.spec.ts --project=chromium`
  - Passed: 9 browser tests.
- `pnpm typecheck`
  - Passed.
- `pnpm lint`
  - Passed.
- `pnpm run ci`
  - Passed: frozen install, verify, 176 unit tests, 19 browser tests, 3 intentional mobile skips, production build.

## Independent Review

- Reviewer `Noether` found no product-boundary issues:
  - No CSPR.click/browser signing claim, production custody claim, hosted custody claim, public explorer/feed change, or payment/x402 behavior change was found.
- Reviewer `Lorentz` found one Should-fix:
  - Settings copy said `Configured Testnet signer`, which could conflict with health metadata when signer env is missing.
  - Fix: settings now uses the non-stateful label `Testnet signer integration path`, and browser smoke was updated.
  - Focused browser smoke, unit tests, product guard, secret guard, and file guard passed after the fix.

## Deviations From Plan

None.

The plan intentionally stopped before CSPR.click SDK installation, wallet approval UI, browser payment payloads, and settlement changes.

## Gaps And Risks

- CSPR.click/browser signing is still not implemented.
- Future browser signing must prove active wallet public-key matching, user cancellation/error/timeout handling, policy-before-approval, and CSPR.cloud proof resolution.
- The current live x402 proof path still uses the configured Testnet signer for integration verification only.

## Follow-ups

- Request independent review for custody overclaiming, secret leakage, and accidental payment-path changes.
- If accepted later, write a real CSPR.click signing plan that proves one browser-approved Testnet x402 payment without falling back to the Testnet signer.

## Evidence Log

- Added plan artifact: `.thoughts/plans/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`.
- Added readiness module: `src/server/wallet-signing-readiness.ts`.
- Updated health route: `src/app/api/health/integrations/route.ts`.
- Updated settings copy: `src/components/screens/settings-screen.tsx`.
- Updated stale fixture signing labels: `src/lib/fixture-records.ts`.
- Hardened product guard: `scripts/guard-product-scope.mjs`.
- Added/updated tests: `tests/unit/wallet-signing-readiness.test.ts`, `tests/unit/integration-health-route.test.ts`, `tests/browser/smoke.spec.ts`.
