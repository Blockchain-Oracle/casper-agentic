# Casper Ecosystem Tooling

Source base: Casper AI Toolkit, CSPR.build, Casper developer docs, CSPR.cloud docs, GitHub API metadata, and the main research brief.

## Official / Ecosystem Surfaces

- Casper AI Toolkit lists x402 Facilitator, Casper x402 examples, Casper MCP Server, CSPR.trade MCP Server, CSPR.click AI Agent Skill, CSPR.cloud AI Agent Skill, Odra Framework, and `casper-eip-712`.
- CSPR.build groups the agentic tools as CSPR.click SKILL, CSPR.cloud SKILL, Odra Framework SKILL, CSPR.cloud MCP, CSPR.trade MCP, and x402 Facilitator.
- CSPR.cloud provides indexed REST APIs, WebSocket Streaming APIs, and Node RPC/SSE endpoints for Mainnet and Testnet.

## Developer Docs

- Casper developer docs are versioned around `2.0.0` for the checked pages.
- dApp docs cover SDKs, React frontend, signing transactions, gas estimation, local network testing through NCTL, and Sidecar events.
- Smart contract docs state Casper contracts compile to Wasm and can be written in any language that targets Wasm; Rust is the tutorial path.
- CLI docs show Testnet chain name `casper-test` and default JSON-RPC port `7777`.
- The cloned `docs-redux` `dev` branch shows the current JS/TS SDK install command as `npm install casper-js-sdk --save`, and says the SDK supports Casper 2.0 Transactions plus legacy Deploys.

## Repo Notes

- `casper-network/docs-redux` is the official documentation repository, Apache-2.0, default branch `dev`, and its README says a docs rework is underway.
- A shallow clone is archived at `../raw/repos/docs-redux` for local research. The checked commit is `34b2071b550feef46fcdbb40bb87f1a711df8958` on `dev`.
- `casper-network/casper-node` is the reference node for the Casper protocol, Apache-2.0, default branch `dev`.
- The Casper GitHub org returned 77 public repositories in the checked API page.
