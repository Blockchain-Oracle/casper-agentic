# Raw Source Notes: Agent Commerce Gateway Reality Refresh

Date: 2026-06-18

Purpose: refresh the evidence base before moving the Casper Agent Commerce Gateway from thesis into quality profile, spec, stories, designer brief, plan, verification, and handoff artifacts.

## Local State Checked

- Workspace: `/Users/abu/dev/hackathon/casper-agentic`
- `find . -maxdepth 2 -type f -not -path './.thoughts/*' -print` returned no application files.
- The root is not a Git repository.
- `.thoughts/` contains raw research, wiki pages, and a cloned `docs-redux` mirror.
- Stack detection only found files under `.thoughts/raw/repos/docs-redux`; there is no app scaffold yet.

## Context7 Checks

- `npx ctx7@latest library x402 "Casper Agent Commerce Gateway x402 MCP payments offers receipts settlement"`
  - Best match: `/coinbase/x402`
  - Description: open HTTP 402 payment protocol.
  - Source reputation: High.
- `npx ctx7@latest docs /coinbase/x402 "Casper Agent Commerce Gateway x402 MCP payments offers receipts settlement"`
  - Returned `SettleResponse` structure, `/settle` behavior, settlement handler examples, and MCP client wrapping examples.
- `npx ctx7@latest library "Model Context Protocol" "remote MCP authorization OAuth 2.1 bearer token protected resource server client auth"`
  - Best current spec match by benchmark: `/websites/modelcontextprotocol_io_specification_2025-11-25`.
- `npx ctx7@latest docs /websites/modelcontextprotocol_io_specification_2025-11-25 "remote MCP authorization OAuth 2.1 bearer token protected resource server client auth"`
  - Returned MCP authorization guidance: HTTP MCP clients use `Authorization: Bearer <access-token>`; protected MCP servers act as OAuth 2.1 resource servers.

## Current Primary Sources Checked

- CSPR.cloud x402 facilitator reference:
  - https://docs.cspr.cloud/x402-facilitator-api/reference.md
  - https://docs.cspr.cloud/x402-facilitator-api/supported.md
  - https://docs.cspr.cloud/x402-facilitator-api/verify.md
  - https://docs.cspr.cloud/x402-facilitator-api/settle.md
- Casper x402 repository:
  - https://github.com/make-software/casper-x402
  - Go README: https://raw.githubusercontent.com/make-software/casper-x402/master/go/README.md
  - TypeScript README: https://raw.githubusercontent.com/make-software/casper-x402/master/js/README.md
- CSPR.trade MCP:
  - https://github.com/make-software/cspr-trade-mcp
  - https://raw.githubusercontent.com/make-software/cspr-trade-mcp/master/README.md
  - Latest release observed: `v0.6.0`, published `2026-04-28T03:11:55Z`.
- x402 foundation repository:
  - https://github.com/x402-foundation/x402
  - GitHub metadata observed: active, Apache-2.0, updated `2026-06-18T07:02:48Z`.
- x402 ecosystem explorer:
  - https://github.com/Merit-Systems/x402scan
  - GitHub metadata observed: active, description "x402 Ecosystem Explorer", updated `2026-06-16T19:44:08Z`.
- DoraHacks pages:
  - https://dorahacks.io/hackathon/casper-agentic-buildathon/detail
  - https://dorahacks.io/hackathon/casper-agentic-buildathon/buidl
  - Direct `curl` currently returns AWS WAF human verification, so the local pasted brief and earlier captured DoraHacks notes remain the usable source base.

## Refreshed Observations

- CSPR.cloud facilitator exposes `/supported`, `/verify`, and `/settle`.
- `/supported` returns the `exact` scheme on `casper:casper` and `casper:casper-test`.
- CSPR.cloud `/verify` validates a signed payment payload against payment requirements without submitting on-chain.
- CSPR.cloud `/settle` validates and submits a Casper settlement transaction, returning `success`, `transaction`, `network`, and `payer`.
- The settlement transaction is described as a Casper deploy hash for a `transfer_with_authorization` call on a CEP-18 token.
- Casper x402 now has Go and TypeScript implementations in `make-software/casper-x402`.
- The Casper x402 implementations target `casper:*` CAIP-2 networks and use CEP-18 `transfer_with_authorization` with EIP-712 signatures.
- The Go implementation includes facilitator, resource server, client, and a CSPR.click React demo.
- The TypeScript implementation publishes `@make-software/casper-x402` and includes Express facilitator, resource server, and client examples.
- CSPR.trade MCP is a live Casper MCP endpoint at `https://mcp.cspr.trade/mcp`, with public market/trading/liquidity/account tools and optional local signer mode.
- MCP authorization and x402 payment authorization are separate surfaces. Remote HTTP MCP auth is OAuth/Bearer; x402 payment authorization is a signed payment payload and settlement flow.
- x402scan is a relevant explorer precedent, but no checked source proves it indexes Casper-specific x402 settlement context today.

## Practical Product Consequences

- The gateway should not ask providers to expose upstream API keys to agents. Provider upstream credentials belong in server-side encrypted configuration.
- The hosted MCP/x402 endpoint should support OAuth 2.1/Bearer for client identity and may support a static API token as an MVP compatibility fallback for tools that cannot complete OAuth yet.
- Agent payment capability should be modeled separately from platform login. A logged-in MCP client still needs an agent wallet/signing path for x402 payments.
- The explorer should be a hybrid receipt layer. It should store gateway/facilitator context and link to raw Casper transaction proof rather than claiming to infer full x402 context from chain data alone.
- A credible demo can use CSPR.cloud or the Casper x402 facilitator examples to produce a Testnet settlement hash.

## WAF / Access Limitations

- DoraHacks pages were not directly machine-readable during this refresh because of AWS WAF human verification.
- This refresh does not claim current submission counts or judging text beyond the already captured source notes and user-provided brief.
