# Agent Commerce Gateway Thesis

Source base: `../research/2026-06-18-agent-commerce-gateway-reality.md`, `../research/2026-06-18-casper-x402-explorer-reality.md`, `../research/2026-06-18-casper-x402-onchain-identification.md`, `x402-ai-agent-winner-patterns.md`, and `cspr-trade-mcp-and-x402.md`.

> 2026-06-22 consistency note: this page is thesis history. Use `agent-commerce-gateway-current-truth.md` for current MVP scope. Public registry/public-private tool language here is no longer MVP product truth.

## Current Thesis

The strongest researched direction is a Casper-native agent commerce gateway, not a standalone DeFi bot and not just a wallet.

The product has three pillars:

- Provider Gateway: bring an existing API, OpenAPI spec, or MCP server; choose exposed tools/routes; configure upstream auth; set per-tool/per-route pricing; publish a hosted MCP/x402 endpoint.
- Agent Wallet Control Plane: create or connect Casper agent wallets; fund them; set spend limits, allowlists, and max-per-call rules; let agents pay x402 requests; inspect receipts and usage history.
- Casper x402 Explorer/Receipt Layer: show paid resources, MCP/API tools, providers, prices, policy approvals/blocks, signed receipts, settlement status, payer/provider, and Casper transaction hashes by binding gateway/facilitator context to raw Casper transaction verification.

The Casper anchor is that paid calls settle through Casper x402/CEP-18 via `transfer_with_authorization` and produce Casper transaction/deploy receipts that are visible in both the product explorer and raw Casper explorer links.

## Why This Fits The Research

- Stellar winners strongly clustered around payment rails and spend control: Cards402, CleverCon, TollPay, RenderGate, and x402-mcp-stellar-template.
- OpenAPI-to-MCP conversion is already common, so the product should not present conversion alone as the innovation.
- MCP/x402 monetization proxies already exist on other chains, so the Casper version needs Casper-native settlement, wallet policy, and receipt/audit proof.
- Casper's strongest public angle is machine payments and verifiable agent commerce, not deep DeFi liquidity.
- x402scan proves x402 explorers are useful, but checked repo surfaces did not show Casper support; CSPR.live is a general block explorer, not an x402 resource/payment explorer.
- Casper transaction data can expose target/entry point/args, but not full x402 resource/tool context; the product explorer needs gateway/facilitator records to avoid making things up.

## Product Loop To Validate

1. Provider imports an OpenAPI spec or connects an MCP server.
2. Platform generates/discovers tools.
3. Provider selects which tools are public and assigns prices.
4. Platform publishes a remote MCP/x402 URL.
5. Agent operator creates or connects a Casper wallet and sets policies.
6. Agent calls a paid tool.
7. Gateway enforces policy before signing/payment.
8. Casper x402 settlement happens.
9. Explorer feed records resource/tool, provider, payer, price, policy decision, receipt, and settlement status.
10. UI shows tool result, spend ledger, provider revenue, and Casper transaction receipt with a raw explorer deep link.

## What Makes It Different From Existing References

- Different from OpenAPI-MCP generators: adds pricing, wallet policy, settlement, receipts, and hosted links.
- Different from TollPay/MCPay: uses Casper x402 and Casper receipts instead of Stellar/EVM/Solana-only rails.
- Different from Cards402: focuses on API/MCP monetization and agent tool spending rather than Visa card issuance.
- Different from generic Casper paid APIs: self-serve provider onboarding plus agent wallet governance.
- Different from generic block explorers: shows x402 commerce context around a paid tool call, then links to raw Casper transaction verification.

## Research Warnings

- A generic "upload OpenAPI, get MCP" feature is not enough.
- A generic "price MCP tools" feature is not enough.
- A hosted platform must handle provider upstream secrets carefully.
- Poor OpenAPI docs produce weak MCP tools; AI-friendly descriptions, examples, operation IDs, and endpoint filtering matter.
- A credible hackathon demo needs a real Casper transaction-producing loop, not only UI mocks.
- The explorer should not try to replace CSPR.live or index the entire chain during MVP; gateway/facilitator events plus Casper transaction links are enough for proof.
- Do not claim every `transfer_with_authorization` is x402. Chain-only detection is a registered-token/entry-point heuristic unless paired with x402 request and receipt records.

## Open Questions Before Spec

- Custody model: CSPR.click/manual signing, generated test wallets, encrypted hosted keys, or bring-your-own signer.
- Policy enforcement: gateway-only policy for MVP, on-chain policy contract, or both.
- Settlement asset: CEP-18 test token, CSPR, or other track-approved token.
- Provider auth: static headers first, custom auth provider, OAuth refresh, API-key vaulting.
- Scope: OpenAPI import first, existing MCP proxy first, or both in a narrow demo.
- Explorer scope: gateway-local activity feed first, public resource registry first, or broader Casper x402 scan/discovery.
