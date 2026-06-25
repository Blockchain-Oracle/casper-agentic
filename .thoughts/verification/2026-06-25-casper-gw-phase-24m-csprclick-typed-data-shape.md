# Verification: Phase 24M CSPR.click Typed Data Shape

Date: 2026-06-25

## Scope

This slice aligns the browser payment-intent typed-data request with current CSPR.click docs and the local Casper x402 CSPR.click example before the next live browser-approved x402 smoke.

It does not run a wallet approval, sign a real payment, settle through CSPR.cloud, or claim a deploy hash.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24g-csprclick-primary-source-refresh.md`
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx`
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/client/scheme.ts`
- Context7 `/websites/cspr_click` docs for `signTypedData`, `SignTypedDataParams`, and `SignTypedDataResult`

## Findings

- Current CSPR.click docs show `SignTypedDataParams` for `TransferWithAuthorization` with unprefixed `contract_package_hash`, `from`, `to`, and `nonce`.
- The local Casper x402 CSPR.click example uses the same unprefixed CSPR.click request shape.
- The local TypeScript Casper x402 scheme prefixes values internally for hashing, but returns an unprefixed x402 authorization payload to the facilitator.
- Casper GW should therefore send unprefixed values to CSPR.click and continue assembling an unprefixed x402 payment payload after signature.

## Code Changes

- `src/server/browser-payment-intent-typed-data.ts`
  - Emits unprefixed `contract_package_hash`.
  - Emits unprefixed `from`, `to`, and `nonce`.
  - Keeps `returnHashArtifacts: true`.
  - Removes explicit `domainTypes` from the request options.
- `tests/unit/browser-payment-intent.test.ts`
  - Asserts the current CSPR.click typed-data request shape.
- `.thoughts/verification/2026-06-25-casper-gw-phase-24c-payment-intent.md`
  - Marks the old prefixed wording as superseded by Phase 24M.

## Verification Commands

```bash
pnpm exec vitest run tests/unit/browser-payment-intent.test.ts tests/unit/browser-x402-signing.test.ts tests/unit/browser-paid-call-flow.test.ts --reporter=dot
```

Result: 3 files passed, 19 tests passed.

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

## Independent Review

Reviewer `Epicurus` passed the diff with no blocking findings.

The reviewer confirmed the CSPR.click request now sends unprefixed `contract_package_hash`, `from`, `to`, and `nonce`, while the final browser x402 payload still emits unprefixed facilitator-facing authorization fields.

Residual risk for the next live smoke: inspect CSPR.click `digest` / `hashArtifacts` before treating browser x402 signing as proven.

## Boundaries

- This is a pre-live compatibility correction only.
- No browser wallet was connected.
- No `signTypedData` request was sent to a real CSPR.click account.
- No facilitator verify/settle call was made.
- No receipt, explorer proof, or live settlement is claimed.
