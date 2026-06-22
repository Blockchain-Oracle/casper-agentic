# Reality Research: Casper Agentic Buildathon 2026

## Scope

This brief captures the current factual landscape for the Casper Agentic Buildathon 2026 and the Casper developer/AI tooling ecosystem. It deliberately does not choose a project idea, rank ideas, define architecture, or write an implementation plan.

## Sources Checked

- User-provided brief copied to `.thoughts/raw/hackathon-brief-pasted-text.txt`.
- DoraHacks pages: `https://dorahacks.io/hackathon/casper-agentic-buildathon/buidl` and `/detail`.
- Casper AI Toolkit: `https://www.casper.network/ai`.
- Casper developer docs and docs repo: `https://docs.casper.network/developers`, `https://github.com/casper-network/docs-redux`.
- Casper GitHub org and core repo metadata via GitHub API.
- CSPR.trade MCP site, GitHub README, self-hosting docs, and agent `SKILL.md`.
- npm registry metadata for `@make-software/cspr-trade-mcp` and `@make-software/cspr-trade-mcp-sdk`.
- CSPR.cloud docs, CSPR.build, make-software GitHub metadata, and `make-software/casper-x402`.
- Context7 CLI:
  - `npx ctx7@latest library '@make-software/cspr-trade-mcp' ...`
  - `npx ctx7@latest docs /websites/cspr_click ...`

## Verified Facts

- The current workspace started empty: no project files were present under `/Users/abu/dev/hackathon/casper-agentic`, and it was not a Git repository at the start of research.

- The buildathon brief describes "Casper Agentic Buildathon 2026 - Qualification Round" as a global online competition hosted by Casper Association and run from June 1 to June 30, 2026, with a June 2 Istanbul Blockchain Week workshop. Source: `.thoughts/raw/hackathon-brief-pasted-text.txt`.

- The user-provided brief states one unified track: "Casper Innovation Track". The stated focus is applications that use Casper infrastructure to combine Agentic AI, DeFi, and RWA. Source: `.thoughts/raw/hackathon-brief-pasted-text.txt`.

- The user-provided brief says the prize pool totals $150,000 USD: $30,000 cash, $100,000 x402 ecosystem credits, and $20,000 in-kind co-sponsor rewards. Source: `.thoughts/raw/hackathon-brief-pasted-text.txt`.

- The user-provided brief says qualification requires a working prototype deployed on Casper Testnet with a transaction-producing on-chain component, an open-source GitHub repository with README/docs/usage instructions, and a public demo video. Source: `.thoughts/raw/hackathon-brief-pasted-text.txt`.

- DoraHacks pages were reachable in search results, but direct terminal fetch of the DoraHacks detail page returned an AWS WAF human-verification page. The local pasted brief is therefore the usable detailed source for hackathon terms until a browser-authenticated copy is provided.

- Casper's AI Toolkit page lists: x402 Facilitator, Casper x402 examples, Casper MCP Server, CSPR.trade MCP Server, CSPR.click AI Agent Skill, CSPR.cloud AI Agent Skill, Odra Framework, and `casper-eip-712`. Source: `https://www.casper.network/ai`.

- Casper's AI Toolkit positions x402 as HTTP-native micropayments where agents pay per API request with cryptographic proof. Source: `https://www.casper.network/ai`.

- Casper's AI Toolkit describes CSPR.trade MCP as an MCP server for DEX operations: trade, provide liquidity, and manage portfolios on CSPR.trade from an AI agent. Source: `https://www.casper.network/ai`.

- Casper's AI Toolkit describes the CSPR.click AI Agent Skill as an installable coding skill for wallet connections, signing transactions, event handling, theming, and CSPR.cloud API access. Source: `https://www.casper.network/ai`.

- Casper's AI Toolkit describes CSPR.cloud as middleware with REST, Streaming, and Node API layers for agent-scale read/write access to Casper. Source: `https://www.casper.network/ai`.

- Casper's AI Toolkit describes Odra as a smart contract framework with `llms.txt` support, intended to let AI agents read docs and generate working Casper contracts. Source: `https://www.casper.network/ai`.

- CSPR.build lists agentic tools for CSPR.click SKILL, CSPR.cloud SKILL, Odra Framework SKILL, CSPR.cloud MCP, CSPR.trade MCP, and x402 Facilitator. It also lists ecosystem tools, SDKs, and Testnet faucet/demo resources. Source: `https://cspr.build/`.

- CSPR.cloud docs describe CSPR.cloud as enterprise-grade middleware for indexed/enriched blockchain data, real-time streaming subscriptions, and access to maintained Casper Node infrastructure. Source: `https://docs.cspr.cloud/`.

- CSPR.cloud overview lists Mainnet and Testnet base URLs for REST, Streaming, Node RPC, and Node SSE APIs. It also says the API requires access tokens and has rate limits/quotas. Source: `https://docs.cspr.cloud/documentation/overview`.

- CSPR.cloud Streaming API supports WebSocket subscriptions for account balances, blocks, contracts, contract packages, contract-level events, deploys, fungible token actions, NFTs, NFT actions, and transfers. Source: `https://docs.cspr.cloud/streaming-api/reference`.

- Casper developer docs have a dApps overview for version `2.0.0`, including SDK client libraries, React frontend, signing transactions, speculative execution gas estimation, NCTL local network testing, and Sidecar event monitoring. Source: `https://docs.casper.network/developers/dapps`.

- Casper smart contracts are Wasm programs installed on-chain. The docs say developers can write smart contracts in any language that compiles to Wasm, and the Rust tutorial focuses on Rust. Source: `https://docs.casper.network/developers/writing-onchain-code/simple-contract`.

- Casper docs describe upgradable contracts through contract packages and contract hashes. Source: `https://docs.casper.network/developers/writing-onchain-code/simple-contract`.

- Casper CLI docs for installing contracts require compiled Wasm, the Casper CLI client, an account keypair, and enough CSPR for transaction costs. The install flow uses `casper-client put-transaction session` / `put-txn session` with `--chain-name casper-test` for Testnet and default JSON-RPC port `7777`. Source: `https://docs.casper.network/developers/cli/installing-contracts`.

- Initial web-page lookup showed a stale `casper-js-sdk@next` install command. The cloned `docs-redux` `dev` branch is newer for this page and says the Casper JavaScript/TypeScript SDK supports Casper 2.0 Transactions and legacy Deploys, with install command `npm install casper-js-sdk --save`. Source: `.thoughts/raw/repos/docs-redux/docs/developers/dapps/sdk/script-sdk.md`.

- `casper-network/docs-redux` is the official Casper documentation repository. GitHub API metadata on 2026-06-17: default branch `dev`, created 2024-09-23, updated/pushed 2026-06-05, Apache-2.0, 2 stars, 8 forks, 8 open issues.

- The `docs-redux` README says a complete documentation rework is underway and asks contributors to avoid major or structural changes to the legacy version. Source: `https://github.com/casper-network/docs-redux`.

- The Casper GitHub org has 77 public repositories in the first API page sorted by update time. The most recently updated relevant repos include `casper-node`, `docs-redux`, `ceps`, `casper-sidecar`, `casper-nctl`, `casper-python-sdk`, and `casper-java-sdk`. Source: GitHub API for `casper-network`.

- `casper-network/casper-node` GitHub API metadata on 2026-06-17: default branch `dev`, created 2020-05-14, pushed 2026-06-17, Apache-2.0, 402 stars, 226 forks, 237 open issues.

- Context7 did not return an exact library ID for `@make-software/cspr-trade-mcp`. The best Casper-specific match returned was `/websites/cspr_click`. Source: Context7 command output.

- Context7 CSPR.click docs show the SDK can request transaction signing from the user's active wallet, send the transaction to Casper after approval, and provide optional WebSocket status updates. Source: Context7 docs for `/websites/cspr_click`.

- CSPR.trade MCP's public site says it is live on Casper mainnet, exposes one endpoint (`https://mcp.cspr.trade/mcp`), and offers market data, price history, swaps, liquidity operations, trade analysis, and portfolio tracking. Source: `https://mcp.cspr.trade/`.

- CSPR.trade MCP README says the public endpoint has file-based deploy input disabled and `submit_transaction` accepts inline signed JSON only. Source: `https://github.com/make-software/cspr-trade-mcp`.

- CSPR.trade MCP README says public MCP tools cover market data, trading, liquidity, trade analysis, and account queries. It also describes an optional local signer mode for `sign_deploy`, keeping private keys local. Source: `https://github.com/make-software/cspr-trade-mcp`.

- There is a source discrepancy in CSPR.trade MCP tool count:
  - README/site/self-hosting docs say 24 public tools.
  - Remote `SKILL.md` says 22 public tools plus optional signer and includes `get_native_cspr_balance`.
  - The discrepancy should be resolved against live MCP tool discovery before relying on exact tool count.

- npm registry metadata on 2026-06-17:
  - `@make-software/cspr-trade-mcp`: latest `0.6.0`, created 2026-03-24, modified 2026-04-28, MIT, description "MCP server for AI agents to interact with CSPR.trade DEX on Casper Network".
  - `@make-software/cspr-trade-mcp-sdk`: latest `0.6.0`, created 2026-03-24, modified 2026-04-28, MIT, description "TypeScript SDK for CSPR.trade DEX API on Casper Network".

- `make-software/cspr-trade-mcp` GitHub API metadata on 2026-06-17: default branch `master`, created 2026-03-08, pushed 2026-04-28, MIT, 1 star, 2 forks, 1 open issue.

- `make-software/casper-x402` README describes a Go implementation of the x402 payment protocol for Casper. It says the system supports HTTP APIs requiring micropayments settled on-chain using CEP-18 tokens authorized via EIP-712 signatures. Source: `https://github.com/make-software/casper-x402`.

- `make-software/casper-x402` README describes four components: facilitator HTTP server, demo resource server, headless client, and CSPR.click React app for EIP-712 typed-data signing. Source: `https://github.com/make-software/casper-x402`.

- `make-software/casper-x402` GitHub API metadata on 2026-06-17: default branch `master`, created 2026-05-12, pushed 2026-06-17, Apache-2.0, 2 stars, 1 fork, 1 open issue.

## Inferences

- The buildathon strongly rewards projects that can demonstrate an actual Casper Testnet transaction path, not just an AI UI or off-chain prototype. This follows from the explicit "transaction-producing on-chain component" requirement in the pasted brief.

- The shortest supported DeFi-agent path appears to be through CSPR.trade MCP plus local signing, because there is already a public MCP endpoint, npm package, SDK, and documented signing split. This is an ecosystem-readiness inference, not a project recommendation.

- The x402 path is newer and more strategic for agent-to-agent/API monetization, but likely requires closer attention to token contracts, facilitator setup, EIP-712 signing, and settlement confirmation. This follows from the May/June 2026 repo activity and README architecture.

- Casper docs currently mix legacy docs, versioned 2.0 docs, and a docs rework in progress. Implementation work should verify exact commands against the active docs and package versions at build time.

## Unknowns And Questions

- DoraHacks direct page content could not be fetched from the terminal because of AWS WAF human verification. The local pasted brief should be treated as the detailed event source until verified through a browser or exported page copy.

- Exact final-round advancement and judging mechanics should be rechecked near submission, because hackathon pages and FAQs can change during live events.

- The live CSPR.trade MCP tool count needs direct MCP discovery if/when we install or connect the MCP server.

- The required x402 credits redemption process, eligible services, and practical limits are not clear from the sources checked.

- Whether Casper Association expects or prefers Odra over raw Rust contracts for buildathon submissions is not stated in the checked sources.

- The current status of Casper MCP Server beyond the AI Toolkit link needs direct GitHub/source verification before using it.

## Not Included

- No product ideas.
- No project selection.
- No architecture.
- No implementation plan.
- No code scaffolding.
- No attempt to connect wallets, trade, deploy contracts, or spend Testnet funds.
