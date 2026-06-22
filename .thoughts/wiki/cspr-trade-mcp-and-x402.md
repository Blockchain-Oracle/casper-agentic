# CSPR.trade MCP And x402

Source base: CSPR.trade MCP site, GitHub README, self-hosting docs, remote `SKILL.md`, npm registry, Casper AI Toolkit, CSPR.cloud docs, and `make-software/casper-x402`.

## CSPR.trade MCP

- Public endpoint: `https://mcp.cspr.trade/mcp`.
- Public docs describe market data, price history, swaps, liquidity operations, trade analysis, account queries, and portfolio tracking.
- Public endpoint is non-custodial: transactions are built remotely and signed locally.
- Hosted public endpoint disables file-based deploy input; `submit_transaction` expects inline signed JSON.
- Self-hosting supports stdio or HTTP and can set `CSPR_TRADE_NETWORK=testnet`.
- Optional local signer mode adds `sign_deploy`, with keys staying local.

## Package State

- npm `@make-software/cspr-trade-mcp`: latest `0.6.0`, created 2026-03-24, modified 2026-04-28, MIT.
- npm `@make-software/cspr-trade-mcp-sdk`: latest `0.6.0`, created 2026-03-24, modified 2026-04-28, MIT.
- GitHub `make-software/cspr-trade-mcp`: created 2026-03-08, pushed 2026-04-28, MIT.

## x402

- `make-software/casper-x402` is a Go implementation of x402 for Casper.
- It targets HTTP APIs that require micropayments settled on-chain with CEP-18 tokens and EIP-712 signatures.
- Components in README: facilitator HTTP server, demo resource server, headless client, and CSPR.click React app for typed-data signing.
- Repo metadata checked 2026-06-17: Apache-2.0, created 2026-05-12, pushed 2026-06-17.

## Open Issue

- Tool count is inconsistent across CSPR.trade MCP sources:
  - site/README/self-hosting say 24 public tools.
  - remote `SKILL.md` says 22 public plus optional signer.
  - Resolve with live MCP discovery before implementation.

