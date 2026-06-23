# Plan: Phase 6 Hosted Endpoint Payment Enforcement

## Inputs

- `.thoughts/README.md`, current state through completed Phase 5.
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`.
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`.
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`.
- Current source files:
  - `src/app/api/mcp/[sourceId]/route.ts`
  - `src/server/hosted-endpoint.ts`
  - `src/server/endpoint-access.ts`
  - `src/server/provider-store.ts`
  - `src/server/live-paid-call.ts`
- Local reference repos:
  - `.thoughts/raw/repos/casper-x402/js/README.md`
  - `.thoughts/raw/repos/casper-x402/js/examples/server/README.md`
  - `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`
- Context7 current package check for `/coinbase/x402` HTTP 402 v2 headers.

## Assumptions

- Phase 6 should harden the hosted MCP endpoint before broad UI work.
- Client access bearer tokens authenticate MCP clients only. They do not authorize wallet spending.
- The existing backend console path remains the only local-signer paid execution path until inbound hosted-endpoint payment verification is planned separately.
- A published priced tool must never be callable for free through `/api/mcp/[sourceId]`.

## Open Questions

- In a later phase, should inbound hosted endpoint payment use CSPR.cloud hosted facilitator directly in this route, or delegate to a dedicated server module with receipt persistence and upstream MCP execution?
- Should hosted endpoints eventually expose OpenAPI or `/.well-known/x402` discovery for x402scan-style indexing? This phase can add runtime `402` behavior first, because runtime behavior is authoritative.

## Prototype Reintegration Gate

The prototype reintegration gate allows implementation of the provider gateway and paid tool loop, but rejects fake settlement, simulated product modes, registry/private-tool semantics, and sidebar-gated explorer behavior.

This phase is a real MVP integration slice for endpoint enforcement. It does not claim full hosted-endpoint settlement unless an incoming payment header is verified, settled, persisted, and linked to a real Casper deploy. If that full path is not implemented in this phase, received payment headers must fail closed with an explicit `payment_verification_not_enabled` response rather than proxying upstream.

## Phase 1: Runtime x402 Challenge For Hosted MCP Calls

### Goal

Make `/api/mcp/[sourceId]` behave like a payment-gated hosted MCP endpoint for published priced tools:

- GET returns authenticated endpoint metadata.
- POST handles a minimal MCP JSON-RPC surface for `initialize`, `tools/list`, and `tools/call`.
- `tools/call` on a priced published tool returns HTTP 402 with a valid x402 v2 `PaymentRequired` body and `PAYMENT-REQUIRED` header when no payment header is present.
- Received payment headers are not accepted until verify/settle is deliberately implemented.

### Work

- Extend `src/server/hosted-endpoint.ts` with:
  - allowed tool resolution by id or name,
  - MCP `tools/list` view from persisted published tools,
  - x402 `PaymentRequired` construction using persisted pricing.
- Extend `src/app/api/mcp/[sourceId]/route.ts` with POST handling:
  - require client access first,
  - validate JSON-RPC shape,
  - support `initialize` and `tools/list`,
  - enforce access scope for `tools/call`,
  - return 402 challenge for unpaid priced calls,
  - reject received payment headers with `501 payment_verification_not_enabled` until the inbound settlement phase exists.
- Add unit tests for route behavior, x402 header/body encoding, access scope enforcement, and secret redaction.

### Real Integration Path

Runtime `402` challenge is real and derived from persisted source/tool/price rows. The payment requirements use Casper Testnet/WCSPR/payee values already stored by provider pricing.

Inbound payment verification and settlement is deferred, not simulated. The route must not call upstream MCP or return protected tool output until a later phase implements inbound verify/settle and receipt persistence.

### Mock/Simulation Policy

No mock settlement, fake deploy hash, fake `settled` status, or fake `PAYMENT-RESPONSE` header. Fixture data may remain only in existing local/no-database views and must stay visibly labeled.

### Checks

- Unit tests for hosted endpoint model and route.
- `pnpm test`.
- `pnpm verify`.
- `pnpm run ci`.
- No browser/Chrome UI smoke is required unless this phase changes rendered UI. Existing Playwright browser smoke still runs through `pnpm run ci`.

### Acceptance Criteria Covered

- Hosted endpoints authenticate MCP clients separately from payment authorization.
- Published priced tools advertise payment requirements.
- Client access scope gates tools.
- Paid tools are not callable without x402 payment handling.
- No secrets or token hashes appear in endpoint responses.
- No live settlement or deploy proof is claimed from this endpoint phase.

### Stop Condition

Stop before accepting payment headers as paid calls unless the route verifies through the CSPR.cloud facilitator, settles on Casper Testnet, persists the four receipt layers, and resolves the deploy hash through CSPR.cloud. If any of those are missing, fail closed and plan the inbound settlement phase separately.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-23-casper-gw-phase-6-hosted-endpoint-payment-enforcement.md` mapping this plan to code, tests, and review evidence.

Run an independent reviewer after implementation. Fix blockers before closing the phase.

## Handoff Notes

This phase should leave the product in a stricter state:

- Hosted endpoints can be registered by MCP clients for discovery.
- Priced tool invocation produces a real x402 challenge.
- Client tokens do not spend.
- Incoming payment support is honestly deferred instead of faked.
