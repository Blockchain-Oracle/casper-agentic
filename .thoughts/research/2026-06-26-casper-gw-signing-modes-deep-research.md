# Reality Research: Casper GW Signing Modes — Deep Implementation Pass (2026-06-26)

> Facts-only. This brief documents current reality; it does **not** choose a mode,
> propose an architecture, or write a plan. It builds on (does not duplicate)
> `2026-06-25-casper-gw-signing-modes-reality.md` and goes to source code + live docs.
> Decision and plan are the next, separate artifacts.

## Scope

For the three signing modes Abu wants — (1) **local/CLI signer**, (2) **browser-approved** (CSPR.click per-transaction), (3) **hosted pre-approved / autonomous agent wallet** — establish the *implementation reality*: exactly what each must produce to settle, what is built/proven/blocked in this repo today, how other ecosystems implement each, and which Casper-native primitives can or cannot support them. Methodology: 5-agent reality-research workflow (`wf_1ed226f6-b5b`) + firsthand read of `casper-x402` `signer.ts` / `exact/client/scheme.ts` and the CSPR.click skill.

## Sources Checked

- **Casper-native x402:** `.thoughts/raw/repos/casper-x402/` — JS mechanism (`js/packages/mechanisms/casper/src/{signer.ts, exact/client/scheme.ts, exact/facilitator/scheme.ts, types.ts}`), Go mechanism (`go/x402/mechanisms/casper/...`), `go/docs/api-reference.md`, `js/examples/{client,facilitator}`, `infra/local/deployer/Cep18X402.wasm`.
- **CSPR.click:** `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`; `@make-software/csprclick-core-types` v2.1.0 (`isdk.d.ts`, `wallets.d.ts`); Context7 `/websites/cspr_click` (methods/types); `docs.cspr.click` types/methods.
- **CSPR.cloud facilitator (live docs):** `docs.cspr.cloud/x402-facilitator-api/{supported,verify,settle}`.
- **Cross-ecosystem:** `.thoughts/raw/repos/{x402-wallet-mcp, Cards402, MCPay, clevercon, toll}`; web — Coinbase Agentic Wallet (`docs.cdp.coinbase.com/agentic-wallet`), `github.com/0xKoda/x402-wallet`, `solana.com/docs/payments/agentic-payments`, `github.com/casper-ecosystem/casper-eip-712`, chainwire 2026-06-04 (Casper AI Toolkit / account-abstraction roadmap).
- **Current repo:** `src/server/{x402-payment.ts, x402-facilitator.ts, live-paid-call.ts, wallet-store.ts, wallet-signing-readiness.ts, browser-payment-intent*.ts, browser-payment-completion*.ts, browser-payment-failure.ts, hosted-paid-call.ts, env.ts}`, `src/lib/{csprclick-browser.ts, browser-x402-signing.ts, browser-paid-call-flow.ts, csprclick-provider-info.ts}`, `src/db/schema.ts`, `.env.example`, `.thoughts/README.md`, `.thoughts/verification/2026-06-25-casper-gw-phase-24o..24s`.

## Verified Facts

### A. The shared settlement contract (the fact that frames all three modes)

- **Every paid call must produce the identical object**, regardless of mode: `{ signature (65 bytes), publicKey, authorization: { from, to, value, validAfter, validBefore, nonce } }` — a 65-byte EIP-712 signature over a `TransferWithAuthorization` typed-data digest. The modes differ **only in where the key lives and who/when approves the signature**, not in what is settled. (`casper-x402/js/.../exact/client/scheme.ts:82-128`; `go/x402/mechanisms/casper/types.go:36-49`)
- **The signer is mode-agnostic.** `ClientCasperSigner` needs only `accountAddress()`, `publicKey()`, `signEIP712(digest)→65 bytes`. A local PEM, a CSPR.click browser approval, or a server-held key all satisfy it identically. (`casper-x402/js/.../signer.ts:25-65`)
- **Fresh signature per call is mandatory.** The client generates a random 32-byte nonce (`crypto.getRandomValues`) and a short window (`validAfter = now-600`, `validBefore = now + maxTimeoutSeconds`) for every payload. (`exact/client/scheme.ts:76-89`)
- **`/verify`** recomputes the EIP-712 digest and verifies the 65-byte signature against requirements without submitting on-chain; **`/settle`** re-runs verify then submits a Casper tx calling the CEP-18 entry point **`transfer_with_authorization`**, signed by the **facilitator's** key. (`go/.../exact/facilitator/scheme.go:82-374`; live `docs.cspr.cloud/x402-facilitator-api/{verify,settle}`)
- **Gas is paid by the facilitator, not the payer.** Facilitator account pays motes (default ~7e9, configurable); only the payer's CEP-18 tokens move. Payer key and facilitator key are strictly separate. (`go/docs/api-reference.md:46-47,118-120`; `js/examples/facilitator/README.md:71,77`)
- **Supported networks:** exactly `casper:casper` (mainnet) and `casper:casper-test` (testnet); x402 version 2; scheme `exact`. Hosted facilitator requires an `Authorization` header with a CSPR.cloud access token. (`constants.go:5-19`; live `/supported`; `src/server/x402-facilitator.ts:40-48`)
- **There is NO non-fresh-signed settlement path.** A repo-wide grep of `casper-x402` for `allowance|approve|permit|delegat|recurring|subscription|session` returns zero non-test hits; the only settlement entry point invoked is `transfer_with_authorization`; live `/verify`/`/settle`/`/supported` document no session/allowance/delegation/recurring primitive. (grep + live docs)
- **Latent but unused on-chain capability:** the `Cep18X402.wasm` token contract *does* expose `approve/allowance/increase_allowance/decrease_allowance/transfer_from` and CEP-3009 `receive_with_authorization/cancel_authorization/authorization_state` — but the x402 facilitator path calls **none** of them. (`strings` on `Cep18X402.wasm`)
- **On-chain guardrails per signature:** a signature authorizes exactly `value`→`payTo`, valid only within `[validAfter, validBefore]` (facilitator rejects <6s remaining), single-use via the 32-byte nonce (`authorization_state`/used-nonce tracked on-chain). A leaked signature can move only that one bounded amount to that one recipient within that window. (`facilitator/scheme.go:177-214`; `api-reference.md:102-114`)

### B. Mode 1 — Local / CLI signer

- **Implemented and PROVEN on Casper Testnet** (integration verification): the repo wraps a PEM key into the `casper-x402` `ExactCasperScheme` and settles via CSPR.cloud. Real deploys: Phase 0 `5566d633…944fa8a`, Phase 3 console `8ed4569f…6af0810`. (`src/server/x402-payment.ts:24-68`; `README.md:122-123,181-182`)
- **Bounded as integration-only.** `wallet-signing-readiness.ts` reports `mode='testnet_signer'`, `purpose='integration_verification_only'`, `productionCustody='not_claimed'`. (`:18-25,46-53`)
- **Hard gated:** `runLivePaidToolCall` blocks any wallet whose account-hash ≠ the single configured signer's, and restricts execution to the one configured MCP endpoint. (`live-paid-call.ts:38-78`)
- **The client signer is node-independent** — `accountAddress/publicKey/signEIP712` derive entirely from the `PrivateKey`; only the facilitator needs a node. `casper-js-sdk@5.0.12` (pinned) supports key *generation* (`PrivateKey.generate` + `toPem`), so a dedicated CLI key could be created in-SDK. (`signer.ts:56-65`; `PrivateKey.d.ts:60,72,79`)
- **No Casper-native CLI/MCP wallet wrapper exists** in the corpus (unlike EVM/Solana/Stellar). `casper-x402` is library-only. A Casper CLI/MCP local-pay surface would be net-new.

### C. Mode 2 — Browser-approved (CSPR.click)

- **Fully coded end-to-end** (3-call flow: `payment-intents` → `signTypedData` → `browser-completions`/`browser-failures`), with policy enforced before returning signing params and re-checked at completion; no local-signer fallback. (`browser-payment-intent.ts:60-78`; `browser-payment-completion.ts:40-110`; `browser-paid-call-flow.ts:38-99`)
- **NOT proven.** No browser-approved settlement, deploy hash, or proof has ever been produced. The one live attempt closed `auth_failed`. (`phase-24o-...md:75-106`)
- **The blocker is provider capability, not funding or code.** Abu's funded CSPR.click wallet (pubkey `0202034f…eb8d` — `02` = **secp256k1**) reached policy-approved signing, but the connected **Casper Wallet extension** returned `SIGNATURE_SCHEME_NOT_SUPPORTED` ("the account's key scheme is not supported for typed data signing"). That provider advertises `sign-deploy`/`sign-message`/`sign-transactionv1` but **not** `sign-typed-data-eip712`. (`phase-24o:24-45,75-106`; `phase-24p:26-30`; `isdk.d.ts:101-108`)
- **API reality (v2.1.0):** `signTypedData(params, signingPublicKey)` → `SignTypedDataResult { cancelled, signatureHex, digest, publicKey, error, errorCode?, hashArtifacts? }`; `signatureHex` is algo-prefixed (`01` ed25519 / `02` secp256k1) + 64 bytes; `signingPublicKey` must equal the active account key (lowercased). (`isdk.d.ts:114-171,393`; CSPR.click skill L73)
- **Capability is runtime-reported and undocumented per-provider.** The published `ProviderInfo.supports` enum lists only `sign-deploy`/`sign-transactionv1`/`sign-message` — it does **not** even list `sign-typed-data-eip712`, though the v2.1.0 type package defines the constant. No doc or type file maps which named provider (Web Wallet/social-login, passkey, Ledger, MetaMask Snap, newer Casper Wallet) advertises it. (`Context7 /websites/cspr_click types.md`; `wallets.d.ts:27`)
- **The repo's typed-data shape matches the canonical csprclick-x402 demo and the JS exact client exactly** (same `TransferWithAuthorization` fields, `returnHashArtifacts:true`, base64 `PAYMENT-SIGNATURE` header). (`casper-x402/go/examples/csprclick-x402/src/SignTypedData.tsx:106-179`; `browser-payment-intent-typed-data.ts:8-54`)

### D. Mode 3 — Hosted pre-approved / autonomous agent wallet

- **Not implemented in the gateway.** No server-held agent key, no spend-policy-gated autonomous signer. The `external` signingMode label is accepted vocabulary but has **zero** implementation/consumer. (`wallet-store.ts:73-90`; grep returns no `external` signing path)
- **"Not a Casper primitive yet" is accurate in a precise sense:** there is no managed/native Casper product that signs repeated x402 payments under policy without per-call human approval. The blocker is **custody + automation + policy (application/infra)**, NOT a missing chain capability — the chain already lets any key-holder sign authorizations programmatically, and the signer interface is already defined.
- **Cross-ecosystem, "autonomous" = a custodial/embedded service holds the key and signs each call under OFF-CHAIN policy** (never a chain-enforced allowance reused by the facilitator):
  | System | Custody | Pre-sign policy |
  |---|---|---|
  | Coinbase Agentic Wallet | server-custodial (keys in Coinbase infra; agent never accesses keys) | user-set per-call + per-session limits; agent cannot change limits/transfer/onramp |
  | x402-wallet-mcp + Privy | keys in Privy HSM/TEE (never on machine); proxy/linked/BYO modes | per-call max ($5) + daily cap ($50) + $0.05 auto-approve threshold, enforced client-side before signing |
  | Cards402 (Stellar) | encrypted on-disk vault (`~/.ows/...`), no server recovery | policy engine: suspended → single-tx cap → allowed-hours → allowed-days → daily limit → approval threshold→human; fails closed; agent auth = API key |
  | MCPay | API key OR raw private key (dev-only) | single `maxPaymentValue` cap |
  | clevercon (Stellar) | keypair generated locally; secret never leaves process | sponsor service only gets public key |

  (`x402-wallet-mcp/{README.md,SECURITY.md,src/spending/tracker.ts}`; `Cards402/backend/src/policy.js:7-281`; Coinbase docs; `clevercon/.../wallet-provisioner.ts`)
- **Across every example, spend policy is enforced in software BEFORE the signature — never by the chain.** An EIP-3009/`transfer_with_authorization` signature is an unconditional bearer authorization for its exact value. The repo already mirrors this (policy runs before `createCasperPaymentPayload`). (`live-paid-call.ts:85-101`)
- **Two Casper-native delegation surfaces exist, but neither is a drop-in for the current x402 facilitator:**
  - **Account-level — associated keys + weights + `action_thresholds {deployment, key_management}`:** an agent sub-key with weight ≥ deployment threshold can author deploys for the account; managing this requires key-management Wasm session code. This is **account-wide deploy authority**, not per-tool/per-amount/x402-specific spend limits. (`docs-redux/.../accounts-and-keys.md:262-280`; `.../multi-sig-workflow.md:25-70`)
  - **Token-level — standard CEP-18 `approve`/`allowance`/`transfer_from`:** an owner could approve a spender up to an allowance and the spender could `transfer_from` per call. **But the x402 facilitator settles via `transfer_with_authorization`, not `transfer_from`**, so an allowance design is *not settleable by the current CSPR.cloud x402 facilitator* — it would need a different settlement contract/caller. (`docs-redux/.../cep18.md:69-77`)
- **`casper-eip-712` `BatchTransferAuthorization`** ("multi-transfer for x402 flows") can amortize signatures (one signature over a batch) but still requires a key-holding signer; it reduces signatures, it does not remove the need to sign. (`github.com/casper-ecosystem/casper-eip-712`)
- **Casper account abstraction with scoped agent spending permissions** ("$X/day", whitelisted contracts, "no human wallet in the loop") — the natural on-chain fit for pre-approved spend — is announced as **future roadmap, not shipped**. (chainwire 2026-06-04)
- **The closest existing autonomous-from-the-caller path that reached a real deploy** is the hosted MCP endpoint (Phase 7, deploy `a27e519e…`): the *external caller* supplies a pre-signed `PAYMENT-SIGNATURE` payload and the gateway holds no key. (`hosted-paid-call.ts:32-135`; `README.md:262-267`)

### E. Current repo signingMode vocabulary

- `agent_wallets.signingMode` is free-text; the store accepts only `browser-wallet`, `test-signer`, `external`. Only `browser-wallet` requires a stored public key (derived account-hash must match). (`wallet-store.ts:73-90`; `schema.ts:53-61`)
- No backend dispatcher routes on `signingMode`; the console UI chooses `run()` (local PEM) vs `runBrowser()` (CSPR.click), and the server `run` route gates on account-hash equality. (`use-paid-call-console.ts:59-96`; `live-paid-call.ts:64-78`)
- Mapping to the three studied modes: `test-signer` = mode 1 (proven); `browser-wallet` = mode 2 (built, unproven); `external` = closest label to mode 3 (no implementation).

## Inferences (labelled — not facts)

- **Mode 3 is a custody/trust decision, not a protocol gap.** Because the facilitator only settles fresh `transfer_with_authorization` signatures, a hosted mode = "a service holds the payer key and auto-signs each fresh authorization under off-chain policy." It is buildable today; what's missing is a custody architecture (server-held encrypted key / HSM/TEE / MPC / associated sub-key) and a policy gate — both of which Casper GW would own, since no Casper-native Privy/Coinbase-equivalent was found.
- **An on-chain allowance-based pre-approval is not reachable through the standard facilitator** without a different settlement contract/caller (facilitator uses `transfer_with_authorization`, not `transfer_from`).
- **The browser-mode failure is an ecosystem provider gap, not a Casper GW code defect** — the verify/settle/proof path is built and proven by the local signer over the same facilitator; only a typed-data-capable provider/account is missing.
- **The repo is structurally ~one key-source step from generalizing the local signer:** the constraints making it `test-signer`-only are wiring/policy (mode allowlist, single PEM, account-hash gate, single-endpoint), not a missing crypto capability.
- **Per-signature on-chain guardrails are weak by design** (amount/recipient/expiry/nonce only); any per-day/per-tool ceiling lives off-chain — so a hosted mode's spend guarantees would be application-trust unless extra on-chain logic bounded them.

## Unknowns And Questions

1. **Which CSPR.click provider + key-scheme actually completes `signTypedData`** on Testnet (Web Wallet/social-login, passkey, Ledger, MetaMask Snap, or a newer Casper Wallet; ed25519 vs secp256k1)? No per-provider matrix exists; never demonstrated live in this project.
2. **Would an ed25519 account on the same Casper Wallet extension change the 24O outcome**, or is typed-data unsupported regardless of scheme/version?
3. **Custody posture for a hosted mode** Abu would accept: server-held encrypted key, HSM/TEE (no confirmed Casper-native Privy/Turnkey/Crossmint equivalent), MPC, or an account associated sub-key.
4. **Does any HSM/TEE/MPC vendor support Casper Ed25519/Secp256k1 `signEIP712(digest)`** out of the box? Not verified.
5. **Could a non-x402 custom flow use the latent `approve`/`transfer_from` or CEP-3009 `receive_with_authorization`** entry points, and would CSPR.cloud ever settle it — or is that strictly outside the hosted facilitator?
6. **Is there any preview/testnet build of Casper account abstraction** (scoped-permission smart accounts) to evaluate, or is it announcement-stage only?
7. **What CEP-18 token/package/decimals** does the live CSPR.cloud facilitator use on `casper-test` (the specific WCSPR instance and whether it exposes allowance)?
8. **Is `external` intended to mean caller-supplied pre-signed payload (like the hosted endpoint) or a future hosted agent wallet?** The label has no implementing code or comment.
9. **Should mode 1 become a real CLI/MCP wallet surface** (separate from the Next.js app), and where would its key live (in-SDK generated, encrypted vault, .env, or HSM/proxy)?
10. **For a hosted mode, the gas/billing model** if Casper GW self-hosts settlement vs. relying on CSPR.cloud's facilitator-pays-gas.

## Not Included

- No recommendation or chosen mode. No architecture, schema, or custody design. No implementation plan. No spec/story rewrite. No live signing attempt. No code changes. These are deliberately deferred to the decision + plan that follow this brief.
