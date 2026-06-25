# Verification: Phase 24D Browser-Signed Payment Completion

Date: 2026-06-25

## Scope

Phase 24D adds the backend completion path for a CSPR.click/browser-signed x402 payment payload.

This is not the live CSPR.click smoke and not broad UI work. It accepts a browser-produced x402 `PaymentPayload`, verifies it with the CSPR.cloud facilitator, settles it through the same facilitator, resolves Casper proof through CSPR.cloud, calls the configured MCP tool only after settlement, and persists the normal receipt layers.

## Context Anchors

- Plan: `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- Current front door: `.thoughts/README.md`
- x402/CSPR.click local references:
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/README.md`
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx`
  - `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/client/scheme.ts`
  - `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/signer.ts`

## Implementation Evidence

- `src/app/api/paid-calls/browser-completions/route.ts`
  - Adds `POST /api/paid-calls/browser-completions`.
  - Requires operator access.
  - Validates `attemptId`, `endpointUrl`, `toolName`, `args`, and `paymentPayload`.

- `src/server/browser-payment-completion.ts`
  - Loads server-only completion configuration.
  - Requires a persisted `csprclick-browser-intent` attempt in `policy_pending` status.
  - Requires an allowed policy decision and approved input hash before x402 verify/settle.
  - Validates the requested tool and x402 resource URL before facilitator settlement.
  - Uses CSPR.cloud facilitator verify/settle with the submitted browser payload.
  - Does not import or call the local Testnet signer path.

- `src/server/browser-payment-completion-policy.ts`
  - Reads the latest policy decision for the attempt.
  - Requires `allowed=true` and a stored `browserPaymentIntent.inputHash`.
  - Recomputes the completion request input hash before any x402 operation.
  - Re-checks current wallet policy, gas evidence, and payment asset balance through the existing live policy path before settlement.
  - Preserves the approved input hash on completion re-check policy rows so retry attempts remain bound to the original intent.

- `src/server/browser-payment-completion-outcomes.ts`
  - Persists verify failure, settle failure, proof pending, upstream failure, and settled outcomes.
  - Resolves Casper proof before returning a settled explorer link.
  - Calls the upstream MCP tool only after settlement succeeds and a deploy hash is present.
  - Converts thrown MCP/network failures after settlement into persisted `upstream_failed` receipts.

- `src/server/paid-call-attempt-store.ts`
  - Reads the persisted payment-intent attempt without growing `receipt-store.ts`.
  - Reads the latest policy decision for completion enforcement.

- `src/server/paid-call-input-hash.ts`
  - Provides deterministic SHA-256 hashing for approved tool inputs without storing raw args.

- `src/server/receipt-policy-selection.ts`
  - Selects the latest policy row per attempt for persisted receipt rendering.

## Requirement Mapping

- Policy before payment:
  - Completion requires a previously persisted browser payment-intent attempt in `policy_pending`.
  - Completion requires the stored allowed policy decision and re-checks current spend policy/balance evidence before x402 verify/settle.
  - This keeps the wallet-signing path downstream of the Phase 24C server policy/payment-intent gate.

- Input binding:
  - Intent creation stores a deterministic approved input hash in policy evidence.
  - Completion recomputes the hash from submitted args and blocks before x402 if it does not match.
  - Raw args are not stored in the policy evidence.

- No local-signer fallback:
  - Completion accepts only a submitted x402 `PaymentPayload`.
  - The implementation does not import signer-key loading, local signer helpers, or local-spend smoke tooling.

- Verify/settle branch correctness:
  - Missing allowed policy decision fails before verify/settle/tool execution.
  - Input hash mismatch fails before verify/settle/tool execution.
  - Current policy failure fails before verify/settle/tool execution.
  - Resource mismatch fails before verify/settle.
  - Facilitator verify failures fail before settle and before MCP tool execution.
  - Payer mismatch fails after successful verify and before settle/tool execution.
  - Settle failures persist a failed settlement record and do not call the MCP tool.
- Thrown MCP failures after settlement persist `upstream_failed` and audit evidence.
- A transient facilitator verify failure after a completion policy re-check does not poison retry state.
- Public receipt details render the newest policy decision when an initial allowed intent is later blocked at completion time.

- Four-layer receipt discipline:
  - x402 verify and settle records are persisted separately.
  - Casper proof is persisted only from CSPR.cloud proof resolution.
  - MCP tool result is persisted only after successful settlement and proof attempt.

- No fake proof claim:
  - The route does not claim a completed live browser-wallet payment.
  - `settled` is returned only after settle success with a transaction hash and CSPR.cloud proof resolution.

## Verification Commands

Focused Phase 24D tests:

```bash
pnpm exec vitest run tests/unit/browser-payment-completion.test.ts tests/unit/browser-payment-completion-guards.test.ts tests/unit/browser-payment-completion-route.test.ts tests/unit/receipt-store-policy-order.test.ts --reporter=dot
```

Result: passed.

Phase 24A-24D browser-payment unit chain:

```bash
pnpm exec vitest run tests/unit/browser-payment-completion.test.ts tests/unit/browser-payment-completion-guards.test.ts tests/unit/browser-payment-completion-route.test.ts tests/unit/browser-payment-intent.test.ts tests/unit/browser-payment-intent-route.test.ts tests/unit/browser-x402-signing.test.ts --reporter=dot
```

Result: 6 files passed, 24 tests passed.

Typecheck:

```bash
pnpm typecheck
```

Result: passed.

File-size check for new active files:

```bash
wc -l src/server/browser-payment-completion.ts src/server/browser-payment-completion-outcomes.ts src/app/api/paid-calls/browser-completions/route.ts tests/unit/browser-payment-completion.test.ts tests/unit/browser-payment-completion-route.test.ts tests/unit/browser-payment-completion-fixtures.ts
```

Result: all new active server files and split completion test files are below 200 lines.

## Independent Review Fixes

Independent reviewer `Bacon` found three blockers:

- completion could settle without proving an allowed policy decision still exists,
- completion did not bind executed MCP args to the server-approved payment intent,
- thrown MCP/network failures after settlement could leave attempts stuck as `policy_pending`.

Fixes applied:

- completion now requires the latest stored policy decision to be allowed,
- completion now verifies the stored approved input hash and re-checks current spend policy/balance evidence,
- completion now converts thrown MCP call failures into persisted `upstream_failed` receipt/audit outcomes.

Focused re-reviewer `Avicenna` then found two additional blockers:

- completion policy re-check rows could hide the original approved input hash and poison retries after transient facilitator failures,
- receipt rendering could display stale `ALLOWED` policy state when a later completion-time policy block existed.

Fixes applied:

- completion re-check policy rows now preserve `browserPaymentIntent.inputHash`,
- receipt detail/list assembly now selects the latest policy decision by `createdAt`.

## Not Yet Proven

- No live CSPR.click wallet approval has been run in-browser for this slice.
- No new real deploy hash was produced by Phase 24D.
- UI wiring for calling this route from the paid-tool console remains a later Phase 24 slice.

## Next Gate

Run the full local gate, request independent review, then proceed to the Phase 24 UI/live-smoke slice only after this backend completion path is accepted.
