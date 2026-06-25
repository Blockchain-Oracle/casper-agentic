# Verification: Phase 24E Browser Approval UI Wiring

Date: 2026-06-25

## Scope

Phase 24E wires the paid-tool console to the browser-signing path without broad redesign.

The new client flow creates a server-side browser payment intent, checks the active CSPR.click public key against the selected wallet, requests `signTypedData`, builds the x402 payment payload, and submits it to the Phase 24D browser completion route.

This is not a live CSPR.click smoke. No new browser-wallet signature, settlement, deploy hash, or production custody claim is made by this slice.

## Context Anchors

- Plan: `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- Current front door: `.thoughts/README.md`
- Context7: `/websites/cspr_click` docs for `signTypedData(params, signingPublicKey)` and CSPR.click events.
- Local reference:
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/App.tsx`
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx`

## Implementation Evidence

- `src/lib/browser-paid-call-flow.ts`
  - Orchestrates payment intent, active public-key check, CSPR.click typed-data signature, x402 payload assembly, and browser completion.
  - Does not import or call local Testnet signer code.
  - Stops honestly on policy block, active-key mismatch, CSPR.click cancellation, malformed signing result, or completion failure.

- `src/components/screens/use-paid-call-console.ts`
  - Prepares the CSPR.click browser runtime only when public config is present.
  - Keeps `CSPR.click not enabled` as an honest disabled state when `NEXT_PUBLIC_CSPR_CLICK_APP_ID` is absent.
  - Keeps the integration signer path separate.
  - Carries the actual persisted receipt status returned by the server instead of treating every non-cancelled browser result as proof completion.

- `src/components/screens/test-console-screen.tsx`
  - Adds an explicit `Run with CSPR.click approval` path.
  - Keeps the integration signer path as a separate button.
  - Resets stale completed state before each new run attempt.

- `src/components/screens/test-console-wallet-actions.tsx`
  - Keeps browser approval action disabled unless the selected wallet is `browser-wallet` and CSPR.click public runtime is configured.

- `src/components/screens/test-console-timeline.tsx`
  - Uses the real run/browser receipt status for the timeline status chip.
  - Removes the old fixture receipt fallback from console run results.
  - Shows non-proof wording for `blocked`, `verify_failed`, `settle_failed`, `raw_proof_unavailable`, and `upstream_failed`.

## Requirement Mapping

- Policy before approval:
  - Client calls `/api/paid-calls/payment-intents` before CSPR.click signing.
  - Policy blocks return without requesting a signature.

- Active wallet matching:
  - Browser flow checks CSPR.click active public key against the server-returned expected public key before signing.
  - Mismatch stops before `signTypedData` and before completion.

- CSPR.click signing:
  - Uses the documented `signTypedData(params, signingPublicKey)` shape.
  - Cancellation produces a cancelled UI result without fake receipt/proof claims.

- No fallback:
  - Browser flow never retries through the local Testnet signer.
  - Integration signer remains a separate explicit path.

- No fake proof:
  - Browser completion route is called only after a signed x402 payload is produced.
  - UI does not claim live browser-wallet settlement without completion output.
  - Console timeline only uses proof-opened language for `settled`.
  - Policy-blocked or failed x402 outcomes remain openable as receipts when persisted, but do not render as proof-complete paths.

## Verification Commands

Focused browser-signing unit tests:

```bash
pnpm exec vitest run tests/unit/browser-paid-call-flow.test.ts tests/unit/csprclick-browser.test.ts tests/unit/browser-x402-signing.test.ts --reporter=dot
```

Result: 3 files passed, 18 tests passed.

Typecheck:

```bash
pnpm typecheck
```

Result: passed.

Paid-console browser smoke:

```bash
pnpm exec playwright test tests/browser/smoke.spec.ts -g "operator app exposes the paid tool console"
```

Result: desktop and mobile smoke passed.

Reviewer-fix regression tests:

```bash
pnpm exec vitest run tests/unit/browser-paid-call-flow.test.ts tests/unit/test-console-timeline-model.test.ts --reporter=dot
```

Result: 2 files passed, 12 tests passed.

Full CI:

```bash
pnpm run ci
```

Result: passed with 222 unit tests, 19 browser smoke tests, 3 intentional mobile skips, and `next build`.

## Independent Review

Initial independent review found one blocker: non-settled browser outcomes could set the console phase to complete while the timeline rendered fixture receipt status/proof wording.

Fix:

- `apiReceiptStatus` now tracks actual server/browser receipt status.
- Timeline status chip uses `apiReceiptStatus`, never fixture status.
- Console run results no longer receive `fixtureReceipt` or `onOpenReceipt`.
- Non-settled statuses render honest non-proof timeline text.
- `cancelled` and generic `failed` do not create a receipt/proof path.

Focused re-review result: no findings.

## Not Yet Proven

- No live CSPR.click wallet approval was run.
- No live browser-wallet x402 settlement was produced.
- No new deploy hash or public explorer proof was produced by this slice.

## Next Gate

Proceed to a live CSPR.click smoke only when a configured browser wallet is available with matching wallet profile, CSPR gas, WCSPR, and operator approval for the spend.
