# Plan: Phase 23 Wallet Signing Readiness Boundary

## Inputs

- `AGENTS.md`: do not claim production custody or CSPR.click/browser signing without a real verified path.
- `.thoughts/README.md` current build gate: CSPR.click/browser signing needs its own accepted plan.
- `.thoughts/research/2026-06-17-casper-agentic-buildathon-reality.md`: CSPR.click supports wallet connection, transaction signing/sending, and status handling.
- Phase 2 and Phase 3 plans/audits: current paid calls use a local Testnet signer only for integration verification, and selected browser-wallet records must fail closed before signing.
- Context7 CSPR.click docs: `send(transactionJSON, signingPublicKey, onStatusUpdate?, timeout?)` requests active wallet approval, sends the transaction, and returns cancellation/error/timeout/status data.
- Current source check: `settings-screen.tsx` and fixtures still contain stale `Hosted encrypted signer` language.

## Assumptions

- Phase 23 should not install CSPR.click or implement browser signing.
- The current judged integration path remains local Testnet signer plus policy-before-signing.
- Product language must not imply hosted custody.

## Open Questions

- Which CSPR.click app/project configuration will be used when browser signing is accepted?
- Should browser signing create x402 payment payloads directly in the browser, or should the server prepare unsigned transaction/payment requirements and verify the signed result?
- Which UI flow should request wallet approval: paid console only, hosted endpoint agent flow, or both?

## Prototype Reintegration Gate

This phase does not implement or copy prototype signing UI. It only corrects readiness/product boundaries.

## Phase 1: Server Readiness Contract

### Goal

Expose truthful wallet-signing readiness metadata in integration health so future agents and UI code do not treat `browser-wallet` records as payment authority.

### Work

- Add a server-only wallet-signing readiness module.
- Include local Testnet signer status without exposing key material or paths.
- Include CSPR.click/browser signing as `not_enabled` with explicit future gates.
- Add the readiness object to `GET /api/health/integrations`.

### Real Integration Path

Local Testnet signer remains the only implemented signing path. CSPR.click is documented as a future browser approval path.

### Mock/Simulation Policy

No signing mock is introduced. Browser signing cannot be marked ready from configuration alone.

### Checks

- Unit tests for readiness status, redaction, CSPR.click gates, and health response shape.
- Product guard should reject stale hosted-custody language in active source.

### Acceptance Criteria Covered

- Policy remains before signing/payment.
- No hosted custody claim appears in active source.
- Browser-wallet profiles remain registration metadata, not signing authority.

### Stop Condition

Stop before installing CSPR.click, creating browser payment payloads, adding wallet approval UI, changing paid-call settlement, or claiming production custody.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`.

## Handoff Notes

The next real CSPR.click phase must design the exact handoff between server policy/payment requirements and browser wallet approval, then prove one signed Testnet x402 payment without local signer fallback.
