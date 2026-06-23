# Verification Audit: Phase 6 Hosted Endpoint Payment Enforcement

## Verdict

Pass.

The implementation satisfies the Phase 6 plan for hosted endpoint enforcement: authenticated MCP metadata/discovery works, `tools/list` advertises persisted x402 payment requirements, unpaid priced `tools/call` returns a real x402 v2 `402` challenge, and received payment headers fail closed because inbound hosted-endpoint settlement is intentionally deferred.

This phase does not claim hosted-endpoint settlement, a `PAYMENT-RESPONSE`, a receipt, or a Casper deploy hash.

Independent review passed with no blocking or should-fix findings.

## Artifacts Checked

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-6-hosted-endpoint-payment-enforcement.md`
- Current context: `.thoughts/README.md`
- Spec: `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- Stories: `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- Prototype reintegration: `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Local references:
  - `.thoughts/raw/repos/casper-x402/js/README.md`
  - `.thoughts/raw/repos/casper-x402/js/examples/server/README.md`
  - `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`
- Context7 docs: `/coinbase/x402`, HTTP 402 v2 `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`
- Changed code:
  - `src/app/api/mcp/[sourceId]/route.ts`
  - `src/server/hosted-endpoint.ts`
  - `tests/unit/hosted-endpoint-post-routes.test.ts`
  - `tests/unit/hosted-endpoint-routes.test.ts`

## Requirement Traceability

| Requirement | Evidence |
| --- | --- |
| MCP client access remains separate from wallet/payment authorization. | `POST /api/mcp/[sourceId]` calls `requireEndpointAccess` before loading endpoint metadata. Payment headers do not authorize execution; they return `payment_verification_not_enabled`. |
| Published priced tools advertise payment requirements. | `hostedMcpTools` includes `_meta["casperGw/paymentRequirements"]`; `buildHostedPaymentRequired` derives x402 requirements from persisted tool pricing. |
| Paid tools are not callable for free. | `tools/call` with no `payment-signature` or `x-payment` returns HTTP `402` and never proxies upstream. |
| Runtime x402 challenge follows v2 HTTP behavior. | Route returns a `PaymentRequired` JSON body and `PAYMENT-REQUIRED` header encoded with `encodePaymentRequiredHeader` from `@x402/core/http`. |
| No fake settlement proof. | Route does not return `PAYMENT-RESPONSE`, `settled`, `deploy`, receipt id, or Casper proof. Incoming payment headers return `501`. |
| Tool scope still applies. | POST path passes `access.scope.toolIds` into `getHostedEndpoint`; unresolved tools return `tool not found`. |
| Secrets stay out of responses. | Tests assert no `credentialRef` or `tokenHash` appears in hosted endpoint POST metadata output. |

## Acceptance Criteria Coverage

| Acceptance Criteria | Coverage |
| --- | --- |
| GET keeps authenticated endpoint metadata. | Existing tests in `tests/unit/hosted-endpoint-routes.test.ts` still pass. |
| POST supports MCP discovery basics. | `tests/unit/hosted-endpoint-post-routes.test.ts` covers `tools/list`; route also supports `initialize` and `notifications/initialized`. |
| Unpaid priced call gets x402 challenge. | `returns a real x402 402 challenge for unpaid priced tool calls` decodes `PAYMENT-REQUIRED` and checks it equals the body. |
| Incoming payment is not falsely accepted. | `fails closed when payment headers arrive before inbound settlement is implemented` asserts HTTP `501` and explicit deferred status. |
| No fake proof wording. | Unit test asserts the 402 body does not contain `settled` or `deploy`; product guard also passed. |
| Quality gates pass. | `pnpm run ci` passed on 2026-06-23. |

## Quality Gates

Command run:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)" && pnpm run ci
```

Result: passed.

Evidence:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm guard:files`: passed with existing warnings only:
  - `src/components/screens/test-console-screen.tsx`
  - `src/server/live-paid-call.ts`
  - `tests/unit/explorer-search.test.ts`
  - `tests/unit/live-paid-call.test.ts`
- `pnpm guard:product`: passed.
- `pnpm guard:secrets`: passed.
- `pnpm test`: 23 files passed, 97 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:browser`: 10 passed, 2 intentional mobile skips.
- `pnpm build`: passed.
- Independent review: passed with no blocking or should-fix findings.

## Deviations From Plan

- No manual Chrome UI inspection was run because Phase 6 did not change rendered UI. The planned browser evidence is the Playwright Chromium smoke inside `pnpm run ci`.
- Inbound hosted-endpoint payment verification and settlement remains deferred by design. The route fails closed with `501 payment_verification_not_enabled` if a payment header is present.

## Gaps And Risks

- Hosted endpoint `tools/call` is not yet an end-to-end paid MCP execution path. The next phase must verify/settle incoming payment headers, persist the four receipt layers, resolve Casper proof, and only then call upstream MCP.
- The MCP POST handler is intentionally minimal. More complete Streamable HTTP behavior may be needed for production clients.
- `tools/list` uses `_meta` for Casper GW payment metadata. This is acceptable for the MVP but should be checked against real MCP client behavior when a client integration phase begins.

## Follow-ups

- Plan inbound hosted-endpoint settlement as its own Context Engineering slice.
- Add live non-spending route smoke against a real published source once the next provider setup flow is exercised again.
- Consider OpenAPI or `/.well-known/x402` discovery after runtime `402` behavior is proven with real hosted settlement.

## Evidence Log

- Planning commit: `afff428 docs: plan hosted endpoint enforcement`
- Implementation commit: `9fad7b8 feat: enforce hosted endpoint payment challenge`
- Focused test command:
  - `pnpm vitest run tests/unit/hosted-endpoint-post-routes.test.ts tests/unit/hosted-endpoint-routes.test.ts tests/unit/hosted-endpoint.test.ts`
  - Result: 3 files passed, 8 tests passed.
- Full gate command:
  - `pnpm run ci`
  - Result: passed with 97 unit tests, 10 browser tests, 2 intentional skips, and successful Next build.
- Independent reviewer:
  - Agent: `Ramanujan`
  - Result: PASS, no blocking or should-fix findings.
