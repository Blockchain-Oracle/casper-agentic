# Agent Commerce Gateway Product Context

Source base: `../research/2026-06-18-agent-commerce-gateway-reality-refresh.md`, `agent-commerce-gateway-thesis.md`, `../research/2026-06-18-mcp-gateway-auth-reality.md`, and `../research/2026-06-18-casper-x402-onchain-identification.md`.

> 2026-06-22 consistency note: this page is historical context. Use `agent-commerce-gateway-current-truth.md` for current product decisions. The Discovery/Registry and Demo Agent Sandbox language below was superseded by prototype reintegration.

## Approved Product Shape For Specification

The product is a Casper-native Agent Commerce Gateway.

It should feel like one platform with five linked surfaces:

- Provider Gateway: a developer brings an API, OpenAPI spec, or existing MCP server, configures upstream auth, selects tools/routes, prices them, and publishes hosted MCP/x402 endpoints.
- Agent Wallet Control Plane: an operator creates or connects Casper agent wallets, funds them, sets spend rules, and lets agents pay for tools safely.
- Casper x402 Explorer/Receipt Layer: every paid call becomes a receipt record that joins tool/provider context to Casper settlement proof.
- Discovery/Registry: published paid tools can be found, inspected, and copied into agent/MCP-client configs.
- Demo Agent Sandbox: a judge or operator can run a complete paid tool call and see policy, x402 settlement, result, receipt, and raw Casper proof.

## Auth Boundary

The platform must not collapse all auth into "API key".

There are three separate auth surfaces:

- Provider upstream credentials: API keys, bearer tokens, or OAuth tokens that let the gateway call the provider's upstream API/MCP server. These stay server-side and are masked in the UI and logs.
- MCP client authentication: how Cursor, Claude Desktop, custom agents, or hosted clients authenticate to the gateway's remote MCP endpoint. Target model is OAuth 2.1/Bearer for remote HTTP MCP. Static API tokens are acceptable only as an MVP fallback for compatibility.
- x402 wallet/payment authorization: how an agent wallet authorizes and pays for a tool call. This is a Casper x402 payment payload and settlement path, not the same thing as logging in.

## Casper Proof Boundary

The receipt layer should not pretend the chain contains all commerce context.

Raw Casper proof can verify the settlement transaction/deploy, payer/payee/token/amount shape, and `transfer_with_authorization` call context. The product must store or derive the x402 resource/tool/provider/policy context from gateway and facilitator events.

The correct receipt model is:

- Gateway event: provider, tool, resource URL, price, policy decision, client, agent wallet, request id.
- x402 event: payment requirements, signed payload metadata, verify result, settle result.
- Casper proof: deploy/transaction hash, network, payer, payee, amount, asset, raw explorer link, confirmation status.

## MVP Bias

The first build should prove one complete loop with high fidelity:

1. Import or define a provider tool.
2. Price it.
3. Publish a hosted endpoint.
4. Configure an agent wallet and policy.
5. Make a paid tool call.
6. Settle through Casper x402 on Testnet or a clearly labeled local/test setup.
7. Show the receipt and raw proof.

Broad API import, broad registry search, production OAuth providers, production custody, and public chain indexing are secondary after the proof loop works.

## Risks To Keep Visible

- A generic API-to-MCP wrapper is too weak by itself.
- A generic x402 proxy is too weak by itself.
- A generic Casper wallet is too weak by itself.
- Provider secrets and agent wallets must not be mixed.
- Chain-only x402 detection is not enough for an explorer.
- The demo needs a real or clearly simulated settlement boundary; judges should not have to infer the Casper contribution from UI copy.
