# Reality Research: Casper GW Signing Modes

Date: 2026-06-25

## Scope

Research the current reality for three Casper GW wallet/signing modes:

- local or CLI-controlled wallet signing for agents,
- browser-approved CSPR.click signing,
- hosted pre-approved or agent-wallet signing with spending controls.

This brief is facts-only. It does not choose an implementation, rewrite the spec, or create a plan.

## Sources Checked

Local project context:

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24g-csprclick-primary-source-refresh.md`
- `.thoughts/raw/source-index.md`
- `.thoughts/raw/stellar-agents-winners-2026-06-18.md`
- `.thoughts/raw/external-x402-agent-winner-landscape-2026-06-18.md`
- `.thoughts/raw/agent-commerce-gateway-reality-refresh-2026-06-18.md`
- `.thoughts/research/2026-06-18-external-x402-agent-winner-patterns.md`
- `.thoughts/wiki/cspr-trade-mcp-and-x402.md`

Local code inspected:

- `src/db/schema.ts`
- `src/server/wallet-store.ts`
- `src/server/wallet-signing-readiness.ts`
- `src/server/x402-payment.ts`
- `src/server/browser-payment-intent.ts`
- `src/server/browser-payment-intent-typed-data.ts`
- `src/server/browser-payment-completion.ts`
- `src/lib/csprclick-browser.ts`
- `src/lib/browser-x402-signing.ts`
- `src/lib/browser-paid-call-flow.ts`
- `.env.example`

Current docs and repositories:

- Context7: `/websites/cspr_click`
- Context7: `/make-software/csprclick-examples`
- Context7: `/coinbase/x402`
- Context7: `/casper-network/docs-redux`
- CSPR.click docs: `https://docs.cspr.click/`
- CSPR.click SDK methods: `https://docs.cspr.click/cspr.click-sdk/reference/methods.md`
- CSPR.click SDK types: `https://docs.cspr.click/cspr.click-sdk/reference/types.md`
- CSPR.click initialization: `https://docs.cspr.click/cspr.click-sdk/integration/download-and-initialize.md`
- CSPR.click wallet connection: `https://docs.cspr.click/cspr.click-sdk/integration/connecting-a-wallet.md`
- CSPR.click events: `https://docs.cspr.click/cspr.click-sdk/integration/handling-events.md`
- CSPR.click signing transactions: `https://docs.cspr.click/cspr.click-sdk/integration/signing-transactions.md`
- CSPR.cloud x402 supported: `https://docs.cspr.cloud/x402-facilitator-api/supported.md`
- CSPR.cloud x402 verify: `https://docs.cspr.cloud/x402-facilitator-api/verify.md`
- CSPR.cloud x402 settle: `https://docs.cspr.cloud/x402-facilitator-api/settle.md`
- Casper x402 repo: `https://github.com/make-software/casper-x402`
- CSPR.click examples repo: `https://github.com/make-software/csprclick-examples`
- Solana pay repo/docs: `https://github.com/solana-foundation/pay`, `https://solana.com/docs/payments/agentic-payments`
- Coinbase Agentic Wallet MCP docs: `https://docs.cdp.coinbase.com/agentic-wallet/mcp/welcome`
- Coinbase Agentic Wallet CLI docs: `https://docs.cdp.coinbase.com/agentic-wallet/cli/welcome`
- Coinbase Agentic Wallet MCP tools/docs: `https://docs.cdp.coinbase.com/agentic-wallet/mcp/mcp-tools/overview`
- Cards402 repo: `https://github.com/CTX-com/Cards402`
- MCPay repo: `https://github.com/microchipgnu/MCPay`
- x402-wallet-mcp repo: `https://github.com/onchainexpat/x402-wallet-mcp`
- x402-wallet repo: `https://github.com/0xKoda/x402-wallet`
- Casper account/multi-sig docs search result: `https://docs.casper.network/resources/tutorials/advanced/two-party-multi-sig`

Workspace note:

- `.thoughts/raw/source-index.md` lists cloned repositories under `.thoughts/raw/repos/`, but this worktree does not currently contain `.thoughts/raw/repos/`. Remote GitHub and raw URLs were used for those references.
- `git status --short` showed uncommitted CSPR.click-related changes in `src/components/gateway-app.tsx`, wallet screen/control files, `src/server/wallet-store.ts`, and new files `src/components/screens/use-csprclick-browser-connection.ts` and `src/lib/casper-public-key.ts`. These are current workspace evidence, not accepted product truth.

## Verified Facts

### Accepted Product Boundaries

- The current product truth is Casper GW as provider gateway, agent wallet control plane, paid tool test console, public explorer, and four-layer receipt/proof system.
- Current spec requires explicit signing mode and forbids production custody claims unless separately approved.
- Current stories define wallet funding, real readiness evidence, spend policy, policy-before-signing, and public explorer access without wallet connection.
- Current non-goals include production custody architecture, generic token-send policy, simulated/local user-facing settlement modes, and private/public registry semantics.

### Current Repo Signing State

- The active database schema stores `agent_wallets.signingMode` and optional `publicKey`.
- Current wallet-store logic recognizes `browser-wallet`, `test-signer`, and `external` as supported signing-mode strings.
- Current `.env.example` separates:
  - server-side local Testnet signer config,
  - browser CSPR.click public config,
  - CSPR.cloud API/facilitator config,
  - Casper payment asset/payee config.
- `src/server/wallet-signing-readiness.ts` labels the local Testnet signer as `integration_verification_only` and production custody as `not_claimed`.
- `src/server/x402-payment.ts` creates a Casper x402 payment payload from a local PEM private key by wrapping it into a signer with `accountAddress()`, `publicKey()`, and `signEIP712(digest)`.
- The current browser signing path has backend intent/completion code that:
  - creates a policy-pending attempt,
  - checks selected wallet signing mode,
  - requires `browser-wallet` public key/account-hash match,
  - builds CSPR.click typed-data params,
  - verifies/settles submitted browser payment payloads through CSPR.cloud.
- Phase 24G verification says no live browser wallet x402 payment has been proven yet after the CSPR.click source refresh.

### Casper x402 Authorization Reality

- Casper x402 uses x402 version 2, scheme `exact`, and Casper CAIP-2 networks such as `casper:casper-test`.
- CSPR.cloud `/supported` documents support for `casper:casper` and `casper:casper-test`.
- CSPR.cloud `/verify` validates a signed `paymentPayload` against `paymentRequirements` without submitting an on-chain transaction.
- CSPR.cloud `/settle` validates and submits the Casper payment transaction; its docs say the facilitator account pays gas and CEP-18 tokens move from payer to payee via `transfer_with_authorization`.
- The signed payload contains:
  - a Casper public key,
  - a 65-byte EIP-712 signature,
  - `TransferAuthorization` fields: `from`, `to`, `value`, `validAfter`, `validBefore`, `nonce`.
- The upstream `make-software/casper-x402` TypeScript client expects a `ClientCasperSigner` with `accountAddress()`, `publicKey()`, and `signEIP712(digest)`.
- The upstream Casper x402 exact client builds `TransferWithAuthorization` typed data, hashes it, signs the digest, and returns x402 payload data.

### Browser-Approved CSPR.click Mode

- CSPR.click is documented as a wallet aggregator and SDK for Casper wallet connection, transaction signing, typed-data signing, wallet events, and CSPR.cloud proxy access.
- Current CSPR.click docs support the CDN runtime path: assign `window.clickUIOptions` and `window.clickSDKOptions`, inject `https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js`, then wait for `csprclick:loaded`.
- CSPR.click `signIn()` opens the wallet selector; `signOut()` closes the dApp session; `disconnect()` revokes wallet connection.
- CSPR.click `signTypedData(params, signingPublicKey)` requests the active wallet to sign EIP-712 typed data. The signing public key must match the active account public key.
- `SignTypedDataResult` includes `cancelled`, `signatureHex`, `digest`, `publicKey`, `error`, optional `errorCode`, and optional `hashArtifacts`.
- The CSPR.click docs and GitBook ask response do not document pre-approved session spending, delegated signing, or unattended AI-agent typed-data signing through CSPR.click.
- The upstream Casper x402 CSPR.click demo signs a `TransferWithAuthorization` typed-data object with `window.csprclick.signTypedData`, assembles an x402 payment payload, and retries the protected resource with a payment header.

### Local Or CLI-Controlled Wallet Mode

- Casper docs and Context7 show Casper SDK/CLI paths for generating PEM keys, deriving public keys/account hashes, and signing transactions.
- The Casper x402 TypeScript signer abstraction supports a local private-key signer for EIP-712 digest signing.
- The current Casper GW local Testnet signer already uses this pattern for integration proof.
- External current CLI patterns exist:
  - Solana `pay` wraps tools like `curl`, `claude`, and `codex`, detects x402/MPP challenges, and asks the local wallet backend to authorize signing.
  - `0xKoda/x402-wallet` is a terminal x402 wallet; its README explicitly warns about local key storage and recommends small, dedicated wallets.
  - MCPay offers a CLI path using either an API key or wallet private keys and supports per-call max values in its SDK example.
  - Cards402 exposes an agent-facing TypeScript SDK, CLI, and MCP server.
- These external CLI examples show the category is real, but most are EVM/Solana/Stellar, not Casper-native.

### Hosted Pre-Approved / Agent-Wallet Mode

- External products show this is a real product category:
  - Coinbase Agentic Wallet MCP lets agents discover/pay for x402 services, while users control funding, transfers, and spending limits in a wallet UI.
  - Coinbase docs say agents cannot set spending limits, transfer funds, or add funds; those actions remain user-controlled.
  - Coinbase Agentic Wallet CLI describes a standalone wallet via CLI/MCP with built-in spending limits and key isolation in Coinbase infrastructure.
  - x402-wallet-mcp documents HSM/TEE-backed keys, three wallet modes, per-call/daily caps, automatic x402 negotiation, transaction history, and recovery/export flows.
  - Cards402 documents a policy engine with spend limits, approval flows, time windows, agent auth, CLI, MCP server, and operator dashboard.
- Casper/CSPR.click/CSPR.cloud docs checked in this pass do not document an equivalent Casper-native hosted pre-approved session mode.
- CSPR.cloud x402 docs require a signed payment payload for `/verify` and `/settle`; the GitBook ask response says no documented pre-approved sessions, delegated signing, allowances, or repeated agent payments without a fresh `TransferWithAuthorization` payload per request.
- Casper accounts support associated keys and action thresholds, but that is account-level authorization for transactions/key management. The docs checked do not present it as a per-tool, per-session, or x402-specific pre-approved spending policy.

## Inferences

- The three useful categories are real but not equally mature on Casper:
  - `browser approval`: Casper-specific and CSPR.click-supported, but per-signature approval, not unattended autonomy.
  - `local/CLI signer`: Casper-specific signing is technically possible through PEM keys and `casper-x402`, but it is local custody and needs strict security/framing.
  - `hosted pre-approved agent wallet`: real in Coinbase/Privy-style agent wallet products, but not currently documented as a Casper/CSPR.click/CSPR.cloud primitive.
- The current repo's existing `test-signer`, `browser-wallet`, and `external` labels are a factual starting vocabulary, but they do not yet fully express the user's requested three product modes.
- A Casper hosted pre-approved mode would need a separately researched trust/custody/security model before it can be treated as accepted product truth.
- CSPR.click should not be described as a pre-approval or autonomous signing system based on current docs. It is better evidenced as browser approval per payment/signature.
- For Casper x402, every paid request still appears to require a fresh signed authorization payload with nonce and validity window, even if a higher-level wallet service decides when it is allowed to sign.

## Unknowns And Questions

- Does Make Software or Casper have an unreleased or community-supported agent-wallet/session-spend product beyond the public CSPR.click/CSPR.cloud docs checked here?
- Can Casper account associated keys be used safely for an agent sub-key pattern without overclaiming per-tool spend controls?
- Does the WCSPR/CEP-18 implementation expose allowance/approval entry points that could support a different pre-approval pattern, and would CSPR.cloud x402 support settling through that pattern? The checked x402 facilitator docs only describe `transfer_with_authorization`.
- What custody posture would Abu accept for a hosted pre-approved Casper agent wallet: server-held encrypted key, TEE/HSM provider, user-exportable embedded wallet, account associated key, or something else?
- Should CLI mode mean:
  - a local Casper PEM signer managed by Casper GW,
  - a standalone `npx`/CLI wrapper around x402 payments,
  - an MCP wallet server for Claude/Cursor/Codex,
  - or all of those as separate surfaces?
- The local reference clones listed in `.thoughts/raw/source-index.md` are absent in this worktree. If exact code-level comparison is required, they should be recloned or restored.

## Not Included

- No spec rewrite.
- No story rewrite.
- No implementation plan.
- No code changes beyond this research artifact.
- No live browser wallet signing attempt.
- No hosted custody architecture.
- No claim that Casper GW should implement all three modes before the current accepted gates are updated.
