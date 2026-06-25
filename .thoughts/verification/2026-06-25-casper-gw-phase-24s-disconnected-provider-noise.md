# Verification: Phase 24S CSPR.click Disconnected Provider Noise

Date: 2026-06-25

## Scope

This slice fixes Settings and browser-signing state after live inspection showed a disconnected CSPR.click state paired with SDK current-provider metadata such as MetaMask. The app should not treat provider identity as a product concept before an account is connected.

This does not request a wallet signature, create a payment intent, call x402 verify/settle, or claim Casper deploy proof.

## Finding

The Settings panel could show:

- `browser wallet signing`: `CSPR.click configured - connect before signing`
- `browser provider`: a provider reported by the SDK current-provider lookup
- `typed-data support`: capability for that current provider

That was misleading because the SDK method `getProviderInfo(provider?)` returns the connected/current provider when no provider key is supplied. In the disconnected state there is no active CSPR.click account, so the app should not call the no-argument current-provider path or render current-provider evidence.

Configured provider capability rows remain useful because they are no-spend preflight evidence from explicit `getProviderInfo(providerKey)` calls.

## Source Anchors

- `.thoughts/README.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24r-provider-chooser-action.md`
- CSPR.click skill: `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`
- Context7 CSPR.click docs for `getProviderInfo(provider?)`, `signTypedData`, and `switchAccount`

## Code Changes

- `src/lib/csprclick-browser.ts`
  - Reads configured provider capabilities by explicit provider key.
  - Stops calling `getProviderInfo(undefined)` when no active public key exists.
  - Returns disconnected state without `provider` or `providerSupportsTypedData`.
- `src/components/screens/browser-signing-state.ts`
  - Keeps mapped disconnected browser-signing state free of current-provider metadata.
- `src/components/screens/settings-signing-mode.ts`
  - Labels typed-data provider support as relevant only after connection.
- `tests/unit/csprclick-disconnected-provider.test.ts`
  - Covers the exact stale-current-provider case.
- `tests/unit/browser-signing-state.test.ts`
  - Covers the state mapper boundary.
- `tests/unit/settings-signing-mode.test.ts`
  - Covers the disconnected support label.
- `tests/browser-csprclick/app-connect.spec.ts`
  - Covers the mocked disconnected Settings state.

## Verification Commands

```bash
pnpm exec vitest run tests/unit/csprclick-browser.test.ts tests/unit/csprclick-disconnected-provider.test.ts tests/unit/browser-signing-state.test.ts tests/unit/settings-signing-mode.test.ts tests/unit/csprclick-provider-capabilities.test.ts --reporter=dot
pnpm test:browser:csprclick
pnpm guard:files
pnpm lint
pnpm typecheck
pnpm verify
pnpm build
pnpm test:browser
pnpm run ci
```

Results:

- Focused unit tests passed: 5 files, 20 tests.
- CSPR.click browser smoke passed: 2 tests.
- File-size guard passed.
- Lint passed.
- Typecheck passed.
- `pnpm verify` passed: 64 test files, 259 tests.
- `pnpm build` passed.
- Full browser smoke passed: 19 passed, 3 intentional mobile skips.
- `pnpm run ci` passed end to end: frozen install, verify, full browser smoke, CSPR.click browser smoke, and build.

Note: `pnpm ci` is not implemented by pnpm in this environment, so the executable project gate is `pnpm run ci`.

## Independent Review

Independent review found no issues. It confirmed that disconnected CSPR.click state no longer carries current-provider metadata, the `client_available` mapper strips provider fields, Settings labels provider support as irrelevant before connection, and configured-provider capability rows remain explicit-key preflight evidence.

## Boundary

- The active connected provider still matters at signing time because CSPR.click `signTypedData` must use the active wallet/public key.
- Configured provider capability rows are not proof of a connected wallet or a successful x402 payment.
- No live browser-approved payment was attempted in this slice.
- No x402 verify/settle row or Casper deploy hash is claimed by this slice.
