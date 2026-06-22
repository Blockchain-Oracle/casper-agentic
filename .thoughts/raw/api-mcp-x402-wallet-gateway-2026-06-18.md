# Raw Notes: API/MCP x402 Gateway And Agent Wallet Control Plane

Date captured: 2026-06-18

Purpose: preserve source surfaces for Abu's proposed product shape: a UI platform where providers bring APIs or MCP servers, price tools/routes, publish an agent-consumable MCP/x402 endpoint, and agents use governed wallets/spend limits to pay through Casper.

## Context7 MCP TypeScript SDK Lookup

Commands:

```bash
npx ctx7@latest library "Model Context Protocol TypeScript SDK" "MCP server tools authentication HTTP transport OpenAPI tool generation agent payment gateway research"
npx ctx7@latest docs /modelcontextprotocol/typescript-sdk "MCP server tools HTTP transport authentication tool call metadata pricing gateway OpenAPI generated tools"
```

Resolved best docs:

- `/modelcontextprotocol/typescript-sdk`

Relevant facts:

- The TypeScript SDK supports server-side tool registration with Zod input schemas.
- It supports Streamable HTTP server transport and Streamable HTTP client transport.
- It supports clients listing/calling tools dynamically through `client.callTool`.
- This is enough protocol surface for a remote hosted MCP endpoint, not only local stdio.

Primary source URLs from Context7 output:

- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/client.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server-quickstart.md

## x402 MCP Server Docs

Source: https://docs.x402.org/guides/mcp-server-with-x402

Relevant facts:

- x402 docs show an MCP server acting as a bridge between an MCP-compatible client and a paid API.
- Flow: MCP tool call -> paid API returns HTTP 402 -> x402 wrapper handles payment with wallet -> returns paid data to client.
- The docs explicitly warn that production bridges should enforce policy checks before payment: max amount/currency, expected network/scheme, expected server/facilitator, tool name/requested operation, and per-user/per-agent/per-session limits.
- The docs also describe discovery through x402 Bazaar metadata for MCP tools.

## OpenAPI To MCP Conversion

### openapi-mcp-generator

Sources:

- GitHub: https://github.com/harsha-iiiv/openapi-mcp-generator
- npm: https://www.npmjs.com/package/openapi-mcp-generator

Observed metadata:

- GitHub repo: `harsha-iiiv/openapi-mcp-generator`, TypeScript, MIT, 606 stars, created 2025-03-09, pushed 2026-06-15.
- npm package: `openapi-mcp-generator`, version `4.0.1`, modified 2026-06-14.

Relevant README/package facts:

- Generates MCP-compatible servers from OpenAPI 3.0+ specifications.
- Generated servers proxy calls to existing REST APIs.
- Supports API key, bearer token, basic auth, and OAuth2 via environment variables.
- Generates Zod validation from OpenAPI schemas.
- Supports stdio, SSE/Hono web transport, and StreamableHTTP.
- Supports `--header-passthrough` for forwarding inbound headers to the upstream API.
- Supports `--custom-auth` for an editable auth hook.
- Supports `x-mcp` OpenAPI vendor extension to include/exclude operations.

### @ivotoby/openapi-mcp-server

Sources:

- GitHub: https://github.com/ivo-toby/mcp-openapi-server
- npm: https://www.npmjs.com/package/@ivotoby/openapi-mcp-server

Observed metadata:

- npm package: `@ivotoby/openapi-mcp-server`, version `1.16.1`, modified 2026-06-15.

Relevant README/package facts:

- Exposes OpenAPI endpoints as MCP tools.
- Can run as CLI or library.
- Supports stdio and Streamable HTTP transport.
- Supports static upstream headers via `API_HEADERS`.
- Supports URL/file/stdin/inline OpenAPI spec loading.
- Supports tool filtering modes: all, dynamic meta-tools, explicit selected tools, tag/resource/operation filters, and excluded tags.
- Supports custom `AuthProvider` for dynamic headers, token refresh, and 401/403 recovery.
- Supports mTLS options for upstream APIs.
- Its docs warn that tag filters are tool-surface controls, not authorization; upstream API auth still matters.

### cnoe-io/openapi-mcp-codegen

Source: https://github.com/cnoe-io/openapi-mcp-codegen

Observed metadata:

- GitHub repo: Python, Apache-2.0, 38 stars, created 2025-05-08, pushed 2026-05-19.

Relevant README facts:

- Generates MCP servers from OpenAPI specs as Python packages.
- Can additionally generate LangGraph ReAct agent, A2A server, evaluation suite, and system prompts.
- Includes LLM/OpenAPI Overlay pipeline for AI-friendly descriptions.
- Includes examples, tests, and generated architecture patterns.

### AWS Labs OpenAPI MCP Server

Source: https://awslabs.github.io/mcp/servers/openapi-mcp-server

Relevant docs fact:

- AWS Labs documents an OpenAPI MCP Server that dynamically creates MCP tools and resources from OpenAPI specifications.

### Speakeasy And Stainless MCP Generator Guidance

Sources:

- https://www.speakeasy.com/mcp/tool-design/generate-mcp-tools-from-openapi
- https://www.stainless.com/mcp/mcp-server-generator/

Relevant facts:

- Speakeasy says an MCP generator transforms an OpenAPI document into a functioning MCP server exposing API endpoints as tools, but tool quality depends on API documentation quality.
- Speakeasy recommends writing OpenAPI descriptions for AI agents, adding parameter guidance, response examples, operation IDs, and error response docs.
- Stainless describes the basic generation path: prepare OpenAPI, generate server code, configure auth/endpoints, test with AI assistants, verify tool understanding, request translation, and responses.

## MCP/x402 Monetization Infrastructure

### MCPay

Source: https://github.com/microchipgnu/MCPay

Observed metadata:

- GitHub repo: `microchipgnu/MCPay`, TypeScript, 91 stars, created 2025-05-30, pushed 2026-01-21.

Relevant README facts:

- MCPay adds on-chain payments to any MCP server using x402.
- It supports pay-per-call requests rather than static subscriptions/API keys.
- It positions developers as able to monetize through SDK, wrapper, or public index.
- It supports per-call, per-token, or dynamic pricing.
- Its proxy can wrap existing HTTP endpoints or MCP servers with zero upstream code changes.
- It has a registry/discovery surface.
- It supports CLI connection with API key or wallet private key.
- It supports EVM and SVM networks; not Casper.
- It includes a paid MCP handler where tools can be marked paid with a price.

### xpay MCP monetization

Source: https://docs.xpay.sh/en/products/mcp-monetization

Relevant search/opening facts:

- xpay docs describe monetizing MCP servers with pay-per-tool-call billing by wrapping an existing MCP server with an xpay proxy.

### TollPay

Sources:

- GitHub: https://github.com/rajkaria/toll
- npm packages checked: `@rajkaria123/toll-gateway` version `0.1.0`, `@rajkaria123/toll-sdk` version `0.1.1`, modified 2026-04-11.

Relevant facts from prior Stellar winner research:

- TollPay wraps MCP servers and prices individual tools.
- Flow: agent calls MCP tool -> 402 -> agent signs Stellar payment -> Toll verifies/settles -> upstream tool executes.
- Includes gateway, Stellar integration, SDK, CLI, and proxy packages.
- Includes spending policies and replay protection.

### Cards402

Sources:

- GitHub: https://github.com/CTX-com/Cards402
- npm package: https://www.npmjs.com/package/cards402

Observed npm metadata:

- `cards402`, version `0.4.7`, modified 2026-04-14.
- Description: virtual Visa cards for AI agents; pay USDC or XLM on Stellar, get a card in about 60 seconds.

Relevant facts from prior Stellar winner research:

- First-place Stellar winner.
- Includes agent wallet, spend management, CLI, MCP server, and policy engine.

## Casper-Specific Primitives

### Casper x402 Facilitator

Source: https://github.com/make-software/casper-x402

Observed metadata:

- Go repo, Apache-2.0, created 2026-05-12, pushed 2026-06-17.

Relevant README facts:

- Casper implementation of x402 for paid HTTP APIs.
- Enables HTTP APIs to require micropayments settled on-chain using CEP-18 tokens authorized through EIP-712 signatures.
- Components: facilitator, resource server, client, CSPR.click web app.
- Flow: resource server returns 402 with payment requirements -> client builds EIP-712 payment payload -> request replayed with `PAYMENT-SIGNATURE` -> facilitator verifies and settles -> facilitator submits Casper `transfer_with_authorization` deploy to CEP-18 contract -> resource server returns protected response.
- Supports multiple Casper networks through configured CAIP-2 IDs.
- Demo success logs include Casper deploy hash.

### CSPR.trade MCP

Source: https://github.com/make-software/cspr-trade-mcp

Observed metadata:

- TypeScript repo, MIT, created 2026-03-08, pushed 2026-04-28.

Relevant README facts:

- Public endpoint: `https://mcp.cspr.trade/mcp`.
- Exposes 24 public tools for market data, swaps, liquidity, analysis, portfolio, and account queries.
- Trading/liquidity tools build transactions; public endpoint never handles private keys.
- Optional local signer mode adds `sign_deploy`.
- Self-hosting supports testnet via `CSPR_TRADE_NETWORK=testnet`.

## Working Product Shape Implied By Evidence

Evidence supports a two-sided gateway:

- Provider side: import OpenAPI or connect MCP server, filter tools/routes, configure upstream auth, set per-tool/route prices, publish a remote MCP/x402 URL.
- Buyer/agent side: create/manage agent wallets, fund wallets, set spend limits and allowlists, auto-pay x402 calls, view receipts/history, and block policy violations before signing.
- Casper-specific anchor: paid calls settle through Casper x402/CEP-18 and produce Casper deploy hashes/receipts.

This combines the winning Stellar patterns:

- Cards402 wallet/spend management.
- TollPay/MCPay MCP monetization proxy.
- x402-mcp-stellar-template OpenAPI/API-to-agent payment enablement.
- CleverCon budget enforcement.

## Reality Constraints

- OpenAPI-to-MCP conversion is already common. Differentiation cannot be "we convert OpenAPI to MCP" alone.
- MCP monetization proxy is already common. Differentiation cannot be "we price MCP tools" alone.
- Wallet/spend management is already validated by Stellar winners, but a Casper-native version needs Casper-specific proof: CEP-18 settlement, Casper deploy receipts, CSPR.click signing or local signer, and potentially a Casper contract for policy/receipt/audit.
- API key/upstream authentication is a real requirement. Existing generators handle static headers and dynamic auth providers; a hosted platform must treat upstream secrets as sensitive provider-owned credentials.
- Auto-generated MCP tools can be bad if OpenAPI specs are poor. Speakeasy/Stainless both emphasize AI-friendly descriptions, response examples, operation IDs, and filtering.
