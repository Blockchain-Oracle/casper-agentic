# Verification: Phase 24J Browser Signing Settings State

Date: 2026-06-25

## Scope

This slice fixes a Phase 24 settings inconsistency after CSPR.click iframe/social-provider configuration.

Before this slice, the Settings screen always rendered `CSPR.click not enabled`, even when the browser runtime was configured or connected. That contradicted the paid console and wallet screens after Phase 24I.

This slice does not add live wallet login, click a CSPR.click provider, sign typed data, spend WCSPR, settle an x402 payment, or claim a deploy hash.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24i-csprclick-embedded-provider-config.md`
- Current app code:
  - `src/components/gateway-app.tsx`
  - `src/components/screens/settings-screen.tsx`
  - `src/components/screens/browser-signing-state.ts`
  - `src/components/screens/test-console-wallet-actions.tsx`

## Code Changes

- Added `browserWalletSigningLabel()` as a small pure settings model.
- Passed the shared `browserWallet.browserSigningState` into `SettingsScreen`.
- Settings now renders:
  - `CSPR.click not enabled` when public config is absent.
  - `CSPR.click configured - waiting for SDK` while the SDK is loading/unavailable.
  - `CSPR.click configured - connect before signing` when the CSPR.click client can request sign-in.
  - `CSPR.click connected - policy pre-check still required` when an account is connected.
  - `CSPR.click runtime unavailable` on runtime error.
- The settings copy still keeps local Testnet signer scope and production custody boundaries explicit.

## Verification Commands

Focused tests:

```bash
pnpm exec vitest run tests/unit/settings-signing-mode.test.ts tests/unit/csprclick-browser.test.ts tests/unit/csprclick-client-config.test.ts --reporter=dot
```

Result: 3 files passed, 14 tests passed.

Additional checks:

```bash
pnpm typecheck
pnpm run guard:files
```

Result: passed.

Full CI:

```bash
pnpm run ci
```

Result:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm verify`: passed.
- `pnpm test`: 57 files passed, 238 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.
- `pnpm build`: passed.

## Boundaries

- No public explorer behavior changed.
- No local signer fallback was added.
- No provider upstream credentials, endpoint tokens, CSPR.cloud token, or wallet secret was exposed.
- No live CSPR.click provider login or wallet approval was attempted.
- The connected-state label still says policy pre-check is required before approval; it does not claim live payment readiness.

## Independent Review

Reviewer: `Mencius`

Result: pass with no findings.

Reviewer checks included:

- Diff inspection for signing-state propagation and settings copy.
- Product-boundary scan for live-payment, custody, explorer, and secret-exposure regressions.
- File-size checks on changed source/test files.
- Focused unit tests.
- `pnpm typecheck`
- `pnpm run guard:files`
- `pnpm run guard:secrets`
- `pnpm run guard:product`
- `pnpm lint`
- `pnpm run ci`

Residual risk from review: no live CSPR.click provider login or WCSPR spend was performed, and this audit does not claim that.
