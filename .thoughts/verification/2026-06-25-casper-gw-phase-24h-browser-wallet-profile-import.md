# Verification: Phase 24H Browser-Wallet Profile Import

Date: 2026-06-25

## Scope

This slice removes a blocker before the live CSPR.click x402 smoke test: Casper GW can now create a `browser-wallet` profile from the active CSPR.click public key, derive the matching Casper account hash, and share one browser CSPR.click connection between the wallet screen and paid-tool console.

It does not run a wallet approval, sign an x402 payment, settle through the facilitator, or create a new Casper deploy hash.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24g-csprclick-primary-source-refresh.md`
- Installed CSPR.click skill:
  - `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`
- Context7:
  - `/websites/cspr_click`
  - `/make-software/csprclick-examples`

## CSPR.click Contract Reconfirmed

- `getActiveAccountAsync()` returns the active session account or no active account.
- `csprclick:signed_in` exposes `evt.account.public_key`.
- `signTypedData(params, signingPublicKey)` requires the signing public key to match the active account public key.

## Code Changes

- Added `src/lib/casper-public-key.ts` for Casper public-key normalization and account-hash derivation using `casper-js-sdk`.
- Added `src/components/screens/use-csprclick-browser-connection.ts` so app screens share one CSPR.click browser connection and event listener path.
- Added wallet profile import controls:
  - connect CSPR.click wallet,
  - show active public key,
  - use active CSPR.click wallet,
  - store public key alongside the wallet profile.
- Updated wallet creation validation:
  - malformed public keys fail closed,
  - `browser-wallet` profiles require a public key,
  - provided public keys must derive the submitted account hash.
- Updated the paid-tool console to consume the shared browser connection instead of initializing CSPR.click separately.
- Split `src/components/screens/wallet-profile-view.ts` out of the wallet hook to keep active source files below the file-size warning threshold.

## Product Boundaries

- No local signer fallback was added to the browser-wallet path.
- No CSPR.cloud token, provider credential, endpoint token, or private key is exposed to browser state or receipts.
- No public explorer behavior changed.
- No settlement/deploy proof is claimed for this slice.

## Verification Commands

Focused tests:

```bash
pnpm exec vitest run tests/unit/csprclick-browser-session.test.ts tests/unit/browser-paid-call-flow.test.ts tests/unit/casper-public-key.test.ts tests/unit/wallet-store.test.ts tests/unit/wallet-routes.test.ts --reporter=dot
```

Result: 5 files passed, 24 tests passed.

Guards:

```bash
pnpm run guard:files
pnpm run guard:product
pnpm run guard:secrets
```

Result: passed with no file-size warnings.

Full CI:

```bash
pnpm run ci
```

Result:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm verify`: passed.
- `pnpm test`: 56 files passed, 233 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.
- `pnpm build`: passed.

## Next Step

Run the live CSPR.click browser-wallet smoke path: connect the browser wallet, import/save the wallet profile, confirm readiness/funding, approve one `get_quote` x402 payment through CSPR.click, settle through CSPR.cloud, and persist a four-layer receipt with a real deploy hash.

## Independent Review

Reviewer: `Ramanujan`

Result: pass with no blocking or should-fix findings.

Reviewer evidence checked:

- Shared CSPR.click connection is hoisted once in `src/components/gateway-app.tsx` and passed to both wallet and console screens.
- Browser-wallet import derives and stores normalized public key and account hash in `src/components/screens/use-wallet-control.ts`.
- Server validation fails closed for malformed, missing, or mismatched public keys in `src/server/wallet-store.ts`.
- Browser signing still requires a server-returned expected key before signing in `src/lib/browser-paid-call-flow.ts`.
- Payment intent blocks non-`browser-wallet` profiles in `src/server/browser-payment-intent.ts`.
- Public explorer files are unchanged.

Reviewer verification commands:

- `pnpm run guard:files`
- `pnpm run guard:product`
- `pnpm run guard:secrets`
- focused Phase 24H unit suite: 5 files, 24 tests passed
- `pnpm typecheck`
- `pnpm lint`
