# Verification Audit: Casper GW Phase 3 Paid Tool Console Settlement

Date: 2026-06-23
Branch: `feat/casper-gw-phase-0`
Commits audited: `8cecc37`, `cd8579d`, `14082be`, `2bd95eb`, review-fix worktree before final commit

## Verdict

Conditional pass for the Phase 3 implementation evidence, pending re-review.

The selected-wallet paid-console path is implemented, local CI passes, the initial independent review findings were accepted and fixed, and the approved live smoke produced a new real Casper Testnet settlement after those fixes. The live attempt persisted all four receipt layers: gateway attempt, policy decision, x402 verify/settle records, and Casper proof. Final Phase 3 completion still requires independent re-review of the fixes.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `src/app/api/paid-calls/run/route.ts`
- `src/server/live-paid-call.ts`
- `src/components/screens/test-console-screen.tsx`
- `src/components/screens/use-paid-call-console.ts`
- `src/components/screens/console-schema.ts`
- `scripts/live-smoke.ts`
- `tests/unit/live-paid-call.test.ts`
- `tests/unit/paid-call-routes.test.ts`
- `tests/unit/receipt-detail.test.ts`
- `tests/unit/x402-facilitator.test.ts`
- `tests/browser/smoke.spec.ts`
- Local command output from `pnpm verify`, `pnpm test:browser`, `pnpm build`, `pnpm run ci`, and `pnpm smoke:live`.

## Requirement Traceability

- Console request contract: `POST /api/paid-calls/run` now requires `endpointUrl`, `toolName`, `walletId`, and object `args` before orchestration.
- Endpoint-first discovery: `usePaidCallConsole` sends operator-authenticated discovery requests to `/api/tools/discover`, and `TestConsoleScreen` uses discovered MCP tools instead of provider fixture tools as the run source.
- Schema-derived inputs: `console-schema.ts` maps MCP input schemas into rendered fields and falls back only for `get_quote` defaults when schema data is absent.
- Wallet/policy selection: `TestConsoleScreen` sends the selected `walletId`; `live-paid-call.ts` requires and resolves the persisted wallet before signing.
- Signer compatibility gate: `live-paid-call.ts` compares the selected wallet account hash with the configured Testnet signer and blocks before CSPR.cloud balance checks, payment payload creation, verify, or settle when they differ.
- Endpoint scope gate: Phase 3 paid execution is restricted to the configured MCP endpoint so pasted endpoints cannot settle against server-default payment requirements.
- Policy-before-payment: `live-paid-call.ts` persists `policy_pending`, evaluates the effective policy, and only creates x402 payment payloads after policy allows.
- x402 verify/settle: `live-paid-call.ts` persists facilitator verify and settle records separately and branches on response bodies; the facilitator client preserves structured verify/settle failure bodies even when HTTP status is non-2xx.
- Casper proof: `resolveCasperProof` is called after settlement; successful proof writes deploy hash, deploy body, FT action, proof status, and explorer URL.
- Receipt detail: DB-backed receipts now build detail rows from persisted `policy_decisions`, `x402_records`, and `casper_proofs` instead of fixture-derived payer/payee/policy strings.
- Public receipt/explorer access: unchanged public `/explorer` browser smoke continues to pass without app shell or wallet connection.
- Live smoke selected-wallet path: `scripts/live-smoke.ts` now resolves or creates the signer wallet profile, ensures an allow policy, and calls `runLivePaidToolCall` with `walletId`, endpoint, tool, and args.

## Acceptance Criteria Coverage

- AC-07: An allowed paid call reaches x402 verify/settle and creates a receipt. Evidence: post-fix live attempt `dfb14079-44e0-4006-b66f-99e1f22f0fc0` settled.
- AC-08: Live/Testnet success is never shown without a real deploy hash. Evidence: post-fix deploy hash `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810` persisted only after settle success and CSPR.cloud proof resolution.
- AC-09: Paid console discovers endpoint tools and renders inputs after tool selection. Evidence: `console-schema.ts`, `test-console-screen.tsx`, and browser smoke for the corrected console framing.
- AC-10: Public explorer remains public. Evidence: browser smoke passes for `/explorer` with no authenticated app shell.
- AC-11: Receipt layer separation is preserved. Evidence: DB check for live attempt found gateway attempt, policy decision, x402 verify/settle records, and Casper proof records.
- AC-12: Public detail redaction remains enforced by existing receipt rendering and secret/product guards. No CSPR.cloud token, signer material, provider secret, bearer token, or payment payload was exposed in browser smoke or audit output.
- AC-13: Settings/audit trust boundaries remain intact. Existing health and secret browser/API smokes continue to pass.

## Quality Gates

- `pnpm verify`: passed.
  - File guard: passed with warnings only:
    - `src/components/screens/test-console-screen.tsx`: 224 lines.
    - `src/server/live-paid-call.ts`: 218 lines.
    - `tests/unit/live-paid-call.test.ts`: 265 lines.
  - Product guard: passed.
  - Secret guard: passed.
  - Vitest: 21 test files, 83 tests passed.
  - Typecheck: passed.
  - Lint: passed.
- `pnpm test:browser`: passed.
  - 10 browser tests passed.
  - 2 mobile-only tests intentionally skipped.
- `pnpm build`: passed.
- `pnpm run ci`: passed after the review fixes.
- `pnpm wrap:wcspr`: passed to replenish the Testnet signer WCSPR after earlier paid smokes.
- `pnpm smoke:live`: passed after review fixes and spent one approved WCSPR payment.

## Independent Review

Reviewer `Sagan` returned an initial **FAIL** with five findings:

- Blocking: missing `walletId` could fall back to the configured signer and reach payment.
- Blocking: pasted paid endpoints could settle using server-default payment requirements.
- Blocking: DB-backed public receipt details used fixture-derived policy/x402/Casper layer values.
- Should-fix: non-2xx facilitator verify/settle bodies were discarded.
- Should-fix: an empty real discovery could fall back to fixture tool rows.

All five findings were accepted and fixed:

- `POST /api/paid-calls/run` now rejects missing `walletId`, missing endpoint/tool, and malformed `args` before orchestration.
- `runLivePaidToolCall` now requires `walletId`, `endpointUrl`, `toolName`, and `args`, and rejects endpoints other than the configured Phase 3 MCP endpoint before discovery/payment.
- `buildPersistedReceiptDetail` in `src/lib/persisted-receipt-detail.ts` builds receipt layers from persisted policy/x402/proof rows.
- `X402FacilitatorClient` preserves structured verify/settle failure bodies for body-level failure handling.
- `TestConsoleScreen` renders an empty state when real discovery returns no tools.

Re-review is pending.

## Live Proof Evidence

- Command: `pnpm smoke:live`
- WCSPR wrap transaction used before post-fix live smoke: `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`
- Wrap explorer link: `https://testnet.cspr.live/transaction/1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`
- Attempt id: `dfb14079-44e0-4006-b66f-99e1f22f0fc0`
- Status: `settled`
- Deploy hash: `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`
- Explorer link: `https://testnet.cspr.live/deploy/8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`
- Persisted DB evidence:
  - attempt status `settled`
  - tool `get_quote`
  - network `casper:casper-test`
  - asset `3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e`
  - client `phase-3-console`
  - policy allowed with reason `policy allowed before signing/payment`
  - 2 x402 records with verify and settle responses
  - Casper proof status `processed`
  - deploy body present
  - FT action present

## Deviations From Plan

- The first judged paid path remains `get_quote`; arbitrary paid tools are not broadened yet. This matches the plan's "one complete loop first" constraint.
- Session spend tracking still uses `sessionSpent = 0` in the orchestrator; a richer session model is deferred.
- The UI does not implement CSPR.click/browser signing. It states the Testnet signer gate and the server enforces the configured signer match.
- The console default hosted target uses the provider source URL for the real Remote MCP target, not a relative hosted endpoint as the live payment target. Hosted MCP endpoint payment enforcement remains Phase 1 metadata/client-access work, while Phase 3 proves the paid run against the real upstream endpoint.
- File-size warnings remain above the 200-line target but under the 300-line hard cap.

## Gaps And Risks

- Independent re-review is still pending at the time this audit was updated.
- Session-budget semantics are not fully modeled yet.
- Browser tests verify UI framing and public/private separation, not a secret-backed browser run with a real operator token.
- The live smoke auto-creates or updates a permissive `get_quote` policy for the signer wallet when needed. This is acceptable for the smoke script but should not be a normal user-facing action.

## Follow-ups

- Split `live-paid-call.ts`, `test-console-screen.tsx`, and `tests/unit/live-paid-call.test.ts` below the 200-line target when the next backend/UI slice touches them.
- Add a richer session model before claiming session budget enforcement.
- Add secret-injected browser smoke only if Abu wants browser-level real operator flows in local verification.
- Implement browser-wallet signing only through a separate accepted plan.

## Evidence Log

- Backend selected-wallet gate commit: `8cecc37 feat: gate paid calls by selected wallet`.
- Console UI wiring commit: `cd8579d feat: wire paid console request state`.
- Product guard wording fix commit: `14082be fix: align signer gate wording`.
- Selected-wallet live-smoke script commit: `2bd95eb test: exercise selected wallet in live smoke`.
- Review-fix evidence: `pnpm run ci` passed with 83 unit tests, 10 browser tests, 2 intentional skips, and production build.
- Post-fix WCSPR wrap transaction: `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`.
- Post-fix real deploy hash: `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`.
- Post-fix real attempt id: `dfb14079-44e0-4006-b66f-99e1f22f0fc0`.
