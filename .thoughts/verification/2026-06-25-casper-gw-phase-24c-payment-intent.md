# Verification Audit: Phase 24C Server Payment-Intent Handoff

## Verdict

Pass.

Phase 24C adds the server-side policy/payment-intent handoff for future CSPR.click browser signing. It does not call CSPR.click, does not prompt a browser wallet, does not create a final x402 payment payload, does not call facilitator verify/settle, does not use the local Testnet signer, and does not claim Casper proof or a deploy hash.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24a-signing-contract.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24b-browser-adapter.md`
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/client/scheme.ts`
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx`
- Installed package declarations/source for `@casper-ecosystem/casper-eip-712` and `@make-software/casper-x402`
- Changed source and tests:
  - `src/server/browser-payment-intent.ts`
  - `src/server/browser-payment-intent-typed-data.ts`
  - `src/app/api/paid-calls/payment-intents/route.ts`
  - `src/server/live-paid-call-policy.ts`
  - `src/lib/persisted-receipt-detail.ts`
  - `tests/unit/browser-payment-intent.test.ts`
  - `tests/unit/browser-payment-intent-route.test.ts`
  - `tests/unit/browser-payment-intent-fixtures.ts`
  - `tests/unit/persisted-receipt-pending-intent.test.ts`

Context7 status: `npx ctx7@latest library` returned `fetch failed` for both `@casper-ecosystem/casper-eip-712` and `@make-software/casper-x402`, so this audit uses local `.thoughts`, cloned references, and installed package files.

## Requirement Traceability

| Requirement | Evidence |
| --- | --- |
| Add server payment-intent route | `POST /api/paid-calls/payment-intents` calls `createBrowserPaymentIntent()` after operator access and request parsing. |
| Do not require local signer path | The route does not call `requireHttpSigningEnabled()`, `createCasperPaymentPayload()`, or `getConfiguredSignerAddress()`. The config gate requires CSPR.cloud, Postgres, and payee account hash only. |
| Policy before wallet approval | `createBrowserPaymentIntent()` persists an attempt, validates browser-wallet compatibility, checks CSPR.cloud wallet balance evidence, runs `evaluateLivePaidCallPolicy()`, and only then returns signing params. |
| Policy blocks return no signing params | Blocked policy and incompatible-wallet paths return `{ status: "blocked" }`, persist a policy decision/audit row, update the attempt, and include no `signing`, `paymentPayload`, or facilitator result. |
| Allowed intent response is redacted | The allowed response includes payment requirements, resource URL, expected account/public key, x402 version, and CSPR.click typed-data params only. Tests assert no CSPR.cloud token, signer material, endpoint token hash, payment payload, or private policy evidence appears. |
| Typed data follows Casper exact/CSPR.click shape | Superseded by Phase 24M: `buildCSPRClickPaymentIntentParams()` now returns the current CSPR.click documented `TransferWithAuthorization` request shape with unprefixed `contract_package_hash`, `from`, `to`, and `nonce`, while the final x402 payment payload remains unprefixed for facilitator verification. |
| No settlement/proof overclaim | No x402 record, settle response, Casper proof, explorer URL, or deploy hash is created by this route. Receipt copy says policy allowed but wallet signing has not run yet. |
| Preserve live paid-call policy behavior | `evaluateLivePaidCallPolicy()` now accepts `RuntimeConfig` because it never needed signer material; existing live paid-call tests continue to pass. |

## Acceptance Criteria Coverage

- Allowed browser intent returns `ready_for_signature` only after policy allows.
- Allowed browser intent response includes CSPR.click `signTypedData` params and excludes secrets.
- Policy block creates a receipt/audit state and returns no signing params.
- Incompatible `test-signer` wallet is blocked before CSPR.cloud balance checks.
- The route requires operator access.
- The route parses endpoint/tool/wallet/args and rejects malformed args before orchestration.
- Receipt detail labels policy-allowed unsigned intents as awaiting browser wallet signing, with x402 settlement `not attempted` and no Casper proof.

## Quality Gates

Fresh commands run:

```bash
pnpm exec vitest run tests/unit/browser-payment-intent.test.ts tests/unit/browser-payment-intent-route.test.ts --reporter=dot
pnpm exec vitest run tests/unit/browser-payment-intent.test.ts tests/unit/browser-payment-intent-route.test.ts tests/unit/persisted-receipt-pending-intent.test.ts tests/unit/live-paid-call-policy.test.ts --reporter=dot
pnpm typecheck
pnpm run guard:files
pnpm run guard:product
pnpm run guard:secrets
pnpm run guard:workflows
pnpm test
pnpm run ci
```

Results:

- New focused route/orchestrator tests passed: 2 files, 6 tests.
- Focused policy/receipt suite passed: 4 files, 12 tests.
- `pnpm typecheck` passed.
- File-size, product-scope, secret, and workflow guards passed.
- Full unit suite passed: 47 files, 198 tests.
- Full `pnpm run ci` passed with 198 unit tests, 19 browser tests, 3 intentional mobile skips, and `next build`.

Line counts after implementation:

- `src/server/browser-payment-intent.ts`: 173 lines.
- `src/server/browser-payment-intent-typed-data.ts`: 71 lines.
- `src/app/api/paid-calls/payment-intents/route.ts`: 51 lines.
- `src/lib/persisted-receipt-detail.ts`: 187 lines.
- `tests/unit/browser-payment-intent.test.ts`: 195 lines.
- `tests/unit/browser-payment-intent-route.test.ts`: 94 lines.
- `tests/unit/browser-payment-intent-fixtures.ts`: 54 lines.
- `tests/unit/persisted-receipt-pending-intent.test.ts`: 35 lines.

## Deviations From Plan

- The intent route currently limits execution to the configured MCP endpoint, matching the current paid-call console boundary.
- The typed-data amount is fail-closed if it cannot be represented as a safe JavaScript integer. The current Testnet WCSPR payment amount is safe. A later slice should deliberately support larger `uint256` encoding before raising prices beyond that.

## Gaps And Risks

- No browser/manual CSPR.click runtime proof is included in this slice.
- No signature is collected or submitted to the facilitator in this slice.
- The next phase must wire CSPR.click signature output into the Phase 24A payment-payload builder, then verify/settle through CSPR.cloud with no local-signer fallback.

## Follow-ups

- Phase 24D should add browser approval/completion wiring for the paid console, including active public-key match, CSPR.click cancel/error states, and a server completion route that verifies/settles only a real signed payload.
- The route should remain hidden from general MCP clients until the browser-signing completion path is proven.

## Independent Review

Reviewer `Darwin` inspected the Phase 24C diff and reported no blocking or should-fix findings. The review confirmed operator access, no HTTP signing/local-signer dependency, policy before signing params, no facilitator settlement, no secret leakage, and honest unsigned receipt copy.

## Evidence Log

- Red tests failed initially because `@/server/browser-payment-intent` and `/api/paid-calls/payment-intents` did not exist.
- A regression test caught duplicate policy-decision persistence on policy blocks; the implementation was fixed to write once.
- A receipt test caught misleading `policy_pending` copy for policy-allowed browser intents; the receipt note was fixed.
