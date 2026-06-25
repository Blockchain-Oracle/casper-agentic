# Verification: Phase 24R CSPR.click Provider Chooser Action

Date: 2026-06-25

## Scope

This slice fixes the Settings provider evidence after live inspection showed duplicate provider rows and no direct way to open the CSPR.click provider chooser from Settings.

It does not request a wallet signature, create a payment intent, call x402 verify/settle, or claim Casper deploy proof.

## Finding

The live Settings panel showed two rows with the same React key:

- `CSPR.click Web Wallet (csprclick-w3a-google)`
- `CSPR.click Web Wallet (csprclick-w3a-google)`

The SDK can report the same provider key/name for multiple configured providers, so the app must key capability evidence by the configured provider key, not by the SDK-reported provider key.

The same panel also showed that the active provider was Casper Wallet and lacked `sign-typed-data-eip712`, but it only displayed evidence. That made the next action unclear.

## Code Changes

- `src/lib/csprclick-provider-info.ts`
  - Keeps configured provider keys stable.
  - Stores a separate `reportedKey` only when SDK metadata differs.
- `src/components/screens/browser-signing-state.ts`
  - Carries optional `reportedKey`.
- `src/components/screens/browser-signing-evidence.tsx`
  - Renders provider rows using configured labels/keys.
  - Adds SDK-reported key metadata to the value instead of using it as the row identity.
- `src/components/screens/settings-screen.tsx`
  - Adds `Open CSPR.click provider chooser` in Wallet signing mode.
- `src/components/gateway-app.tsx`
  - Wires Settings to the existing CSPR.click `connectBrowserWallet` action.
- `src/lib/csprclick-browser-config.ts`
  - Adds the documented `switchAccount(withProvider?: string, options?: unknown)` SDK method to the browser client boundary.
- `src/lib/csprclick-browser-session.ts`
  - Uses `switchAccount(undefined)` for connected users so CSPR.click opens the account/provider switch modal.
  - Keeps `signIn()` for the unconnected connect flow.
- `tests/unit/csprclick-provider-capabilities.test.ts`
  - Covers duplicate SDK metadata while preserving configured provider keys.
- `tests/unit/csprclick-browser-session.test.ts`
  - Covers connected switch-account behavior and unconnected sign-in behavior.
- `tests/browser-csprclick/app-connect.spec.ts`
  - Covers the connected unsupported-provider Settings action and proves it calls `switchAccount`, not `signIn`.

## Verification Commands

```bash
pnpm exec vitest run tests/unit/csprclick-provider-capabilities.test.ts tests/unit/csprclick-provider-info.test.ts tests/unit/settings-signing-mode.test.ts tests/unit/test-console-browser-gate.test.ts --reporter=dot
pnpm guard:files
pnpm lint
pnpm typecheck
pnpm test:browser:csprclick
pnpm exec vitest run tests/unit/csprclick-browser-session.test.ts tests/unit/csprclick-provider-capabilities.test.ts --reporter=dot
pnpm verify
pnpm build
pnpm test:browser
```

Results:

- Focused unit tests passed: 4 files, 14 tests.
- File-size guard passed.
- Lint passed.
- Typecheck passed.
- Connected-provider focused unit tests passed: 2 files, 7 tests.
- `pnpm test:browser:csprclick` passed: 2 tests.
- `pnpm build` passed.
- `pnpm test:browser` passed on rerun: 19 passed, 3 intentional mobile skips.

Note: the first `pnpm test:browser` run failed because it was started in parallel with `pnpm build`, causing Next.js to reject concurrent builds. The suite passed when rerun by itself.

## Boundary

- No live browser-approved payment was attempted in this slice.
- The active Casper Wallet provider still does not advertise `sign-typed-data-eip712`.
- The next live step is to open the provider chooser, switch/connect a typed-data-capable CSPR.click Web Wallet provider, and retry the paid-call console path.

## Independent Review

Initial review found a blocker: the Settings action originally called only `signIn()`, which is insufficient when the operator is already connected to the unsupported Casper Wallet provider. Current CSPR.click docs state that `switchAccount(undefined)` opens the CSPR.click Switch Account modal. The blocker was fixed by adding `switchAccount` to the client boundary, using it for connected users, and adding unit/browser coverage for the connected unsupported-provider path.

Focused re-review passed with no findings. Residual risk remains live-only: the real CSPR.click modal/provider switch still needs browser verification with the actual extension/session state.
