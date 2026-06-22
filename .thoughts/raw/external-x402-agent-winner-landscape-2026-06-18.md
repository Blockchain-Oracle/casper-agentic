# Source Notes: External x402 And AI-Agent Winner Landscape

Research date: 2026-06-18

Purpose: preserve source surfaces used to compare Casper buildathon directions against external x402/agentic-commerce hackathon winners, agent-wallet tooling, and broader x402 ecosystem repos.

## Context7 Sources

Commands:

```bash
npx ctx7@latest library x402 "Research current x402 protocol docs for AI agent payments, facilitator flow, wallets, and hackathon winner patterns"
npx ctx7@latest docs /coinbase/x402 "Current x402 protocol docs for AI agent payments, facilitator flow, wallet/payment signing, and server/client integration"
npx ctx7@latest library "Coinbase Agentic Wallet" "Current docs for Agentic Wallet CLI MCP x402 payments AI agents spending limits"
npx ctx7@latest docs /llmstxt/cdp_coinbase_llms_txt "Agentic Wallet AgentKit x402 AI agents CLI MCP wallet docs spending permissions session keys"
```

Key current-doc facts captured:

- Coinbase x402 docs describe the flow as request -> HTTP 402 -> signed payment payload -> retry with payment header -> verification/settlement.
- Coinbase x402 docs state AI agents need wallets to sign payment payloads, recommending programmatic wallets such as CDP Server Wallets or standard EVM libraries.
- Coinbase AgentKit/Agentic Wallet docs expose CDP wallet providers for EVM/Solana, AgentKit, and x402 wallet/payment flows.

## Official And Platform Sources

- x402 ecosystem page: https://www.x402.org/ecosystem
- Solana x402 Hackathon page: https://solana.com/x402/hackathon
- Coinbase Agents in Action winners: https://www.coinbase.com/developer-platform/discover/launches/agents-in-action-winners
- Stellar x402 page: https://stellar.org/x402
- Stellar x402 blog: https://stellar.org/blog/foundation-news/x402-on-stellar
- Stellar Hacks Agents DoraHacks page: https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp/buidl

## Solana x402 Hackathon Winner Sources

Primary official hackathon page:

- Solana page says the remote hackathon was for innovative tools, apps, infra, and agents on x402, with open-source code, x402/Solana integration, deployed Solana devnet/mainnet programs, a 3-minute demo video, and docs.
- Solana categories included Best Trustless Agent, Best x402 API Integration, Best MCP Server, Best x402 Dev Tool, and Best x402 Agent Application.

Winner-list sources checked:

- PANews/Odaily mirror: https://www.panewslab.com/en/articles/cce37da4-19b3-42e9-b475-49e7751de751
- Markets.com recap: https://www.markets.com/news/solana-x402-hackathon-winners-ai-payments-2864-en
- Binance/Foresight recap: https://www.binance.com/en/square/post/32910429904554
- Solana Developers official X snippets appeared in search results but were not directly fetched as primary content.

Reported main-track winners:

| Winner | Reported category or role | Pattern |
| --- | --- | --- |
| Intelligence Cubed / i3 | Best x402 API Integration | AI-model marketplace, model ownership/tokenization, per-use x402 revenue routing, workflow editor. |
| PlaiPin / Solana ESP32 Native x402 | Best x402 Agent Application or proxy application, depending on recap wording | Hardware/IoT agent wallet that signs and pays from ESP32 devices. |
| x402 Shopify Commerce | Best MCP Server | Shopify stores become agent-compatible and accept native x402 orders/payments. |
| Amiko Marketplace | Best Trustless Agent | On-chain identity, behavior logs, reviews, and credit/reputation for AI agents. |
| MoneyMQ | Best x402 Dev Tool | Message-queue/payment tooling for scalable x402 flows. |

## Solana Winner Code Search

Commands:

```bash
gh search repos "Intelligence Cubed x402 Solana" --limit 10 --json fullName,description,createdAt,pushedAt,language,url,stargazersCount
gh search repos "PlaiPin x402 Solana ESP32" --limit 10 --json fullName,description,createdAt,pushedAt,language,url,stargazersCount
gh search repos "x402 Shopify Commerce Solana" --limit 10 --json fullName,description,createdAt,pushedAt,language,url,stargazersCount
gh search repos "Amiko Marketplace x402 Solana" --limit 10 --json fullName,description,createdAt,pushedAt,language,url,stargazersCount
gh search repos "MoneyMQ x402 Solana" --limit 10 --json fullName,description,createdAt,pushedAt,language,url,stargazersCount
```

Results:

- Direct GitHub search for the winner names returned no repos for i3, x402 Shopify Commerce, or Amiko.
- `PlaiPin/solana-esp32-x402`: https://github.com/PlaiPin/solana-esp32-x402
  - Created 2025-11-12, pushed 2025-11-17, C, 13 stars.
  - README describes ESP32-S3 native Ed25519 signing, SPL token support, facilitator-sponsored payments, automatic x402 flow, and IoT use cases.
- `solana-foundation/moneymq`: https://github.com/solana-foundation/moneymq
  - Created 2025-10-30, pushed 2026-06-02, Rust, 29 stars.
  - README says it is superseded by `solana-foundation/pay`.
- `solana-foundation/pay`: https://github.com/solana-foundation/pay
  - Created 2021-10-19, pushed 2026-06-18, Rust, 1718 stars.
  - README describes a CLI wrapper for `curl`, `claude`, `codex`, etc. that detects 402 challenges, prepares stablecoin transactions, asks a local wallet to sign, and retries with the payment proof. It supports x402 and MPP, ships MCP, and uses local wallet approval such as Touch ID/Windows Hello/GNOME Keyring/1Password.

## Coinbase Agents In Action Winner Sources

Coinbase winners page:

- Coinbase Track: Best Use of x402 + CDP Wallet: Cash Drive, Snack Money API, Infinite Bazaar.
- Coinbase Track: Best Use of CDP Wallet: Uniicon, AI402, CollabraChain.
- Coinbase Track: Best Use of x402: MCPay.fun, 1shot API, M2m.
- AWS, Akash, and Pinata tracks also rewarded agentic applications involving decentralized compute, pay-as-you-go infra, encrypted receipts, and IPFS-native agents.

Representative project pages found:

- Cash Drive: https://devfolio.co/projects/cash-drive-e8bf
- Infinite Bazaar: https://devfolio.co/projects/infinite-bazaar-c1e1
- MCPay.fun: https://devfolio.co/projects/mcpayfun-c653
- AI402: https://devfolio.co/projects/ai-c7f3
- tip.md MCP Server: https://devfolio.co/projects/tipmd-d033
- Snack Money docs: https://docs.snack.money/introduction/getting-started
- Snack Money CLI repo: https://github.com/snack-money/snackmoney-cli

## Agent Wallet / CLI / MCP Tooling Sources

Repository metadata and README slices checked:

- `0xKoda/x402-wallet`: https://github.com/0xKoda/x402-wallet
  - Rust CLI wallet for terminal agents; created 2025-10-27, pushed 2025-10-27, 5 stars.
  - Supports EIP-3009 payment signatures, Ethereum/Base/Base Sepolia, encrypted keystore or `.env`, balances, transfers, and LLM-friendly prompts.
- `coinbase/agentic-wallet-skills`: https://github.com/coinbase/agentic-wallet-skills
  - JavaScript skill package; created 2026-02-09, pushed 2026-06-16, 115 stars.
  - Skills cover auth, balances across Base/Polygon/Solana, sending assets, trading, onramp, x402 search, x402 pay, x402 monetize, and onchain data.
- `onchainexpat/x402-wallet-mcp`: https://github.com/onchainexpat/x402-wallet-mcp
  - TypeScript MCP wallet; created 2026-03-06, pushed 2026-05-20, 1 star.
  - README describes self-custodial USDC wallet for AI agents, HSM/TEE-backed keys via Privy, x402 negotiation, endpoint discovery, spending controls, allowlists, transaction history, and 13 MCP tools.
- `second-state/x402-skill`: https://github.com/second-state/x402-skill
  - Rust/skill project; created 2026-01-26, pushed 2026-06-01, 5 stars.
  - Provides `x402curl`, a drop-in curl replacement with automatic 402 detection/sign/retry, plus skills for Claude Code/OpenClaw.
- `BlockRunAI/Franklin`: https://github.com/BlockRunAI/Franklin
  - TypeScript economic agent; created 2026-03-22, pushed 2026-06-17, 628 stars.
  - README frames it as an AI agent with a wallet that spends USDC autonomously for models, APIs, search, image generation, and other work through x402.
- `atxp-dev/atxp`: https://github.com/atxp-dev/atxp
  - TypeScript MCP payment/wallet infra; created 2026-02-23, pushed 2026-03-03, 32 stars.
  - README says agents get a wallet, email, phone number, and paid MCP tools with pay-per-use USDC billing.
- `0-Vault/Vault-0`: https://github.com/0-Vault/Vault-0
  - Search snippet describes an encrypted secret vault, real-time agent monitor, policy enforcement, and x402 wallet for OpenClaw agents.
- `mrocker/CardZero`: https://github.com/mrocker/CardZero
  - Search snippet describes a smart-contract wallet for AI agents on Base with owner-controlled spending rules and buyer-side x402 support.
- `402md/x402-wallet-for-claude-desktop`: https://github.com/402md/x402-wallet-for-claude-desktop
  - Search snippet describes a Claude Desktop extension that signs x402 USDC payments on Stellar and Base.

## Top x402 GitHub Topic Sample

Command:

```bash
gh search repos "topic:x402" --limit 30 --sort stars --json fullName,description,createdAt,pushedAt,language,url,stargazersCount
```

Representative top-starred signals:

- `NoFxAiOS/nofx`: trading terminal assistant, 12476 stars.
- `BlockRunAI/ClawRouter`: agent-native LLM router with x402 payments on Base/Solana, 6572 stars.
- `Bitterbot-AI/bitterbot-desktop`: local-first agent with skills economy, 2392 stars.
- `BlockRunAI/Franklin`: AI agent with a wallet, 628 stars.
- `daydreamsai/daydreams`: commerce-agent tooling, 608 stars.
- `qntx/x402-openai-python` and `qntx/x402-openai-typescript`: drop-in OpenAI clients with transparent x402 payment support.
- `qntx/facilitator` and `qntx/r402`: x402 facilitator/Rust SDK.
- `AgentlyHQ/aixyz`, `AgentlyHQ/use-agently`, `nirholas/agenti`, `faremeter/faremeter`, and `solana-foundation/pay-kit`: agentic commerce/payment tooling.

## Casper DeFi Reality-Check Sources

Commands:

```bash
curl -s https://api.llama.fi/chains | jq '.[] | select((.name|ascii_downcase)=="casper" or (.name|ascii_downcase|contains("casper")))'
curl -s https://api.llama.fi/protocol/dotoracle | jq '{name,category,chains,tvl,chainTvls}'
```

Observed:

- DefiLlama chain-list query returned no Casper chain entry.
- DefiLlama DotOracle API returned chains `Moonbeam`, `Ethereum`, `OKExChain`, `Avalanche`, and `Binance`; it did not return Casper in the chain list in this API response, despite search snippets describing DotOracle as a bridge aiming to support Casper.

Web sources:

- Casper ecosystem DeFi category page: https://www.casper.network/ecosytem-projects-categories/defi
  - The page lists a broad mix of DeFi-adjacent and ecosystem resources, including Friendly.Market, CSPR.live, wallets, validators, CSPR.studio, NFT projects, Dot Oracle, and other services.
- CSPR.trade MCP page: https://mcp.cspr.trade/
  - Claims CSPR.trade MCP is live on Casper mainnet, exposes 24 public tools, and supports market data, swaps, liquidity management, trade analysis, and portfolio tracking.
- CSPR.trade open beta playbook: https://www.casper.network/get-started/cspr-trade-open-beta-playbook
  - Describes testnet DEX pool creation and swaps.
- Casper Manifest coverage: https://www.tradingview.com/news/chainwire%3Aedab1152f094b%3A0-casper-network-publishes-the-casper-manifest-a-multi-year-roadmap-to-power-regulated-real-world-assets-and-the-machine-economy/
  - Describes Casper's roadmap around regulated RWAs, machine-to-machine economy, EVM compatibility, gasless transactions, smart accounts, privacy/compliance, x402 micropayments, and scoped spending permissions.

## Caveats

- Search results can miss repos that do not use exact project names in titles/descriptions.
- X/Twitter winner announcements were visible as snippets but not fully fetched as primary source content.
- Devfolio and DoraHacks pages can be incomplete or dynamically loaded.
- README claims were not replayed locally unless explicitly stated. Treat repo claims as source claims until verified.
