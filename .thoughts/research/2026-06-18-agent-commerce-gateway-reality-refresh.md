# Reality Research: Casper Agent Commerce Gateway Refresh

Date: 2026-06-18

## Scope

Refresh the current reality for a Casper-native Agent Commerce Gateway before writing the quality profile, spec, stories, designer brief, plan, verification, and handoff artifacts.

The researched product shape is:

1. Provider Gateway for importing APIs, OpenAPI specs, or existing MCP servers, configuring upstream auth, pricing tools/routes, and publishing hosted MCP/x402 endpoints.
2. Agent Wallet Control Plane for creating or connecting Casper agent wallets, funding them, setting spend policies, and letting agents pay safely.
3. Casper x402 Explorer/Receipt Layer that binds gateway/facilitator context to Casper transaction/deploy proof.
4. Discovery/Registry for published paid tools.
5. Demo agent sandbox for live paid tool calls.

## Sources Checked

- Raw refresh notes: `../raw/agent-commerce-gateway-reality-refresh-2026-06-18.md`
- Existing source index: `../raw/source-index.md`
- CSPR.cloud x402 facilitator docs:
  - https://docs.cspr.cloud/x402-facilitator-api/reference.md
  - https://docs.cspr.cloud/x402-facilitator-api/supported.md
  - https://docs.cspr.cloud/x402-facilitator-api/verify.md
  - https://docs.cspr.cloud/x402-facilitator-api/settle.md
- Casper x402 implementation:
  - https://github.com/make-software/casper-x402
  - https://raw.githubusercontent.com/make-software/casper-x402/master/go/README.md
  - https://raw.githubusercontent.com/make-software/casper-x402/master/js/README.md
- CSPR.trade MCP:
  - https://github.com/make-software/cspr-trade-mcp
  - https://raw.githubusercontent.com/make-software/cspr-trade-mcp/master/README.md
- x402 foundation:
  - https://github.com/x402-foundation/x402
  - Context7 library `/coinbase/x402`
- MCP authorization:
  - Context7 library `/websites/modelcontextprotocol_io_specification_2025-11-25`
  - https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- Explorer precedent:
  - https://github.com/Merit-Systems/x402scan
  - Existing local research: `2026-06-18-casper-x402-explorer-reality.md`
- Hackathon source base:
  - User-provided pasted brief in `../raw/hackathon-brief-pasted-text.txt`
  - Earlier captured DoraHacks notes in `../raw/submission-landscape-2026-06-18.md`

## Verified Facts

### Current Workspace

- The project root is a research folder, not an application scaffold.
- There is no `package.json`, `Cargo.toml`, `go.mod`, source tree, or Git repository at the workspace root.
- Existing usable assets live under `.thoughts/`, including raw source notes, wiki pages, research briefs, and a local `docs-redux` clone.

### Hackathon Fit

- The provided brief frames the Casper Innovation Track around Casper infrastructure, Agentic AI, DeFi, and Real-World Assets.
- The brief particularly encourages Agentic AI for real-world problems while still accepting well-designed functional applications that contribute to the Casper ecosystem.
- This supports an agent-commerce infrastructure product more directly than a generic dashboard or a pure DeFi strategy bot.

### Casper x402 Reality

- CSPR.cloud provides an x402 facilitator for Casper.
- The CSPR.cloud facilitator supports the `exact` scheme on `casper:casper` and `casper:casper-test`.
- CSPR.cloud exposes:
  - `GET /supported` to report supported schemes and networks.
  - `POST /verify` to validate a signed payment payload without submitting on-chain.
  - `POST /settle` to validate and settle on Casper.
- The `/settle` response returns `success`, `transaction`, `network`, and `payer` on successful settlement.
- CSPR.cloud describes `transaction` as a Casper deploy hash.
- The settlement path uses CEP-18 tokens and the `transfer_with_authorization` entry point.
- The facilitator pays gas for settlement deploys; the signed authorization moves CEP-18 tokens from payer to payee.

### Casper x402 Implementation Reality

- `make-software/casper-x402` is an active repository described as "x402 Facilitator for Casper".
- The repository contains Go and TypeScript implementations.
- The Go implementation includes facilitator, resource server, client, and CSPR.click React demo examples.
- The TypeScript implementation includes `@make-software/casper-x402`, Express facilitator/server/client demos, and `casper-js-sdk` integration.
- Both implementations target the `casper:*` CAIP-2 family.
- Both describe the same `exact` scheme with CEP-18 `transfer_with_authorization` and EIP-712 typed-data signatures.

### MCP Reality

- Remote HTTP MCP authorization uses Bearer access tokens.
- The current MCP authorization spec positions the protected MCP server as an OAuth 2.1 resource server and the MCP client as an OAuth 2.1 client.
- Bearer tokens must be sent in the `Authorization` header and should not be placed in URI query strings.
- This is separate from x402 wallet/payment authorization.

### CSPR.trade MCP Reality

- `make-software/cspr-trade-mcp` provides a hosted endpoint at `https://mcp.cspr.trade/mcp`.
- Its README says the hosted endpoint exposes public tools for market data, swaps, liquidity management, trade analysis, portfolio tracking, and account queries.
- It uses a non-custodial pattern: remote transaction building and optional local signer mode for private-key operations.
- This is useful as a Casper MCP precedent, but it is not the same as a general provider gateway for arbitrary APIs/MCP servers.

### Explorer Reality

- Existing Casper block explorer tooling can verify raw Casper transaction/deploy data.
- Raw Casper settlement data can show the transfer primitive and transaction/deploy proof.
- It cannot, by itself, prove the full x402 resource URL, MCP tool name, provider workspace, pricing rule, or gateway policy decision unless those records are stored or linked by the gateway/facilitator.
- x402scan is a strong external precedent for x402 observability, but checked sources do not establish a Casper-specific x402 explorer already covering this exact product need.

### Competitive Pattern Reality

- Existing OpenAPI-to-MCP and MCP monetization projects mean "convert API to MCP" alone is not enough.
- External x402/agent hackathon winners and references cluster around:
  - Agent spend control.
  - Paywalled API/resource access.
  - x402-enabled MCP or service templates.
  - Receipts, usage ledgers, and operator control.
- This supports combining provider monetization, agent wallet policy, and receipt proof into one Casper-native product.

## Inferences

1. The product should be presented as an agent-commerce control plane, not just a wallet, proxy, or explorer.
2. The platform needs three auth boundaries:
   - Provider upstream credentials: stored server-side and used only by the gateway to call provider APIs/MCP backends.
   - MCP client authentication: OAuth 2.1/Bearer for remote HTTP MCP, with static API token fallback only as a pragmatic MVP compatibility layer.
   - x402 wallet/payment authorization: signed Casper x402 payment payload and settlement flow.
3. The MVP can plausibly produce a real Casper Testnet proof by integrating CSPR.cloud x402 or `make-software/casper-x402` examples.
4. The explorer should show hybrid receipts: gateway event context plus Casper transaction/deploy verification and raw explorer links.
5. The first implementation should optimize for one complete paid-tool loop rather than broad API import coverage.

## Unknowns And Questions

- Exact judging rubric and current DoraHacks submission state could not be refreshed by direct machine access because DoraHacks returned AWS WAF human verification.
- CSPR.cloud access-token issuance and rate limits must be confirmed before implementation.
- The demo settlement asset must be selected: Casper Mainnet asset, Casper Testnet CEP-18 token, or local/test token.
- Wallet custody needs an explicit decision:
  - Generated demo wallet.
  - User-provided test key.
  - CSPR.click signing flow.
  - Local signer process.
  - Hosted encrypted key management.
- It is not yet decided whether provider import starts with OpenAPI, existing remote MCP, manual API route creation, or one of each.
- On-chain policy enforcement is not proven necessary for MVP; gateway-enforced policy appears more achievable first.

## Not Included

- No implementation is proposed in this file.
- No claim is made that x402scan supports Casper.
- No claim is made that every Casper `transfer_with_authorization` transaction is x402.
- No claim is made that OAuth alone authorizes payments.
- No claim is made that API-key auth is sufficient for a production remote MCP platform.
