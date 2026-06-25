# Plan: Phase 24 Real CSPR.click Browser Signing

## Status

Pending acceptance.

This plan is intentionally not an implementation commit. Phase 23 made the wallet-signing boundary honest; Phase 24 is the first planned step toward replacing the integration-only local Testnet signer with a browser-approved CSPR.click x402 payment path.

## Inputs

- `AGENTS.md`: use local `.thoughts/` and cloned references before product decisions; keep payment authorization separate from provider credentials and MCP client access; do not claim CSPR.click/browser signing or production custody without a verified path.
- `.thoughts/README.md`: current build gate says real CSPR.click/browser signing still needs its own accepted plan.
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`: signing mode is an explicit decision and production custody is not claimed.
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`:
  - RQ-26: signing mode must be explicit.
  - RQ-28/RQ-29: policy must run fail-closed before signing/payment, and policy blocks must create no Casper transaction.
  - RQ-37/RQ-40: the console timeline must show policy before x402 verify/settle, and paid calls must follow the x402 payment flow.
  - RQ-46/RQ-51/RQ-52: no live settlement claim without real deploy proof; receipts must keep four layers and redact sensitive data.
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`: Story 9 blocks unsafe calls before wallet signing; Story 10 keeps public explorer/receipt proof separate and public.
- `.thoughts/plans/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`: next real CSPR.click phase must design the handoff between server policy/payment requirements and browser approval, then prove one signed Testnet x402 payment with no local signer fallback.
- `.thoughts/verification/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`: CSPR.click/browser signing remains unimplemented; future work must prove active-wallet public-key matching, cancellation/error/timeout handling, policy-before-approval, and CSPR.cloud proof resolution.
- `.thoughts/wiki/cspr-trade-mcp-and-x402.md` and `.thoughts/research/2026-06-18-agent-commerce-gateway-reality-refresh.md`: Casper x402 uses CEP-18 `transfer_with_authorization` with EIP-712 typed-data signatures.
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/signer.ts`: the TypeScript x402 client expects a `ClientCasperSigner` with `accountAddress()`, `publicKey()`, and `signEIP712(digest)`.
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/client/scheme.ts`: the exact Casper scheme builds a `TransferWithAuthorization` typed-data authorization, hashes it, signs the digest, and returns an x402 payment payload.
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/README.md` and `SignTypedData.tsx`: the CSPR.click demo signs the x402 EIP-712 typed data, handles cancellation/error, assembles the payment payload, and requests the protected resource.
- Official CSPR.click docs fetched directly after Context7 failed twice with `fetch failed`:
  - `https://docs.cspr.click/cspr.click-sdk/reference/methods.md`
  - `https://docs.cspr.click/cspr.click-sdk/reference/types.md`
  - `https://docs.cspr.click/cspr.click-sdk/javascript/signing-transactions.md`

## Current Reality

- Real Testnet x402 proof exists through the integration-only local Testnet signer.
- `GET /api/health/integrations` reports CSPR.click/browser signing as `not_enabled`.
- The product no longer claims hosted custody.
- The browser signing path must not fall back to the local signer. A fallback would hide whether CSPR.click actually works.
- The x402 payment primitive is not a normal Casper transaction send. The main target is CSPR.click `signTypedData(params, signingPublicKey)`, because Casper x402 signs an EIP-712 `TransferWithAuthorization` authorization. CSPR.click `send(transactionJSON, signingPublicKey, onStatusUpdate?, timeout?)` is useful for transaction signing/sending, but it is not the default x402 authorization primitive for this phase.

## Assumptions

- Phase 24 remains Casper Testnet only.
- CSPR.cloud hosted facilitator remains the settlement path.
- CSPR.click app/project configuration may require a public app id or app settings. If so, it must be configured as public browser config only, not as a secret.
- The browser wallet account selected in CSPR.click must match the wallet profile/public key selected in Casper GW before any signing request is shown.
- Server-side policy is authoritative. Browser state can request signing only after the server creates a policy-approved payment-intent.
- Provider upstream credentials, MCP client access tokens, CSPR.cloud tokens, local signer material, and private wallet keys must never enter client components, receipts, public explorer pages, logs, or exported JSON.

## Open Questions To Resolve Before SDK Integration

- What is the current install path and recommended load mode for CSPR.click in this app: npm package, CDN script, or both? The local reference uses a CDN script; current docs describe SDK methods but implementation packaging must be verified before installation.
- Does the current CSPR.click SDK return the exact signature format expected by `@make-software/casper-x402`? Docs say `SignTypedDataResult.signatureHex` is prefixed with the algorithm byte, which appears compatible, but the first code slice must test this contract.
- Should the first implementation call CSPR.click directly to sign the typed data produced by our own browser adapter, or should `@make-software/casper-x402` be adapted so `signEIP712(digest)` delegates to CSPR.click typed-data signing while preserving the same payload shape?
- What CSPR.click app id/name/provider list should be used for the public test app?
- Should browser signing be enabled first only in the paid-tool console, or also for hosted MCP client calls? This plan recommends console first, hosted endpoint later.

## Prototype Reintegration Gate

Do not copy any prototype wallet modal or signing UI blindly.

The accepted product behavior for this phase is:

- Testnet first.
- Policy before approval.
- Browser approval through CSPR.click.
- No production custody claim.
- No local-signer fallback in the browser-signing path.
- Honest cancelled/error/timeout states.
- Four-layer receipt after verify/settle/proof.
- Public explorer remains public and does not require wallet connection.

## Phase 1: Signing Contract Spike

### Goal

Prove the exact contract between Casper GW payment requirements, CSPR.click typed-data signing, and the existing `@make-software/casper-x402` payload format before touching UI.

### Work

- Inspect installed `@make-software/casper-x402` exports and current source usage.
- Create a small browser-safe type boundary for CSPR.click account and typed-data signing results.
- Define the internal `BrowserX402Signer` contract:
  - selected wallet id,
  - expected public key,
  - expected account hash,
  - `signTypedData` request params,
  - normalized success/cancelled/error/timeout result.
- Decide whether to:
  - build the `TransferWithAuthorization` typed data in our browser adapter and assemble the x402 payload directly, or
  - wrap the existing `ExactCasperScheme` with a CSPR.click-compatible signer adapter.
- Add unit tests for signature/result normalization only.

### Real Integration Path

Contract and type tests only. No wallet approval UI, no live spend, no SDK install unless the SDK package/load path has been verified.

### Stop Conditions

- Stop if the current CSPR.click package/load path cannot be verified.
- Stop if CSPR.click result shape cannot be mapped to the x402 payload without guessing.
- Stop if the active account public key cannot be checked before signing.

## Phase 2: CSPR.click Browser Adapter

### Goal

Add a browser-only CSPR.click adapter without changing settlement behavior or claiming signing is enabled by default.

### Work

- Add public config keys only, likely:
  - `NEXT_PUBLIC_CSPR_CLICK_APP_ID`,
  - `NEXT_PUBLIC_CSPR_CLICK_APP_NAME`,
  - `NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE`,
  - `NEXT_PUBLIC_CSPR_CLICK_PROVIDERS`,
  - `NEXT_PUBLIC_CASPER_CHAIN_NAME=casper-test`.
- Initialize CSPR.click only in client code.
- Expose adapter operations for:
  - `init`,
  - `connect`,
  - `getActiveAccount`,
  - `getActivePublicKey`,
  - `signTypedData`,
  - cancellation/error normalization.
- Update integration health/readiness to distinguish:
  - `configured`,
  - `client_available`,
  - `connected`,
  - `not_enabled`,
  - `error`.
- Keep all secret-bearing server config out of browser bundles.

### Mock/Simulation Policy

Unit/browser tests may mock the `window.csprclick` object to prove UI state transitions, but product UI must not expose a simulated/local signing mode.

### Stop Conditions

- Stop before enabling live signing if `NEXT_PUBLIC_CSPR_CLICK_APP_ID` or the accepted SDK load path is missing.
- Stop if any local signer path, CSPR.cloud token, provider credential, or endpoint token appears in a client bundle, receipt, explorer response, or browser log.

## Phase 3: Server Policy And Payment-Intent Handoff

### Goal

Move paid-console browser approval behind a server-side preflight that proves policy passed before the wallet sees a signing request.

### Work

- Add a server route for browser-signing preflight/payment-intent.
- Input should include only the selected endpoint/tool, selected wallet, intended resource, request metadata, and tool input reference needed for policy.
- Server validates:
  - wallet exists and matches expected network,
  - wallet readiness,
  - allowed endpoint/tool/provider,
  - payment asset/network,
  - max per call,
  - session/day headroom,
  - kill/disable state,
  - client access scope where applicable.
- On policy block:
  - persist attempt/audit,
  - return a blocked receipt reference,
  - do not return typed data,
  - do not request wallet approval.
- On policy pass:
  - return payment requirements and typed-data/signing parameters only,
  - omit provider upstream credentials, endpoint tokens, CSPR.cloud credentials, private inputs/outputs, and policy internals.

### Stop Conditions

- Stop if policy cannot be evaluated without trusting browser-only state.
- Stop if a policy-blocked attempt can still show a wallet signing prompt.

## Phase 4: Browser Approval And x402 Settlement

### Goal

Run one CSPR.click-approved Casper x402 Testnet payment in the paid-tool console, without local-signer fallback, then persist the normal four-layer receipt.

### Work

- Paid console calls the policy/payment-intent route first.
- UI verifies CSPR.click active public key matches the selected wallet profile.
- UI calls `signTypedData(params, publicKey)` for the payment authorization.
- Handle CSPR.click result states:
  - success,
  - user cancelled,
  - wallet/provider unsupported,
  - active account mismatch,
  - timeout,
  - SDK/client unavailable,
  - malformed signature response.
- Submit the signed x402 payment payload through the existing paid-call run path or a dedicated browser-signing completion route.
- Server verifies and settles through CSPR.cloud hosted facilitator.
- Server resolves Casper proof through CSPR.cloud before rendering a deploy-hash link.
- Persist receipt layers:
  - gateway context,
  - policy decision,
  - x402 verify/settle,
  - Casper proof.

### No-Fallback Rule

If CSPR.click signing fails, the attempt ends honestly. Do not retry through the local Testnet signer in this browser-signing path.

### Stop Conditions

- Stop before live smoke if Abu has not approved a Testnet spend from the selected browser wallet.
- Stop if the wallet lacks CSPR gas or WCSPR.
- Stop if CSPR.cloud facilitator verify/settle fails.
- Stop if CSPR.cloud cannot resolve the deploy hash.

## Phase 5: UI Wiring And Explorer Evidence

### Goal

Expose the real browser-signing path without broad redesign.

### Work

- Paid console:
  - show signing mode as `CSPR.click browser approval` only when configured and connected,
  - show active wallet/public key match,
  - show policy pre-check before wallet prompt,
  - show approval/cancelled/error/timeout states,
  - show verify/settle/proof states after signature.
- Settings:
  - show CSPR.click readiness honestly,
  - keep local Testnet signer labeled integration verification only.
- Public explorer and receipt detail:
  - show `signed with CSPR.click` only for real browser-approved attempts,
  - keep policy and proof layers separate,
  - never require wallet connection to view receipts.

### Out Of Scope

- Mainnet.
- Production custody.
- Hosted encrypted signing.
- Broad redesign.
- Registry/private tools.
- Simulated/local product modes.
- Hosted endpoint browser signing for arbitrary MCP clients.
- OAuth.
- Public scanner discovery.

## Verification Gates

- `pnpm run guard:files`
- `pnpm run guard:product`
- `pnpm run guard:secrets`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:browser`
- `pnpm build`
- `pnpm run ci`

## Required Tests

- Unit:
  - CSPR.click config parsing and public-only exposure.
  - Browser signer result normalization.
  - active public-key mismatch blocks signing.
  - policy block returns no typed-data/signing params.
  - cancellation/error/timeout create no settled/proof claim.
  - receipt redaction for browser-signing attempts.
- API:
  - payment-intent policy pass/block.
  - no secret leakage in payment-intent response.
  - signed payload completion branches on facilitator response body.
  - no local-signer fallback when browser signing is selected.
- Browser:
  - public explorer still has no app sidebar or wallet gate.
  - paid console shows policy before approval.
  - mocked CSPR.click success/cancel/error/timeout states.
  - settings clearly separates Testnet signer readiness from CSPR.click readiness.
- Live manual smoke:
  - CSPR.click wallet on Casper Testnet.
  - selected wallet has CSPR gas and WCSPR.
  - one paid `get_quote` call signs through CSPR.click.
  - CSPR.cloud settles and resolves the deploy.
  - public explorer receipt links to the real `testnet.cspr.live` deploy.

## Independent Review Gate

Before marking Phase 24 complete, request independent review for:

- custody overclaiming,
- secret leakage,
- policy-before-approval gaps,
- active public-key mismatch handling,
- local-signer fallback leakage,
- fake proof or premature deploy-hash rendering,
- receipt-layer mixing,
- file-size and product-guard regressions.

## Handoff Notes

If this plan is accepted, the first implementation slice should be Phase 1 only: the signing contract spike. Do not install SDKs, change UI, or attempt a live spend until the contract between CSPR.click `signTypedData` and the Casper x402 payment payload is proven with tests.
