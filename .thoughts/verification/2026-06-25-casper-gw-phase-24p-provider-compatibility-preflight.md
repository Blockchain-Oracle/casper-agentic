# Verification: Phase 24P CSPR.click Provider Compatibility Preflight

Date: 2026-06-25

## Scope

This slice makes the browser-signing path show CSPR.click provider capability evidence before another x402 payment attempt.

It does not claim a browser-approved x402 settlement, Casper deploy proof, or any fallback signing path.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24m-csprclick-typed-data-shape.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24n-csprclick-signing-evidence.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24o-browser-failure-closeout.md`
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/client/scheme.ts`
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/signer.ts`
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx`
- Context7 `/websites/cspr_click` docs for `getProviderInfo`, `signTypedData`, `SignTypedDataResult`, and `SignTypedDataErrorCode`.
- Installed `@make-software/csprclick-core-types` provider capability constants.

## Reality Finding

The funded browser wallet remains usable for CSPR.click connection, but the connected Casper Wallet provider advertised deploy/message/transaction signing and did not advertise `sign-typed-data-eip712`.

The previous live browser attempt failed before facilitator with `SIGNATURE_SCHEME_NOT_SUPPORTED`. That maps to CSPR.click's documented typed-data error semantics and must not be bypassed with normal message signing.

## Code Changes

- `src/lib/csprclick-browser-config.ts`
  - Adds typed support for `getProviderInfo`.
- `src/lib/csprclick-provider-info.ts`
  - Normalizes provider support strings.
  - Detects `sign-typed-data-eip712`.
  - Builds redacted provider evidence without optional undefined fields.
- `src/lib/csprclick-browser.ts`
  - Adds provider key/name/version/support evidence to browser state.
  - Adds `signTypedDataAvailable` and `providerSupportsTypedData` state.
- `src/components/screens/browser-signing-state.ts`
  - Carries provider and typed-data readiness through shared UI state.
- `src/components/screens/settings-signing-mode.ts`
  - Labels connected providers that lack typed-data support.
- `src/components/screens/settings-screen.tsx`
  - Shows browser provider and typed-data support evidence.
- `src/components/screens/browser-signing-evidence.tsx`
  - Shared browser provider evidence UI.
- `src/components/screens/test-console-browser-gate.ts`
  - Isolates the paid-console browser approval disable gate.
- `src/components/screens/wallet-screen.tsx`
  - Shows connected provider and typed-data support next to wallet import.
- `src/components/screens/test-console-wallet-actions.tsx`
  - Shows provider support at the paid-call run point.
- `src/components/screens/test-console-screen.tsx`
  - Disables browser x402 run when CSPR.click lacks the typed-data method or the provider explicitly lacks typed-data support.
- `tests/unit/test-console-browser-gate.test.ts`
  - Covers the reviewer-requested unsupported/supported/unknown provider gate and warning notice rendering.

## Verification Commands

```bash
pnpm exec vitest run tests/unit/csprclick-browser.test.ts tests/unit/csprclick-provider-info.test.ts tests/unit/settings-signing-mode.test.ts tests/unit/browser-paid-call-flow.test.ts --reporter=dot
pnpm exec vitest run tests/unit/test-console-browser-gate.test.ts --reporter=dot
pnpm guard:files
pnpm typecheck
pnpm lint
pnpm verify
pnpm build
pnpm test:browser:csprclick
pnpm test:browser
```

Results:

- Focused unit tests passed: 4 files, 25 tests.
- Reviewer-fix unit test passed: 1 file, 3 tests.
- File-size guard passed with no warnings.
- Typecheck passed.
- Lint passed.
- `pnpm verify` passed after the reviewer fix: 61 files, 252 tests, all guards, typecheck, lint.
- `pnpm build` passed.
- `pnpm test:browser:csprclick` passed: 1 test.
- `pnpm test:browser` passed on rerun: 19 passed, 3 intentional mobile skips.

Note: an initial `pnpm test:browser` run failed because it was launched in parallel with `pnpm test:browser:csprclick`, causing simultaneous Next build/web-server startup. The suite passed when rerun by itself.

## Independent Review

Independent reviewer verdict: conditional pass, no blockers.

The reviewer requested direct coverage for the `Run with CSPR.click approval` disable gate and warning notice. That should-fix was accepted and fixed with `tests/unit/test-console-browser-gate.test.ts`.

## Chrome Check

The Chrome plugin connected, but tab navigation to `http://localhost:3000/app` repeatedly hung through the extension control path. The local app server itself responded successfully to `curl http://localhost:3000/app`.

Because the Chrome control channel was unreliable, this slice does not claim a live Chrome UI inspection after the code change. The deterministic CSPR.click Playwright smoke passed, and the previous live-wallet evidence remains the Phase 24O live reference.

## Boundaries

- No x402 verify/settle request was made in this slice.
- No deploy hash was produced or rendered.
- No message-signing fallback was added.
- Browser signing still requires a provider/account that can complete CSPR.click `signTypedData`.
- The integration signer remains separate and was not used as a browser fallback.
