# Verification: Phase 24Q CSPR.click Configured Provider Capability Probe

Date: 2026-06-25

## Scope

This slice adds a no-spend CSPR.click provider capability probe so the app can show which configured providers advertise typed-data signing before another browser-approved x402 attempt.

It does not request a wallet signature, create a payment intent, call x402 verify/settle, or claim Casper deploy proof.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24p-provider-compatibility-preflight.md`
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/README.md`
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx`
- Context7 `/websites/cspr_click` docs for `getProviderInfo` and `signTypedData`
- Installed `@make-software/csprclick-core-types` provider type definitions

## Reality Finding

CSPR.click exposes `getProviderInfo(provider?: string)`, and the local type package defines provider support strings including `sign-typed-data-eip712`. Some metadata may only be available when a provider is connected, so the UI must treat missing capability evidence as unknown, not success.

The funded browser wallet still cannot complete the x402 path until the active provider can sign EIP-712 typed data.

## Code Changes

- `src/lib/csprclick-provider-capabilities.ts`
  - Adds a read-only configured-provider metadata probe.
  - Deduplicates configured providers.
  - Returns unknown capability evidence if `getProviderInfo` fails or returns no support list.
- `src/lib/csprclick-provider-info.ts`
  - Adds normalized provider capability records and typed-data support detection.
- `src/lib/csprclick-browser.ts`
  - Carries configured provider capability evidence through browser state without signing.
- `src/components/screens/use-csprclick-browser-connection.ts`
  - Passes configured CSPR.click provider keys into the browser-state refresh.
- `src/components/screens/browser-signing-state.ts`
  - Adds provider capability evidence to shared browser-signing state.
- `src/components/screens/browser-signing-evidence.tsx`
  - Renders configured provider capability rows.
- `src/components/screens/settings-screen.tsx`
  - Shows configured-provider capability evidence in the wallet signing mode panel.
- Tests:
  - Adds unit coverage for configured-provider probing.
  - Updates CSPR.click browser smoke to prove provider capability rows render.
  - Updates existing browser-state fixtures for the new state field.

## Verification Commands

```bash
pnpm exec vitest run tests/unit/csprclick-provider-capabilities.test.ts tests/unit/csprclick-provider-info.test.ts tests/unit/settings-signing-mode.test.ts tests/unit/test-console-browser-gate.test.ts --reporter=dot
pnpm guard:files
pnpm typecheck
pnpm lint
pnpm test:browser:csprclick
pnpm test:browser
pnpm verify
pnpm build
```

Results:

- Focused unit tests passed: 4 files, 13 tests.
- File-size guard passed.
- Typecheck passed.
- Lint passed.
- `pnpm test:browser:csprclick` passed: 1 test.
- `pnpm test:browser` passed: 19 passed, 3 intentional mobile skips.
- `pnpm verify` passed: 62 files, 254 tests.
- `pnpm build` passed.

## Boundaries

- No x402 verify/settle request was made.
- No Casper deploy hash was produced or rendered.
- No message-signing fallback was added.
- Provider capability evidence is advisory until the active connected provider signs typed data.
- Browser x402 execution blocks providers that explicitly report no typed-data support.
- Unknown provider support remains allowed to attempt `signTypedData` because CSPR.click may only expose complete metadata after connection; if signing fails, the attempt ends honestly with no local-signer fallback.

## Next Step

Use the Settings provider capability evidence to choose a CSPR.click provider that advertises `sign-typed-data-eip712`, connect it in the browser, then retry the browser-approved paid-call path.
