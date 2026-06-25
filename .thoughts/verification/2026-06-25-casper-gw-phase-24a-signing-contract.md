# Verification Audit: Phase 24A CSPR.click Signing Contract Spike

## Verdict

Pass.

Phase 24A implements only the browser-safe contract boundary for CSPR.click typed-data signing results and Casper x402 payment payload assembly. It does not install CSPR.click, load the runtime, add wallet approval UI, change paid-call settlement, spend WCSPR, claim browser signing is enabled, or claim production custody.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/signer.ts`
- `.thoughts/raw/repos/casper-x402/js/packages/mechanisms/casper/src/exact/client/scheme.ts`
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/README.md`
- `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx`
- Official CSPR.click docs:
  - `https://docs.cspr.click/cspr.click-sdk/integration/download-and-initialize.md`
  - `https://docs.cspr.click/cspr.click-sdk/integration/connecting-a-wallet.md`
  - `https://docs.cspr.click/cspr.click-sdk/integration/signing-transactions.md`
  - `https://docs.cspr.click/cspr.click-sdk/reference/methods.md`
  - `https://docs.cspr.click/cspr.click-sdk/reference/types.md`

## Context7 Status

Context7 was retried for CSPR.click and failed with `fetch failed`. It was also retried for `casper-js-sdk` public-key/account-hash API shape and failed with `fetch failed`. This audit does not rely on memory for CSPR.click behavior; it uses the official GitBook markdown docs, installed SDK typings, and local `casper-x402` reference app instead.

## Requirement Traceability

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep signing mode honest. | No readiness/UI code was changed. CSPR.click remains `not_enabled`. | Pass |
| Target the correct Casper x402 signing primitive. | `src/lib/browser-x402-signing.ts` models CSPR.click `signTypedData`, not `send()`. | Pass |
| Produce the x402 payload shape only after a valid signature. | `buildBrowserX402PaymentPayload` emits `PaymentPayload` only for non-cancelled, error-free, well-formed signature results. | Pass |
| Handle cancellation without proof claims. | Cancelled CSPR.click results return `status: "cancelled"` and no payment payload. | Pass |
| Preserve CSPR.click machine errors. | Error results return `status: "failed"` with the original `errorCode` when present. | Pass |
| Fail closed on malformed signatures. | Malformed signature, digest, or canonical Casper public key results return `malformed_result` and no payload. | Pass |
| Block active public-key mismatch before signing. | `validateCSPRClickActivePublicKey` returns `active_public_key_mismatch`. | Pass |
| Bind signed payload to the selected wallet. | `buildBrowserX402PaymentPayload` requires `expectedPublicKey` and `expectedAccountHash`, derives the account hash with `casper-js-sdk`, and rejects mismatched signature public keys or typed-data `from` accounts. | Pass |
| Avoid runtime/sdk surface creep. | No CSPR.click SDK package, CDN loader, UI, route, settlement, or env change was added. | Pass |
| Stay within file-size rules. | New active source is 187 lines; new unit test is 163 lines; test fixture is 90 lines. | Pass |

## Tests And Commands

- Red step:
  - `pnpm exec vitest run tests/unit/browser-x402-signing.test.ts`
  - Failed because `@/lib/browser-x402-signing` did not exist.
- Focused green:
  - `pnpm exec vitest run tests/unit/browser-x402-signing.test.ts`
  - Passed: 1 file, 8 tests.
- Local checks:
  - `pnpm typecheck`
  - `pnpm run guard:files`
  - `pnpm run guard:product`
  - `pnpm run guard:secrets`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm run guard:workflows`
  - `git diff --check`
- Full gate:
  - `pnpm run ci`
  - Passed: frozen install, guards, 184 unit tests, typecheck, lint, 19 browser tests passed, 3 intentional mobile skips, production build.

## Independent Review

- Reviewer `Confucius` found no blockers and two should-fixes:
  - CSPR.click public keys needed canonical Casper validation instead of accepting any hex string.
  - The payment-payload builder needed to bind the CSPR.click result public key and typed-data authorization account to the selected Casper GW wallet.
- Fixes:
  - `src/lib/browser-x402-signing.ts` now accepts only canonical `01` + 32-byte Ed25519 or `02` + 33-byte Secp256k1 public keys and parses them with `casper-js-sdk`.
  - The builder now requires `expectedPublicKey` and `expectedAccountHash`, compares the signed public key to both, and rejects typed-data `from` accounts that do not match the selected wallet.
  - `tests/unit/browser-x402-signing.test.ts` now covers malformed public keys, mismatched signature public keys, and typed-data account mismatch.

## Scope Boundaries

- No live CSPR.click transaction or typed-data signature was produced.
- No live settlement was attempted.
- No deploy hash was created.
- No browser wallet runtime was loaded.
- No local Testnet signer fallback was added to the browser path.
- No public explorer behavior changed.
- No provider credentials, MCP access tokens, CSPR.cloud tokens, local signer material, or wallet private keys were exposed.

## Gaps And Risks

- The CSPR.click runtime load path still needs its own implementation slice.
- The app id/provider configuration still needs to be decided before enabling browser UI.
- The next slice must prove the actual `window.csprclick.signTypedData` adapter with mocked browser tests before any live spend.
- A live browser-approved Testnet x402 proof still requires a funded CSPR.click wallet with CSPR gas and WCSPR.

## Handoff

The next safe implementation slice is Phase 24B: CSPR.click browser adapter/load boundary. It should verify SDK load mode, public-only config, active account/public-key reads, and `signTypedData` invocation with mocked `window.csprclick`. It should still stop before live settlement unless Abu explicitly approves the spend and the wallet is funded.
