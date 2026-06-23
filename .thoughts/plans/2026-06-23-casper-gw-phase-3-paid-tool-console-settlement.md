# Plan: Casper GW Phase 3 Paid Tool Console Settlement

Date: 2026-06-23
Status: Draft for Abu acceptance before implementation

## Inputs

- `.thoughts/README.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-1-provider-gateway.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-1-provider-gateway.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-2-wallet-readiness-policy.md`
- `.thoughts/verification/2026-06-23-casper-gw-phase-2-wallet-readiness-policy.md`
- Current repo state at `22a41d4`.

## Assumptions

- Phase 0, Phase 1, and Phase 2 are satisfied locally.
- CSPR.cloud remains the indexed-data path and hosted x402 facilitator path.
- `cspr-trade-mcp` remains the first real upstream provider path.
- The current local Testnet signer is integration-only and non-production.
- CSPR.click/browser signing remains later product work.
- Phase 3 may spend WCSPR during the live smoke gate. Do not run the live paid call unless Abu accepts that spend for the checkpoint.
- `CSPR_CLOUD_API_KEY`, `DATABASE_URL`, signer PEM material, payee account hash, and operator access token remain server-only.

## Open Questions

- Does Abu accept spending one small WCSPR payment for the Phase 3 live gate?
- Should Phase 3 support only the hosted source endpoint first, or also allow pasted external MCP/x402 URLs in the judged path?
- Should `get_quote` remain the only live paid tool for the first Phase 3 gate, with arbitrary discovered tools deferred until the hosted endpoint path is hardened?
- Should the console create an explicit session id for session spend tracking now, or keep session spend at zero until a later session model is accepted?

## Prototype Reintegration Gate

- The old sandbox pattern must not return. The surface is a paid tool console.
- The console must be endpoint-first: choose hosted endpoint or paste MCP/x402 URL, discover tools, select tool, render schema-derived inputs, select wallet/policy, run.
- Mocked product modes are not allowed. No `Simulated`, `Local`, scenario toggles, fake deploy hashes, or fake `settled` states may ship in the Phase 3 path.
- Remaining fixtures are allowed only for visibly labeled sample history or local tests outside the judged paid-call path.
- The browser-selected wallet must not be treated as signing authority. With the current local-signer path, the server must verify that the selected wallet resolves to the configured Testnet signer account before creating a payment payload. If not, fail closed before signing/payment.

## Phase 3A: Console Request Contract And Selection State

### Goal

Replace the console's fixture selection contract with a real request model that carries endpoint, tool, wallet, and typed input choices into the server.

### Work

- Extend `POST /api/paid-calls/run` to accept `endpointUrl` or hosted source id, `toolName`, `walletId`, and `args`.
- Validate request shape with server-side runtime checks.
- Update `src/components/screens/use-paid-call-console.ts` so discovery and run calls pass the selected endpoint, selected tool, selected wallet, and current input values.
- Update `src/components/screens/test-console-screen.tsx` to stop hard-coding default `get_quote` values outside the selected tool input state.
- Keep operator access required for paid-call execution.

### Real Integration Path

The request contract is real. It must use persisted wallet profiles for `walletId`, and either the configured source endpoint or a guarded pasted MCP endpoint for discovery.

### Mock/Simulation Policy

Unit-test fixtures can exercise request validation. Product UI cannot claim a mock run succeeded.

### Checks

- Unit tests for request validation and missing `walletId`, missing endpoint, missing tool, malformed args, and unsupported endpoint.
- Browser smoke confirming the console discovers before run and sends selected wallet/tool state.

### Acceptance Criteria Covered

RQ-30 to RQ-37, RQ-40, AC-07, AC-09.

### Stop Condition

The console can submit a complete selected endpoint/tool/wallet/input request, and invalid requests fail before policy or payment.

## Phase 3B: Wallet Readiness And Local-Signer Compatibility Gate

### Goal

Ensure selected-wallet readiness and signing authority are true before any x402 payload is created.

### Work

- Resolve `walletId` to a persisted wallet profile in `runLivePaidToolCall`.
- Normalize selected wallet account hash and compare it with `getConfiguredSignerAddress(config)` for the current local-signer integration path.
- If selected wallet does not match the configured signer, create a no-transaction receipt/audit record and return a blocked status.
- Re-check CSPR gas and WCSPR balances through CSPR.cloud for the selected wallet before policy evaluation.
- Persist the selected wallet account hash, not a fixture wallet value.

### Real Integration Path

CSPR.cloud account and FT ownership checks remain real. Local signer remains real but only for the matching configured Testnet wallet.

### Mock/Simulation Policy

No wallet can be treated as ready from client state. Browser wallet signing is deferred and must not be implied.

### Checks

- Unit tests for wallet id lookup, selected wallet mismatch, missing signer, insufficient balance, and account normalization.
- Regression test that mismatch creates no x402 record and no Casper proof.

### Acceptance Criteria Covered

RQ-20 to RQ-29, RQ-36, RQ-40, RQ-46, RQ-50, AC-05, AC-06, AC-08.

### Stop Condition

Selected-wallet mismatch or not-ready state always stops before payment payload creation.

## Phase 3C: Effective Policy Pre-Check With Console Inputs

### Goal

Run the Phase 2 persisted spend policy against the actual selected tool, asset, network, amount, and wallet before signing.

### Work

- Load the effective spend policy for the selected wallet/account hash.
- Evaluate allowed network, asset, selected tool, max-per-call, daily headroom, disabled state, and current session assumption.
- Persist `policy_pending`, policy decision, and audit rows with clear status transitions.
- Preserve the Phase 2 guarantee that policy-blocked attempts produce no x402 verify/settle record and no Casper deploy claim.

### Real Integration Path

Policy persistence and decision records are real Postgres records. Daily spend uses persisted paid-call attempt records.

### Mock/Simulation Policy

Session spend can stay at zero only if explicitly noted in the audit metadata as `session_model_pending`. Do not present a richer session budget as implemented.

### Checks

- Unit tests for allowed tool, blocked tool, max-per-call, disabled policy, daily limit, and policy evaluation failure after attempt insert.
- Receipt detail test for policy-blocked/no-transaction state.

### Acceptance Criteria Covered

RQ-27 to RQ-29, RQ-37 to RQ-39, RQ-50, AC-06, AC-11.

### Stop Condition

A policy block returns a receipt id, records the reason, and creates no signing/payment side effects.

## Phase 3D: x402 Verify/Settle And Upstream Execution

### Goal

Connect the allowed console request to the real Casper x402 payment path and execute the selected MCP tool only after settlement succeeds.

### Work

- Build payment requirements from the persisted tool price where available, falling back only to server-owned Testnet/WCSPR defaults when the request targets the configured Phase 0 endpoint.
- Create the Casper payment payload with the configured local Testnet signer.
- Call CSPR.cloud facilitator `/verify` and `/settle`; branch on response body success fields, not HTTP status alone.
- Persist verify and settle responses separately in `x402_records`.
- Resolve Casper proof with CSPR.cloud before claiming `settled`.
- Call the selected MCP tool using `callMcpTool(endpointUrl, toolName, args)` only after successful settlement and proof handling.
- Record upstream failure as `upstream_failed` without erasing the real payment proof.

### Real Integration Path

CSPR.cloud facilitator, Casper Testnet deployment, CSPR.cloud deploy lookup, and Remote MCP call are real. The first live gate should target `get_quote` to reduce blast radius.

### Mock/Simulation Policy

No fake verify, settle, transaction, deploy hash, or Casper proof may appear in the judged path. If proof is pending indexing, return `raw_proof_unavailable` with the real deploy hash stored as pending proof.

### Checks

- Unit tests for verify failure, settle failure, pending proof, upstream failure after settlement, and successful settlement receipt state.
- Credential-gated live smoke for one `get_quote` paid call.
- Secret guard must confirm no payment payload, API key, signer PEM, provider credential, or bearer token leaks to client logs or public receipts.

### Acceptance Criteria Covered

RQ-40 to RQ-46, RQ-50 to RQ-55, AC-07, AC-08, AC-11, AC-12.

### Stop Condition

One allowed request produces either a truthful failure receipt or a real Testnet deploy hash resolvable through CSPR.cloud and linkable on `testnet.cspr.live`.

## Phase 3E: Minimal UI Wiring And Receipt Timeline

### Goal

Show the real console states and receipt link without doing broad visual redesign.

### Work

- Update the console to render discovery, input entry, selected wallet/policy, policy pre-check, signing/verify, settling, proof lookup, upstream result, and receipt link states.
- Render schema-derived inputs for `get_quote` fields and show `No input required` for no-input tools.
- Keep raw JSON input as advanced/debug only if needed.
- Show selected wallet readiness from real `/api/wallets/[id]/readiness` data.
- Link completed attempts to public receipt detail through `/explorer`.
- Keep fixture sample history visibly labeled.

### Real Integration Path

UI reads live APIs for discovery, wallet readiness, paid-call execution, and receipt detail.

### Mock/Simulation Policy

No run-result mock may be displayed as a live result. Sample history remains explicitly labeled.

### Checks

- Browser smoke for `/app` console discover -> select tool -> select wallet -> blocked or paid result.
- Browser smoke for public `/explorer` and receipt detail without authenticated app shell.
- Mobile smoke for no overlap and public explorer accessibility.

### Acceptance Criteria Covered

RQ-30 to RQ-39, RQ-47 to RQ-55, AC-09, AC-10, AC-11, AC-13.

### Stop Condition

The judged console path uses real APIs and links to a public receipt without fake proof language.

## Phase 3F: Verification, Review, And Handoff

### Goal

Close Phase 3 with evidence, independent review, and no silent proof gaps.

### Work

- Run `pnpm verify`.
- Run `pnpm test:browser`.
- Run `pnpm run ci`.
- Run the credential-gated live paid-call smoke only after Abu accepts one WCSPR spend.
- Write `.thoughts/verification/YYYY-MM-DD-casper-gw-phase-3-paid-tool-console-settlement.md`.
- Spawn an independent reviewer for code review focused on wallet mismatch, proof honesty, secret exposure, file-size guard, and fixture leakage.
- Fix blocking review findings before marking Phase 3 complete.
- Commit changes locally. Open a PR only if a GitHub remote exists and CI can run.

### Real Integration Path

Verification must include one real Testnet proof if Abu approves the spend. If not approved, Phase 3 can only be marked locally implemented without the live paid-call gate complete.

### Mock/Simulation Policy

No mock can substitute for the live proof gate. A non-live run must be labeled as not yet live-verified.

### Checks

- `pnpm verify`
- `pnpm test:browser`
- `pnpm run ci`
- Manual live smoke evidence with attempt id, deploy hash, CSPR.cloud proof status, and `testnet.cspr.live` link
- Independent reviewer PASS

### Acceptance Criteria Covered

AC-07 to AC-13.

### Stop Condition

Stop before marking Phase 3 complete if live settlement is not approved/funded, if CSPR.cloud cannot resolve proof, if the selected wallet cannot sign through the accepted mode, or if reviewer finds blockers.

## Verification Checkpoint

Before completion, the verification audit must map:

- Stories 7, 8, 9, and 10 to code/tests/evidence.
- RQ-30 to RQ-55 to implementation and screenshots.
- Policy-block receipt to no x402/no Casper proof.
- Payment-failed receipt to verify/settle records without false proof.
- Successful paid receipt to real facilitator settle response and CSPR.cloud deploy proof.
- Public explorer receipt detail to no auth/sidebar and redaction.

## Handoff Notes

- Do not broaden into production custody, CSPR.click signing, Mainnet, marketplace/registry, generic send policy, or design overhaul in this phase.
- Do not paste or commit `.env.local`, CSPR.cloud tokens, signer PEMs, provider credentials, endpoint bearer tokens, or payment payload secrets.
- The local Testnet signer is only an integration verification path. Product copy must say so.
- The first implementation slice should make `get_quote` work end to end before adding arbitrary paid tools.
- If the user-selected wallet differs from the configured signer, treat it as a truthful product limitation and block before signing.
