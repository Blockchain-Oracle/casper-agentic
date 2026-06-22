# x402 AI-Agent Winner Patterns

Source base: `../research/2026-06-18-external-x402-agent-winner-patterns.md`, `../raw/external-x402-agent-winner-landscape-2026-06-18.md`, and `../raw/stellar-agents-winners-2026-06-18.md`.

## Current Reading

External x402 and AI-agent winners are not only building DeFi bots. The higher-signal pattern is payment infrastructure for agents: wallets, paid API calls, MCP monetization, agent identity/reputation, model/API marketplaces, commerce enablement, and dev tooling.

This page is an evidence map only. It does not select a Casper build.

## Winner Patterns

- Solana x402 winners covered AI model marketplaces, hardware/IoT wallets, Shopify agent-commerce, agent reputation/credit, and x402 developer tooling.
- Coinbase Agents in Action winners covered x402 + CDP Wallet flows, creator-data monetization, social-handle micropayments, MCP monetization, and pay-as-you-go infrastructure.
- Stellar's x402 positioning emphasizes fast settlement, programmable spending rules, MCP integration, smart wallets, privacy/compliance, and multi-chain cost optimization.
- Stellar Hacks: Agents winners make the pattern concrete:
  - 1st place Cards402.com: agent wallets, spend management, CLI/MCP SDK, and Visa card issuance from Stellar USDC/XLM payments.
  - 2nd place CleverCon: Soroban budget vault, specialist-agent marketplace, x402/MPP payments, and unused-budget refunds.
  - 3rd place RenderGate: paid headless-browser rendering API for agents through x402 micropayments.
  - 4th place x402-mcp-stellar-template: Node/Python/Go paywall middleware, wallet provisioning, MCP server, and Soroban spending limits.
  - 5th place TollPay: "Stripe for MCP Servers" with per-tool USDC pricing, agent SDK, x402 settlement, replay protection, and spending policies.

## Agent-Wallet Evidence

The external ecosystem already has several agent-wallet forms:

- CLI wrappers: `solana-foundation/pay`, `0xKoda/x402-wallet`, `second-state/x402-skill`.
- MCP wallets and payment servers: `onchainexpat/x402-wallet-mcp`, `atxp-dev/atxp`, `CTX-com/Cards402`, `rajkaria/toll`, CardZero snippets, 402md snippets.
- Skills: `coinbase/agentic-wallet-skills`, `second-state/x402-skill`.
- Wallet-bearing agents: `BlockRunAI/Franklin`, `BlockRunAI/ClawRouter`.
- Smart-account policy wallets: Stellar/OpenZeppelin smart accounts, CardZero snippets.
- Hardware wallets: `PlaiPin/solana-esp32-x402`.
- Middleware/templates: `ffarinas/x402-mcp-stellar-template`, `rajkaria/toll`, `solana-foundation/pay`.

Common features: detect 402, parse requirements, sign payment payloads, retry requests, enforce caps, log history, discover endpoints, and avoid giving raw keys directly to an unconstrained agent.

## Casper Implication To Research

The evidence supports Abu's concern that "AI agent wallet/control plane" is a real category. Stellar's first-place winner was directly in that lane. The open question is not whether the category exists elsewhere; it does. The open question is whether Casper lacks a native equivalent that can be built credibly within the hackathon constraints.

## Casper DeFi Caution

DefiLlama API did not return Casper as a current chain entry in this pass. Casper has CSPR.trade and CSPR.trade MCP, but the broader evidence does not support treating Casper as a DeFi-alpha chain like Base or Solana. Casper's stronger public story appears to be machine payments, regulated RWAs, compliance/privacy, smart accounts/gasless roadmap, and WebAssembly/upgradable infrastructure.
