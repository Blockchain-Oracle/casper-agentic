# Raw Notes: Stellar Hacks Agents Winners

Date captured: 2026-06-18

Purpose: preserve Abu-provided Stellar winner links and primary repo evidence for x402/agent-payment winner patterns. This is source capture only, not a Casper build decision.

## User-Provided DoraHacks Winner Links

- Winner page: https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp/winner
- 1st place, Cards402.com: https://dorahacks.io/buidl/42819
- 2nd place, clevercon: https://dorahacks.io/buidl/42656
- 3rd place, RenderGate: https://dorahacks.io/buidl/42807
- 4th place, x402-mcp-stellar-template: https://dorahacks.io/buidl/42579
- 5th place, TollPay: https://dorahacks.io/buidl/42585

DoraHacks pages were difficult to fetch directly through the browser/web fetcher, but search snippets resolved the same winner set:

- Winner page snippet listed: 1st Place Cards402.com, 2nd Place clevercon, 3rd Place RenderGate, 4th Place x402-mcp-stellar-template.
- TollPay search snippet tied `dorahacks.io/buidl/42585` to 5th Place.

## Context7 x402 Refresh

Command:

```bash
npx ctx7@latest library x402 "x402 protocol Stellar agent payments MCP middleware wallet spending policies HTTP 402 hackathon research"
npx ctx7@latest docs /coinbase/x402 "x402 protocol Stellar agent payments MCP middleware wallet spending policies HTTP 402 hackathon research"
```

Resolved official/high-reputation docs:

- `/coinbase/x402`

Relevant doc facts:

- x402 uses HTTP 402 Payment Required so services can charge for APIs/content directly over HTTP.
- Sellers configure paid routes with price, network, and pay-to address.
- Buyers use client wrappers that handle 402 responses by creating signed payment payloads from a wallet.
- Official docs include MCP client wrapping for automatic payment handling.
- Official examples include multi-network server configuration, including Stellar testnet through `ExactStellarServer`.
- Context7 summary says x402 supports EVM, Solana, Stellar, Algorand, and Aptos, and SDKs/reference implementations for TypeScript, Go, and Python.

## 1st Place: Cards402.com

Sources:

- DoraHacks: https://dorahacks.io/buidl/42819
- GitHub: https://github.com/CTX-com/Cards402
- API/site: https://api.cards402.com and https://cards402.com

DoraHacks search snippet:

- "Stellar powered OWS wallets for Agents with full spend management and instant real Visa card issuance."
- Another snippet says agents pay USDC or XLM on Stellar and get a real Visa card number in about 60 seconds.

GitHub repo facts from README:

- "Virtual cards for AI agents. Pay USDC or XLM on Stellar, get a Visa card number in ~33 seconds."
- Repository contains backend, Soroban contract, SDK, web app, docs, examples, and scripts.
- Backend is Node/Express with Soroban event watcher, order state machine, policy engine, agent auth, dashboard API, webhook delivery, and background jobs.
- Policy engine includes spend limits, approval flows, and time windows.
- SDK includes a TypeScript client, CLI, and MCP server published as `cards402`.
- CLI commands include `cards402 onboard`, `cards402 purchase`, `cards402 wallet`, and `cards402 mcp`.
- Contract is a Soroban smart contract deployed on Stellar mainnet that receives USDC or XLM and emits payment events.
- README claims CI runs backend, web, and SDK tests, plus Semgrep, gitleaks, and Playwright E2E.
- Important boundary: fulfillment engine for upstream gift-card providers is private; backend/SDK/contract/web/operator dashboard are public in the repo.

Pattern classification:

- Agent wallet/spend-management product.
- Agent-facing CLI/MCP surface.
- Real-world payment bridge: on-chain USDC/XLM -> Visa card.
- Strong direct support for the "agent wallet/control plane" research lane.

## 2nd Place: CleverCon

Sources:

- DoraHacks: https://dorahacks.io/buidl/42656
- GitHub: https://github.com/clevercon-protocol/clevercon
- Live demo: https://clevercon-orchestrator.onrender.com

DoraHacks search snippet:

- CleverCon builds a Stellar marketplace where Soroban contracts secure USDC and enforce on-chain budgets.
- Personal AI agents hire specialized agents/pay for services via x402/MPP micropayments.

GitHub repo facts from README:

- On-chain service marketplace on Stellar, AI-focused today and service-agnostic by design.
- Users describe a task, deposit USDC into CleverVault, and an orchestrator breaks the task into steps.
- Specialist agents are selected from an open registry and paid in real USDC as steps complete.
- CleverVault is a Soroban smart contract that holds user USDC and releases payment per completed step.
- Payment uses x402 for per-call HTTP micropayments or MPP for streaming session payments.
- Unused budget is refunded automatically.
- Reference agents include StellarOracle, WebIntel v1/v2, AnalysisBot, and ReporterBot.
- Tech stack includes Rust/Soroban, Node/Express/TypeScript, React/Vite/Tailwind, Claude Sonnet/Haiku, `@x402/express`, `@x402/stellar`, `@stellar/mpp`, and Stellar Wallets Kit.
- README lists a deployed Stellar testnet CleverVault contract.

Pattern classification:

- Budgeted multi-agent marketplace.
- On-chain escrow/vault for task budget control.
- x402/MPP agent payment routing.
- Service marketplace, not DeFi portfolio tooling.

## 3rd Place: RenderGate

Sources:

- DoraHacks: https://dorahacks.io/buidl/42807
- GitHub: https://github.com/tantk/rendergate
- Live service: https://tantk-rendergate.hf.space

DoraHacks search snippet:

- "Pay-per-render headless browser API for agents powered by x402 micropayments on Stellar."
- Another snippet says the agent pays $0.001 USDC and gets rendered content in one HTTP call.

GitHub repo facts from README:

- Agents are often HTTP clients and cannot execute JavaScript-heavy websites.
- RenderGate charges $0.001 USDC, then renders with Playwright and returns title, text, links, headings, metadata, and payment info.
- Flow: request render endpoint -> receive 402 -> sign Stellar USDC payment -> verify/settle via x402 facilitator -> render page -> return structured content.
- Supports MCP tool usage and x402 fetch usage.
- README lists tested sites, blocked-site behavior, and example on-chain transaction.
- If a page is blocked or empty, README says payment is automatically refunded.

Pattern classification:

- Paid compute/tool API for agents.
- x402 as meter for expensive infrastructure that agents do not want to run locally.
- Not a DeFi app; it is a paid capability endpoint.

## 4th Place: x402-mcp-stellar-template

Sources:

- DoraHacks: https://dorahacks.io/buidl/42579
- GitHub: https://github.com/ffarinas/x402-mcp-stellar-template
- Demo/site: https://rivalyze.ffarinas.com

DoraHacks search snippet:

- "Making x402 adoption effortless. Drop-in middleware libraries for Node and Python that let any SaaS accept autonomous agent payments in USDC on Stellar..."

GitHub repo facts from README:

- Toolkit for payments between AI agents and APIs using USDC on Stellar.
- Targets both SaaS owners charging agents per API call and agents paying for services.
- Includes paywall middleware, wallet provisioning, payment signing, and on-chain settlement.
- Provides Node, Python, and Go options.
- Includes an MCP server so AI clients such as Claude, Cursor, and Codex can discover and pay APIs automatically.
- Includes optional Soroban contract enforcing per-agent daily USDC spending limits.
- Claims real Stellar mainnet settlement through OpenZeppelin and publishes on-chain proofs.
- Bundled live example charges $0.10 USDC per sentiment-analysis call.

Pattern classification:

- Adoption middleware/template.
- Agent payment enablement for existing APIs.
- Wallet provisioning + spending limits + MCP packaging.

## 5th Place: TollPay

Sources:

- DoraHacks: https://dorahacks.io/buidl/42585
- GitHub: https://github.com/rajkaria/toll
- Site/demo: https://tollpay.xyz and https://api.tollpay.xyz/mcp

DoraHacks search snippet:

- "Toll is Stripe for MCP Servers. AI agents use 10000+ MCP tools but can't pay for them. Toll adds per-call USDC micropayments on Stellar to any MCP server..."

GitHub repo facts from README:

- Drop-in middleware that turns any MCP server into a paid API.
- Tool owners configure per-tool USDC pricing.
- Flow: agent calls MCP tool -> Toll returns HTTP 402 -> agent signs Stellar payment -> Toll verifies/settles on-chain -> tool executes.
- README claims deployment and real USDC payments on Stellar mainnet.
- Provides packages: `@rajkaria123/toll-gateway`, `@rajkaria123/toll-stellar`, `@rajkaria123/toll-sdk`, `@rajkaria123/toll-cli`, and `@rajkaria123/toll-proxy`.
- Agent SDK auto-handles 402, signs payments, retries, and tracks budget.
- Security notes include replay protection, spending policies, Zod validation, self-hosted Soroban settlement, and no server access to agent private keys.

Pattern classification:

- MCP monetization/payment gateway.
- Developer infrastructure for per-call agent-tool payments.
- Clear support for x402 + MCP + budget-control infrastructure as a winning lane.

## Cross-Winner Pattern

The Stellar winner set is heavily concentrated around agent payment infrastructure:

- 1st place: agent wallet/spend management plus Visa card issuance.
- 2nd place: task budget vault plus agent marketplace.
- 3rd place: paid browser rendering API for agents.
- 4th place: x402 middleware/template plus MCP server and wallet provisioning.
- 5th place: MCP monetization gateway plus agent SDK and spending controls.

This materially strengthens the earlier external-pattern conclusion: winning x402 projects are not mainly generic DeFi bots. They are agent payment rails, spend-control surfaces, paid capability endpoints, and developer tooling that makes machine payments usable.
