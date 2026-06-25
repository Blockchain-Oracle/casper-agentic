# Verification: Phase 24L CSPR.click Browser Smoke Gate

Date: 2026-06-25

## Scope

This slice adds an automated CSPR.click-specific browser smoke gate without requiring a real provider login, wallet approval, WCSPR spend, or Casper deploy proof.

The goal is to prevent regressions where public CSPR.click config is present but the Casper GW app-level connect path fails, opens a provider tab too early, or keeps settings stuck at `not enabled`.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24i-csprclick-embedded-provider-config.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24j-browser-signing-settings-state.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24k-app-connect-button-chrome.md`
- Context7 Playwright docs for:
  - `page.addInitScript`
  - `page.route(...).fulfill(...)`
- Current app code:
  - `src/components/screens/use-csprclick-browser-connection.ts`
  - `src/components/screens/settings-screen.tsx`
  - `src/components/screens/wallet-screen.tsx`
  - `src/lib/csprclick-browser.ts`

## Code Changes

- Added `playwright.csprclick.config.ts` as an isolated browser-test config.
- Added `pnpm test:browser:csprclick`.
- Added `pnpm test:browser:csprclick` into `pnpm ci`.
- Added `pnpm test:browser:csprclick` into GitHub Actions CI.
- Updated `guard:workflows` so local verification fails if package scripts or GitHub Actions stop enforcing the CSPR.click browser smoke.
- Added `tests/browser-csprclick/app-connect.spec.ts`.

The CSPR.click browser smoke:

- Starts Next with public CSPR.click localhost config:
  - `NEXT_PUBLIC_CSPR_CLICK_APP_ID=csprclick-template`
  - `NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE=iframe`
  - `NEXT_PUBLIC_CSPR_CLICK_PROVIDERS=csprclick-w3a-google,csprclick-w3a-apple,casper-wallet,ledger,metamask-snap`
- Fulfills the CSPR.click CDN script request with a small deterministic browser-runtime double.
- Verifies Settings shows `CSPR.click configured - connect before signing`.
- Verifies the Wallet screen shows `Connect CSPR.click before browser approval.`
- Clicks the Casper GW app-level `Connect CSPR.click wallet` button.
- Verifies the app shows `CSPR.click sign-in requested`.
- Verifies a mock embedded CSPR.click dialog is shown.
- Verifies the browser page count does not increase.

## Verification Commands

Focused CSPR.click browser smoke:

```bash
pnpm test:browser:csprclick
```

Result: 1 browser test passed.

Additional checks:

```bash
pnpm typecheck
pnpm run guard:files
pnpm run guard:product
pnpm run guard:secrets
pnpm test:browser
```

Result:

- `pnpm typecheck`: passed.
- `pnpm run guard:files`: passed.
- `pnpm run guard:product`: passed.
- `pnpm run guard:secrets`: passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.

Full CI:

```bash
pnpm run ci
```

Result:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm verify`: passed.
- `pnpm test`: 57 files passed, 239 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.
- `pnpm test:browser:csprclick`: 1 browser test passed.
- `pnpm build`: passed.

Workflow guard focused check:

```bash
pnpm exec vitest run tests/unit/workflow-guard.test.ts --reporter=dot
pnpm run guard:workflows
```

Result:

- `tests/unit/workflow-guard.test.ts`: 7 tests passed.
- `pnpm run guard:workflows`: passed.

## Independent Review

Initial independent review failed this slice because `.github/workflows/ci.yml` still only ran `pnpm test:browser`; GitHub Actions would have skipped the new CSPR.click-specific browser smoke even though local `pnpm ci` ran it.

Fix applied:

- `.github/workflows/ci.yml` now runs `pnpm test:browser:csprclick` after the standard browser smoke.
- `scripts/guard-workflows.mjs` now requires `pnpm test:browser:csprclick` in both the local `ci` script and GitHub Actions workflow.
- `tests/unit/workflow-guard.test.ts` now covers the new workflow guard requirement.

Re-review then found one remaining workflow-guard false-negative: the standard browser-smoke regex could be satisfied by `pnpm test:browser:csprclick`.

Fix applied:

- `scripts/guard-workflows.mjs` now requires exact `run: pnpm test:browser` and exact `run: pnpm test:browser:csprclick` workflow commands.
- `tests/unit/workflow-guard.test.ts` now includes a regression case proving a CSPR.click-only workflow still fails with `ci.yml: missing browser smoke command`.

Post-fix focused workflow guard result:

- `tests/unit/workflow-guard.test.ts`: 8 tests passed.
- `pnpm run guard:workflows`: passed.

Final independent re-review passed with no blocking findings. The reviewer confirmed:

- GitHub Actions runs both `pnpm test:browser` and `pnpm test:browser:csprclick`.
- `guard:workflows` requires both commands separately.
- The exact matcher prevents `pnpm test:browser:csprclick` from satisfying the standard browser-smoke gate.
- The regression test covers that false-negative.

## Boundaries

- The CDN runtime is mocked deliberately for deterministic CI.
- The test does not click Google, Apple, Casper Wallet, Ledger, Metamask, or any real provider.
- The test does not connect a real CSPR.click account.
- The test does not call `signTypedData` for a real x402 payment.
- The test does not call CSPR.cloud facilitator verify/settle.
- No receipt, explorer proof, deploy hash, or live settlement is claimed.
