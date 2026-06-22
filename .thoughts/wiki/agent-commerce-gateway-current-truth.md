# Agent Commerce Gateway Current Product Truth

Source base: `../prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`, `../design/2026-06-22-claude-code-design-review.md`, `../design/2026-06-22-design-direction-and-structure.md`, `../raw/source-index.md`, `x402-ai-agent-winner-patterns.md`, `cspr-trade-mcp-and-x402.md`, and `agent-commerce-gateway-thesis.md`.

## Current Reading

Casper GW is a Casper-native agent commerce gateway.

It is not a generic wallet, a generic MCP proxy, a generic API marketplace, or a generic Casper block explorer. The product is strongest when it proves one complete paid-tool loop with real Casper Testnet proof and clear policy/receipt boundaries.

The current product shape is:

- Provider Gateway: connect an API, OpenAPI spec, manual route, or existing MCP server; discover tools; protect upstream credentials; price selected tools; publish a hosted MCP/x402 endpoint.
- Agent Wallet Control Plane: connect or provision a Casper agent wallet; fund it; show readiness from live balance/allowance checks; enforce spend policy before signing/payment.
- Paid Tool Test Console: choose the hosted endpoint or paste an MCP/x402 URL; discover tools; render inputs from the selected tool schema; choose wallet/policy; run the paid call; inspect the receipt.
- Public Casper x402 Explorer: public, no sign-in, no wallet connection, no app sidebar; search receipts and inspect public proof.
- Receipt/Proof Layer: every attempt joins gateway context, policy decision, x402 verify/settle context, and Casper proof.

## Current Corrections

Older artifacts used language that is now stale. Future agents should apply these corrections:

- `Discovery/Registry` is not an MVP top-level surface. Optional future discovery/catalog behavior may exist later, but wallet allowlists are not sourced from a registry.
- Public/private tool labels are not accepted product semantics. Use tool publication states such as `Draft`, `Selected`, `Priced`, `Published`, `Unpublished`, and `Unsupported`.
- `Demo Sandbox` is replaced by `Paid Tool Test Console`. It behaves like an MCP/x402 endpoint runner, not a scripted demo page.
- `Simulated` and `Local` are not user-facing product modes. The product is Casper Testnet-first, with Mainnet gated/later. Fixtures are allowed only as labeled design/demo fixtures.
- Static `funded` wallet pills are not enough. Wallet readiness must come from a funding journey and live balance/allowance evidence.
- The authenticated app should use a top-header IA with focused modals, tabs, and drawers, not the current sidebar prototype structure.

## Casper Proof Reality

CSPR.cloud is the current default path for Casper data and x402 settlement:

- CSPR.cloud REST/Streaming provides hosted indexed Casper data for deploy status, account balances, token actions, and live event streams.
- CSPR.cloud hosts the x402 facilitator path for `/supported`, `/verify`, and `/settle`.
- Casper GW should not plan to run its own Casper node or build a chain indexer for MVP.
- Raw Casper proof can verify the payment deploy, payer/payee/token/amount shape, and confirmation status.
- Raw chain proof does not prove the MCP tool, provider workspace, resource URL, price rule, policy decision, or client identity. Those remain gateway/facilitator records.

## Auth Boundaries

The product has three credential planes:

- Provider upstream credentials: server-side only, masked in UI, never returned to clients, receipts, explorer, exports, or user-facing logs.
- MCP client access auth: scoped bearer token for MVP compatibility, OAuth 2.1/Bearer as target architecture.
- x402 wallet/payment authorization: signed payment payload from the wallet path, separate from login and client access.

These must not be collapsed into one "API key" model.

## Wallet And Policy Reality

The wallet surface must feel like agent-payment infrastructure:

- A Casper account may need funding before it is useful.
- The UI should expose the public account/address, copy action, funding instructions, Testnet faucet path, confirmation state, payment-asset balance, CSPR gas balance, allowance/spend headroom, and readiness verdict.
- Spend policy is fail-closed and runs before signing/payment.
- Policy block is a successful control outcome and creates no Casper transaction.
- Signing mode remains an explicit decision. No production custody claim is allowed unless separately designed and implemented.

## Design Direction

The current design direction is structure-first, not a full visual redesign:

- Public pages: landing, explorer, receipt detail.
- Authenticated app: sticky top-header nav, not sidebar.
- Wallet/funding/policy: modal with tabs.
- Fund wallet: drawer or stepper.
- Add source: modal wizard.
- Price/publish tool: per-tool drawer.
- Settings: tabbed page.
- Explorer: public infrastructure with vitality stats and real `testnet.cspr.live` links.

The current visual language can remain or evolve, but the designer must not reintroduce registry/private-tool semantics, simulated/local product modes, fake proof, or generic wall-of-cards SaaS structure.

## Source References

- Current handoff: `../prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Design review: `../design/2026-06-22-claude-code-design-review.md`
- Scoped design direction: `../design/2026-06-22-design-direction-and-structure.md`
- Source index and cloned repos: `../raw/source-index.md`, `../raw/repos/`
- Thesis background: `agent-commerce-gateway-thesis.md`
- x402 winner patterns: `x402-ai-agent-winner-patterns.md`
- CSPR.trade MCP/x402 background: `cspr-trade-mcp-and-x402.md`
