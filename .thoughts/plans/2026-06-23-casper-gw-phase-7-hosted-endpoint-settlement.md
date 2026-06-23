# Plan: Phase 7 Hosted Endpoint Settlement

## Inputs

- `.thoughts/README.md`, current state through completed Phase 6.
- `.thoughts/plans/2026-06-23-casper-gw-phase-6-hosted-endpoint-payment-enforcement.md`.
- `.thoughts/verification/2026-06-23-casper-gw-phase-6-hosted-endpoint-payment-enforcement.md`.
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`.
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`.
- Current source files:
  - `src/app/api/mcp/[sourceId]/route.ts`
  - `src/server/hosted-endpoint.ts`
  - `src/server/live-paid-call.ts`
  - `src/server/x402-facilitator.ts`
  - `src/server/receipt-store.ts`
  - `src/server/policy.ts`
  - `src/server/spend-policy-store.ts`
  - `src/server/casper-proof.ts`
  - `src/server/mcp-client.ts`
- Local references:
  - `.thoughts/raw/repos/casper-x402/js/examples/server/README.md`
  - `.thoughts/raw/repos/casper-x402/js/examples/facilitator/README.md`
  - `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/client/scheme.ts`
  - `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/facilitator/scheme.ts`
- Context7 current x402 docs for v2 `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`, verification, and settlement headers.

## Assumptions

- Phase 7 should complete the hosted endpoint payment loop for one published MCP tool before broad UI work.
- CSPR.cloud hosted facilitator remains the settlement path.
- A payment signature is external wallet authorization, not client access authorization.
- Wallet policy can run after signature verification but before settlement. This still prevents on-chain spend because `/verify` does not submit a Casper transaction.
- The route should not call upstream MCP or return protected tool output unless settlement succeeds and Casper proof is resolved or intentionally recorded as pending according to the existing proof policy.

## Open Questions

- Should the hosted endpoint require a registered wallet profile/policy for the payer, or allow any valid x402 payer? For Phase 7, require a registered wallet policy so agent spend controls remain meaningful.
- Should proof-pending settlement return protected output immediately? For Phase 7, keep the stricter Phase 3 behavior: do not call upstream until CSPR.cloud resolves the deploy proof.

## Prototype Reintegration Gate

The accepted product direction requires real Casper Testnet proof for judged paid calls and rejects fake settlement, fake deploy hashes, and simulated product modes.

Phase 7 is a real MVP integration path. No mock settlement or fake payment response is allowed. If CSPR.cloud verify/settle or proof lookup fails, the attempt must persist the failure state and must not return protected upstream output.

## Phase 1: Hosted Payment Orchestrator

### Goal

Move inbound payment-header handling out of the route into a server-only module that can be unit-tested and can reuse the existing receipt, policy, facilitator, CSPR.cloud, and upstream MCP clients.

### Work

- Add `src/server/hosted-paid-call.ts`.
- Decode `PAYMENT-SIGNATURE`/`x-payment` with `decodePaymentSignatureHeader`.
- Validate the signed payment resource URL matches the exact hosted MCP resource: `request.url#tool.name`.
- Verify through CSPR.cloud facilitator `/verify`.
- Persist a paid-call attempt and x402 verify record.
- Extract and normalize the payer from the verified response or signed Casper authorization payload.

### Real Integration Path

Use real x402 payloads and the real facilitator client. Tests may mock network clients, but production code must call the existing `X402FacilitatorClient`.

### Mock/Simulation Policy

No fake verify success. No fake payer. Malformed signatures can fail before receipt persistence; structured facilitator failures must persist as `verify_failed` when enough context exists.

### Checks

- Unit tests for malformed payment header, resource mismatch, verify failure, and payer extraction.
- Typecheck and lint.

### Acceptance Criteria Covered

- RQ-40, RQ-42, RQ-44, RQ-45, RQ-50.

### Stop Condition

Stop if the payment payload cannot be safely bound to the hosted resource/tool.

## Phase 2: Policy Before Settlement

### Goal

Enforce wallet spend policy after verify and before settlement.

### Work

- Load CSPR.cloud account and payment asset balance for the payer.
- Load stored spend policy by payer account hash.
- Evaluate network, asset, tool, max-per-call, daily, session, gas, and asset headroom.
- Persist policy decision and audit.
- Return JSON-RPC error without settlement when policy blocks.

### Real Integration Path

Policy uses real persisted wallet/policy rows and CSPR.cloud balances. Unit tests may mock the stores and CSPR.cloud client.

### Mock/Simulation Policy

No policy bypass for convenience. No fallback to "allow" when wallet policy is missing.

### Checks

- Unit tests proving policy block calls neither `/settle` nor upstream MCP.
- Unit tests proving missing policy blocks.

### Acceptance Criteria Covered

- RQ-27 to RQ-29, RQ-40, RQ-50.

### Stop Condition

Stop if policy cannot identify the payer wallet or policy state reliably.

## Phase 3: Settle, Resolve Proof, Execute Upstream

### Goal

For policy-allowed hosted calls, settle through CSPR.cloud, persist x402 settlement, resolve Casper proof, call the upstream MCP tool, persist output status, and return a MCP JSON-RPC result with `PAYMENT-RESPONSE`.

### Work

- Call facilitator `/settle` with the verified payment payload and persisted tool payment requirements.
- Persist settlement body even when `success: false`.
- On settlement success, resolve Casper proof through CSPR.cloud deploy/token-action lookup.
- Persist `casper_proofs`.
- Call upstream MCP only after settlement success and proof resolution.
- Return:
  - JSON-RPC tool result body from upstream MCP,
  - `PAYMENT-RESPONSE` header encoded with `encodePaymentResponseHeader`,
  - a non-secret receipt id header such as `x-casper-gw-receipt-id`.

### Real Integration Path

All production branches use CSPR.cloud facilitator, CSPR.cloud REST, and the official MCP client already in the repo.

### Mock/Simulation Policy

No fake `PAYMENT-RESPONSE`, deploy hash, proof status, or upstream result. If proof indexing lags, persist `raw_proof_unavailable` and do not call upstream in this phase.

### Checks

- Unit tests for settle failure, proof pending, upstream failure, and success.
- Existing receipt-detail tests must continue to pass.
- `pnpm run ci`.

### Acceptance Criteria Covered

- RQ-40 to RQ-46, RQ-50 to RQ-54.

### Stop Condition

Stop before live smoke if WCSPR funding or CSPR.cloud facilitator support is unavailable.

## Phase 4: Credential-Gated Live Smoke

### Goal

Prove one real hosted endpoint payment loop if credentials and wallet funding are available.

### Work

- Use a local test signer only to create the inbound client `PAYMENT-SIGNATURE` for test execution.
- Call the hosted endpoint as an MCP client with the scoped client access bearer token.
- Confirm a receipt is persisted and public explorer can resolve the real deploy hash.

### Real Integration Path

This spends real WCSPR on Casper Testnet. It is credential-gated and should use the same small configured amount as previous live tests.

### Mock/Simulation Policy

No live-looking fake hash. If live smoke cannot run, record why and keep unit/CI proof only.

### Checks

- `pnpm run ci`.
- Optional live hosted smoke when funding exists.
- Browser smoke only if public receipt/explorer UI changes.

### Acceptance Criteria Covered

- AC-07, AC-08, AC-09, AC-10.

### Stop Condition

Stop if settlement or proof lookup would require unapproved Mainnet, production custody, or new wallet material.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-23-casper-gw-phase-7-hosted-endpoint-settlement.md`.

Run an independent reviewer after implementation. Fix blockers before closing the phase.

## Handoff Notes

If Phase 7 passes, hosted endpoints become more than metadata/challenge surfaces:

- Client token authenticates the MCP client.
- x402 signature authorizes payment.
- Wallet policy gates settlement.
- CSPR.cloud settles and proves the payment.
- Upstream MCP is called only after payment proof is real.
