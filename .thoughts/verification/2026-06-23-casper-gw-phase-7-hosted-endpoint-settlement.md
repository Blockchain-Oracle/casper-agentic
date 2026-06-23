# Verification Audit: Phase 7 Hosted Endpoint Settlement

## Verdict

Pass.

Phase 7 now completes the hosted MCP/x402 paid-call loop for a published tool. The hosted endpoint accepts a signed `PAYMENT-SIGNATURE`/`x-payment`, binds it to the exact hosted resource, verifies through CSPR.cloud, enforces wallet policy before settlement, settles through CSPR.cloud, resolves Casper proof, calls upstream MCP only after successful proof, persists a four-layer receipt, and returns `PAYMENT-RESPONSE`.

The first independent review failed with two blockers and one should-fix. All findings were accepted and fixed. A scoped re-review passed. A manual hosted live smoke then exposed a real hosted WCSPR metadata drift, which was fixed and proven with a real Testnet deploy. Final scoped reviews passed.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-7-hosted-endpoint-settlement.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- Changed implementation commits:
  - `35368d1 feat: settle hosted endpoint payments`
  - `36cecee fix: persist hosted settlement failures`
  - `e6863ca fix: preserve hosted payment metadata`
  - `6cb971d fix: keep pricing helper top-level`
- Tests and manual smoke script:
  - `tests/unit/hosted-paid-call.test.ts`
  - `tests/unit/hosted-endpoint-post-routes.test.ts`
  - `tests/unit/provider-store.test.ts`
  - `tests/unit/provider-tool-actions.test.ts`
  - `scripts/hosted-live-smoke.ts`

## Requirement Traceability

- RQ-40 x402 flow: covered by `src/app/api/mcp/[sourceId]/route.ts`, `src/server/hosted-paid-call.ts`, and `src/server/hosted-paid-call-completion.ts`. The route delegates signed `tools/call` requests to the hosted paid-call orchestrator and returns `PAYMENT-RESPONSE` only on settled/proven outcomes.
- RQ-41 real Casper-compatible settlement: production code uses `X402FacilitatorClient` and CSPR.cloud facilitator, not mock settlement.
- RQ-42 persist verify/settle responses: `hosted-paid-call.ts` persists verify and settle records, including structured failed settle request records.
- RQ-43 successful settlement proof: `hosted-paid-call-completion.ts` persists deploy hash, proof status, raw explorer URL, and token-action proof when CSPR.cloud resolves proof.
- RQ-44 failure reasons: verify failure, policy block, settle body failure, settle transport failure, proof pending, upstream returned error, and upstream thrown error all record terminal statuses/audit.
- RQ-45 body-based facilitator handling: code branches on facilitator response bodies (`isValid`, `success`, `transaction`, `errorReason`) rather than HTTP status alone.
- RQ-46 no live claim without deploy hash: success path requires settle success and proof resolution before upstream output is returned as successful.
- RQ-50 attempt states: hosted path persists `verify_failed`, `blocked`, `settle_failed`, `raw_proof_unavailable`, `upstream_failed`, and `settled`.
- RQ-51 to RQ-54 receipt layers: existing persisted receipt detail renders gateway, policy, x402, and Casper proof layers; hosted policy-block notes now distinguish hosted "before settlement" from local signer "before signing".
- RQ-57 to RQ-58 audit: hosted verify, policy block, settle failure, proof pending, upstream failure, and success write audit events.

## Acceptance Criteria Coverage

- AC-07: Covered by unit tests and the real hosted live smoke. Hosted smoke produced receipt `6bd29008-6943-4e71-aeca-4451effff473`.
- AC-08: Covered by code and tests. The route returns `PAYMENT-RESPONSE` only from settlement/proof paths; no deploy hash is rendered for verify/policy/settle failures.
- AC-10: Public explorer behavior was not changed in this phase; full CI browser smoke still passes public explorer separation checks.
- AC-11: Persisted receipt detail still separates layers; tests continue to pass.
- AC-12: Hosted smoke and receipt paths do not print bearer token, payment signature, PEM, API key, payment response header, or upstream credentials.

## Quality Gates

- Focused tests after review fixes:
  - `pnpm vitest run tests/unit/hosted-paid-call.test.ts tests/unit/hosted-endpoint-post-routes.test.ts && pnpm typecheck`: passed, 12 tests.
- Full CI after review fixes:
  - `pnpm run ci`: passed, 106 unit tests, typecheck, lint, 10 browser tests, 2 intentional mobile skips, build.
- Focused pricing metadata tests:
  - `pnpm vitest run tests/unit/provider-store.test.ts tests/unit/provider-tool-actions.test.ts tests/unit/hosted-endpoint.test.ts tests/unit/hosted-paid-call.test.ts && pnpm typecheck`: passed, 20 tests.
- Hosted live smoke:
  - First run failed safely with HTTP 402 and no receipt header due to CSPR.cloud `invalid_exact_casper_missing_token_name`.
  - After fixing hosted payment metadata, `pnpm smoke:hosted-live` passed.
- Final full CI:
  - `pnpm run ci`: passed, 106 unit tests, typecheck, lint, 10 browser tests, 2 intentional mobile skips, build.
- Final cleanup verification:
  - `pnpm vitest run tests/unit/provider-tool-actions.test.ts && pnpm typecheck && pnpm lint`: passed, 5 tests.

File-size guard warnings remain under the 300-line hard cap:

- `src/app/api/mcp/[sourceId]/route.ts`
- `src/server/hosted-paid-call.ts`
- `src/server/live-paid-call.ts`
- `src/components/screens/test-console-screen.tsx`
- `tests/unit/explorer-search.test.ts`
- `tests/unit/hosted-endpoint-post-routes.test.ts`
- `tests/unit/hosted-paid-call.test.ts`
- `tests/unit/live-paid-call.test.ts`

## Live Proof Evidence

- Hosted smoke command: `pnpm smoke:hosted-live`
- HTTP status: `200`
- Receipt id: `6bd29008-6943-4e71-aeca-4451effff473`
- Receipt status: `settled`
- Deploy hash: `a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`
- Explorer URL: `https://testnet.cspr.live/deploy/a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`
- Hosted source id: `6b38c1a6-c1f0-498f-8612-d2c4e73f42a0`
- Hosted tool id: `4c1e5a7b-b79d-41ed-af5c-c506d751c147`

## Review History

- Initial independent review on `0cedb61..35368d1`: Fail.
  - Blocking: thrown upstream MCP errors after settlement were not persisted or returned with `PAYMENT-RESPONSE`.
  - Blocking: thrown facilitator settle request failures after verify/policy were not persisted.
  - Should-fix: malformed payment signatures returned a plain route error instead of JSON-RPC when request id was known.
- Fix commit: `36cecee fix: persist hosted settlement failures`.
- Scoped re-review on `35368d1..36cecee`: Pass, no findings.
- Final metadata review on `36cecee..e6863ca`: Pass, no findings.
- Ultra-scoped helper cleanup review on `e6863ca..6cb971d`: Pass, no findings.

## Deviations From Plan

- The plan allowed an optional credential-gated live smoke. This audit includes it because credentials and funded Testnet signer material were available.
- A new manual script `pnpm smoke:hosted-live` was added. It is not part of normal CI because it spends WCSPR on Testnet and persists smoke setup records.
- The hosted smoke writes a provider source, scoped endpoint key, wallet record if missing, spend policy if needed, paid receipt, proof, and audit rows in the configured database. This is acceptable only for a Testnet/dev database.

## Gaps And Risks

- The hosted smoke uses the local Testnet signer. This remains an integration verification path, not production wallet UX.
- The smoke creates durable test records in the configured database. Do not run it against a production database.
- Mainnet, CSPR.click/browser signing, production custody, hosted key custody, and broad UI redesign remain out of scope.
- No GitHub PR was opened because this checkout still has no configured remote.

## Follow-ups

- Consider a cleanup/admin path for smoke provider sources and endpoint keys if repeated live smokes become noisy.
- Split warning-size files before they approach the 300-line hard cap.
- Plan the next Context Engineering slice before adding CSPR.click signing, Mainnet, account-history pagination, or UI redesign work.

## Evidence Log

- `35368d1 feat: settle hosted endpoint payments`
- `36cecee fix: persist hosted settlement failures`
- `e6863ca fix: preserve hosted payment metadata`
- `6cb971d fix: keep pricing helper top-level`
- `pnpm run ci`: passed after final code changes.
- `pnpm smoke:hosted-live`: passed with real deploy hash `a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`.
