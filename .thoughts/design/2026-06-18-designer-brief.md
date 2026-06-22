# Designer Brief: Casper Agent Commerce Gateway

Date: 2026-06-18
Status: Finalized for Context Engineering designer-brief step; pending Abu review before high-fidelity prototype work

## Purpose

Create a high-fidelity mocked product prototype for the Casper Agent Commerce Gateway.

The prototype must show the actual product experience, not a landing page. It should help Abu, a designer, a prototype agent, and hackathon judges understand the product as a real control plane:

Provider publishes a paid tool -> operator configures agent wallet policy -> agent calls the tool -> policy allows or blocks -> x402 verifies/settles -> receipt explains gateway context, x402 context, and Casper proof.

The design goal is clarity and credibility. The prototype should make the Casper-specific proof path visible without pretending that every part is already implemented.

## Prototype Scope

Design a desktop-first responsive app prototype for these five connected surfaces:

1. Provider Gateway.
2. Agent Wallet Control Plane.
3. Casper x402 Explorer / Receipt Layer.
4. Discovery / Registry.
5. Demo Agent Sandbox.

The prototype should be high-fidelity and product-specific. It can be clickable if the design/prototype tool supports interactions, but it must use mocked data and mocked integrations by default.

Mock by default:

- Backend persistence.
- Database records.
- OAuth login and sessions.
- MCP endpoint execution.
- Provider upstream API calls.
- Wallet creation, balance, funding, and signing.
- x402 verify and settle responses.
- Casper transaction/deploy proof.
- Registry publishing and discovery.

Do not implement production database, auth, wallet, payment, API, smart-contract, or gateway code in this prototype unless Abu separately changes scope.

The prototype must include a persistent mode indicator:

- Live Testnet.
- Local.
- Simulated.

If a screen shows simulated settlement or proof, label it clearly. Do not claim live Casper settlement unless the UI is explicitly showing a real transaction/deploy hash supplied later.

## Product Context

The product is a Casper-native agent-commerce platform. It is not just a wallet, not just an MCP proxy, not just an API marketplace, and not a generic x402 explorer.

The two-sided platform has:

- Provider side: a developer brings an API, OpenAPI spec, manual route, or existing MCP server. They select tools, configure upstream credentials, set per-tool pricing, and publish a hosted MCP/x402 endpoint.
- Agent/operator side: a user creates or connects Casper agent wallet profiles, funds or labels them, sets spend policies, allowlists providers/tools/assets/networks, and lets agents pay only inside approved rules.
- Casper proof layer: every paid-call attempt creates a receipt. Successful live settlement must point to Casper transaction/deploy proof. Failed, blocked, local, and simulated attempts must be labeled honestly.

The product should feel like serious operator software for agent commerce. It needs dense, useful information and clear trust boundaries. A judge should understand the full Casper contribution from the product screens, not from a marketing paragraph.

## Target Users

Provider:

- Owns an API, OpenAPI spec, manual endpoint, or MCP server.
- Wants to monetize selected operations as paid agent tools.
- Needs confidence that upstream API keys stay server-side.

Agent Operator:

- Configures MCP client access, Casper wallet profiles, and spend policies.
- Needs to know which agents can spend, on which tools, at what limits.
- Needs blocked spend and failed settlement to be visible and auditable.

Agent Client:

- Cursor, Claude Desktop, a custom MCP client, or a scripted agent.
- Uses copied endpoint configuration and scoped client access.
- Does not receive provider upstream secrets or wallet signing authority.

Viewer/Judge:

- Evaluates the hackathon product.
- Needs to understand what is Casper-specific.
- Needs receipts that separate gateway records from raw Casper proof.

## Domain Knowledge The Designer Needs

x402:

- A payment protocol pattern where a protected resource/tool can request payment and then serve the result after payment conditions succeed.
- In this product, x402 is used for paid agent tool calls.

Casper x402:

- Research indicates a real Casper path through CSPR.cloud and `make-software/casper-x402`.
- The expected Casper path uses `casper:*` networks, the `exact` scheme, CEP-18 asset transfer authorization, and facilitator verify/settle steps.
- The UI must not imply that chain-only inspection proves the full provider/tool/policy context.

MCP:

- Model Context Protocol lets clients connect to tools.
- MCP client authentication is separate from wallet/payment authorization.
- The target remote MCP auth model is OAuth 2.1/Bearer.
- Static scoped tokens may appear as an MVP fallback, but only as client access tokens.

Three separate auth and trust boundaries must be visible:

1. Provider upstream credentials:
   - API keys, bearer tokens, static headers, or no-auth for the provider's upstream source.
   - Server-side only.
   - Never shown to agent clients, receipts, explorer, exports, or user-facing logs.
2. MCP client access auth:
   - OAuth/Bearer target model.
   - Static scoped token fallback for prototype/MVP.
   - Controls which client can reach which hosted endpoint/tools.
3. x402 wallet/payment authorization:
   - Casper wallet profile and signing/payment path.
   - Controls actual payment authorization.
   - Not the same as an API key or MCP client token.

Receipt proof has four layers:

1. Gateway context:
   - Provider, tool, endpoint, client, resource URL, price, wallet, request id.
2. Policy decision:
   - Allowed or blocked, reason, matched rules, limits.
3. x402 context:
   - Payment requirements, verify result, settle result, facilitator source, errors.
4. Casper proof:
   - Transaction/deploy hash when available, network, payer, payee, amount, asset, raw proof link or verification status.

The explorer is a receipt and observability layer for this gateway. It is not a replacement for CSPR.live and should not claim that every Casper transaction is x402.

## Core User Journey

Primary demo journey:

1. Provider creates a source called "CSPR Trade Quote" or "Weather Risk API".
2. Provider configures upstream auth and verifies the source connection.
3. Provider selects one discovered/manual tool and sets Casper x402 pricing.
4. Provider publishes a hosted MCP/x402 endpoint.
5. Operator opens endpoint details and sees client access configuration separate from payment wallet controls.
6. Operator creates or selects a Casper agent wallet profile.
7. Operator sets policy:
   - max spend per call,
   - daily/session limit,
   - allowed provider,
   - allowed tool,
   - allowed network/asset,
   - optional manual approval.
8. Demo agent runs the paid tool call in the sandbox.
9. Sandbox shows request, policy, verify, settle, tool result, and receipt.
10. Receipt opens in the Casper x402 Explorer with gateway context, policy decision, x402 context, and Casper proof separated.
11. Registry shows the public paid tool and lets another operator copy usage instructions or add it to an allowlist.

Secondary journey:

1. Agent attempts an unsafe call.
2. Policy blocks before payment signing/settlement.
3. The explorer records a blocked receipt with no transaction/deploy hash.
4. UI presents blocked as a successful policy outcome, not a generic error.

## Screen-by-screen Direction

### 1. Operations Dashboard

Purpose:

- Show the whole product state immediately.
- Make the five product surfaces discoverable without a marketing hero.

Required content:

- Active providers.
- Published tools.
- Agent wallets.
- Paid calls today.
- Spend blocked by policy.
- Settled volume.
- Latest receipts.
- Current system mode: Live Testnet, Local, or Simulated.
- A visible guided demo path with current progress.

Design direction:

- Dense, scan-friendly operator layout.
- No large landing-page hero.
- Use status, timelines, tables, and concise operational summaries.
- Make the "one complete paid-tool loop" easy to start from this screen.

### 2. Provider Source Import

Purpose:

- Let a provider bring an API, OpenAPI spec, existing MCP server, or manual route.

Required content:

- Source type selector:
  - OpenAPI JSON/YAML.
  - Existing remote MCP.
  - Manual API route/tool.
- Source name and description.
- URL/upload/manual input area.
- Upstream auth panel:
  - no-auth,
  - static header,
  - API-key header,
  - bearer token.
- Test upstream connection action.
- Tool discovery preview.
- Empty, loading, error, and success states.

Design direction:

- Keep upstream auth visually separate from endpoint/client auth.
- Mask secrets after save.
- Label upstream credentials as "server-side only".
- If tool discovery is mocked, label it without making the UI feel fake.

### 3. Tool Pricing And Publish

Purpose:

- Let the provider choose which tools become paid and configure Casper x402 pricing.

Required content:

- Tool list/table with enable toggles.
- Tool description, input schema, output hints, and upstream target metadata.
- Pricing drawer or side panel.
- Pricing fields:
  - network: `casper:casper-test`,
  - scheme: `exact`,
  - asset: CEP-18 token,
  - amount,
  - payee account,
  - timeout.
- Public/private registry toggle.
- Publish endpoint action.
- Inline validation for invalid amount, asset, account, or timeout.

Design direction:

- Make "enabled", "priced", and "published" distinct.
- Make price changes obvious before publishing.
- Keep protocol terms visible but not overwhelming.

### 4. Hosted Endpoint Detail

Purpose:

- Show the generated endpoint and explain how clients connect.

Required content:

- Hosted MCP endpoint URL.
- Client auth mode:
  - OAuth/Bearer target model,
  - static scoped token fallback if shown.
- Copyable config for Cursor, Claude Desktop, and custom MCP clients.
- Tool list with prices and status.
- Public/private registry state.
- Warning: client access token is not a wallet key and cannot authorize payment.

Design direction:

- This screen must answer Abu's API-key/OAuth question through layout.
- Separate panels:
  - Client Access.
  - Provider Upstream Secrets.
  - Payment Wallet Authorization.
- Do not merge these into one "API key" concept.

### 5. Agent Wallet Control Plane

Purpose:

- Manage Casper agent wallet profiles and enforce spend policy.

Required content:

- Wallet list with network, account hash, signing mode, balance/status, and funding status/instructions.
- Add/connect wallet action.
- Selected wallet detail.
- Spend policy editor:
  - max per call,
  - daily/session limit,
  - allowed providers,
  - allowed tools,
  - allowed networks/assets,
  - manual approval toggle.
- Policy preview for a selected tool.
- Recent wallet activity and blocked spend.

Design direction:

- This should feel like risk-control software, not a consumer wallet.
- Policies should read as enforceable controls.
- Blocked spend should be visible and understandable.
- If balances or funding are mocked/unavailable, label them honestly.

### 6. Demo Agent Sandbox

Purpose:

- Run the complete paid-call journey for Abu and judges.

Required content:

- Select agent wallet.
- Select provider tool.
- Input test parameters.
- Policy preview before payment.
- Run paid call action.
- Step timeline:
  - request,
  - policy,
  - x402 verify,
  - x402 settle,
  - tool result,
  - receipt.
- Result panel.
- Receipt link.
- Mode label: Live Testnet, Local, or Simulated.

Design direction:

- The main demo path should fit on one desktop screen if possible.
- Use a stepper/timeline that makes blocked, failed, simulated, and settled states clear.
- Policy must appear before settlement.
- A simulated flow must remain useful and credible, but must not masquerade as live settlement.

### 7. Casper x402 Explorer / Receipt Detail

Purpose:

- Inspect all paid-call receipts and prove what happened.

Required content:

- Receipt feed with filters by provider, tool, wallet, status, network, and time.
- Receipt columns:
  - time,
  - provider,
  - tool,
  - wallet,
  - amount,
  - status,
  - transaction/deploy hash when available.
- Receipt detail sections:
  - Gateway Context.
  - Policy Decision.
  - x402 Verify/Settle.
  - Casper Proof.
- Copy actions for receipt id, endpoint URL, account hash, transaction/deploy hash, and raw proof link.
- Explicit empty/error state for raw Casper proof unavailable.

Design direction:

- Make the hybrid proof model explicit through section labels.
- Do not visually imply the chain stores provider/tool/policy context.
- Show blocked receipts without Casper proof.
- Show failed verify/settle receipts separately from blocked policy receipts.
- Show simulated receipts with persistent labeling.

### 8. Discovery / Registry

Purpose:

- Let operators discover public paid tools.

Required content:

- Search and filters.
- Public tool list or compact cards.
- Provider, tool name, description, price, network, asset, auth type, endpoint status.
- Add to allowlist action.
- Copy connection/config action.
- Private tools absent from the public registry.

Design direction:

- Keep this operator-focused, not marketplace marketing.
- Technical details should remain visible.
- Cards are allowed for individual tools, but avoid a decorative wall of equal cards.

### 9. Settings / Audit

Purpose:

- Make trust boundaries inspectable.

Required content:

- Provider upstream secrets list:
  - masked values,
  - last used,
  - scope/source.
- Client access tokens/OAuth apps:
  - scopes,
  - endpoint,
  - allowed tools,
  - status.
- Facilitator config:
  - mode,
  - endpoint/source,
  - supported network/asset.
- Wallet signing mode.
- Audit log:
  - source created,
  - credentials changed,
  - tool priced,
  - endpoint published,
  - policy changed,
  - call blocked,
  - settlement failed,
  - settlement succeeded.

Design direction:

- Mask secrets.
- Show last-used times and scopes.
- Do not bury auth boundaries in a generic settings page.

## Data, States, And Mocking Rules

Use realistic mock data that teaches the product. Avoid vague placeholder copy.

Suggested mock entities:

- Provider: Make Software Labs, Weather Risk Desk, or CSPR Trade Desk.
- Tool: `get_cspr_quote`, `get_weather_risk`, `price_invoice_asset`, or `fetch_policy_report`.
- Network: `casper:casper-test`.
- Scheme: `exact`.
- Asset: CEP-18 test token.
- Amount: small readable values suitable for demo.
- Wallet: Casper test wallet with account hash placeholder.
- Endpoint: hosted MCP/x402 URL placeholder.
- Transaction/deploy hash: only use a clearly labeled placeholder in simulated mode. Do not present it as real.

Required states:

- Empty state.
- Loading state.
- Error state.
- Disabled state.
- Success state.
- Policy block.
- x402 verify failure.
- x402 settlement failure.
- Provider upstream API failure.
- MCP client auth failure.
- Raw Casper proof unavailable.
- Simulated/local mode.
- Live Testnet mode with proof available.

Mocking rules:

- Mark simulated settlement persistently across dashboard, sandbox, receipt, and explorer.
- Never show provider upstream secret values after save.
- Never put wallet private keys, seed phrases, or signing secrets in UI.
- Client access token examples must be scoped and clearly separate from payment authorization.
- Do not fake a live Casper proof claim. A placeholder hash must be labeled placeholder/simulated.

## Prototype Quality Bar

The prototype should be specific enough that a judge can understand the product in one minute and inspect the proof story in five minutes.

Quality expectations:

- The first screen is the product, not marketing.
- The five surfaces are visible and connected.
- Provider workflow and operator workflow are distinct but linked by receipts.
- Auth boundaries are understandable without reading documentation.
- Policy-before-payment is obvious.
- The explorer separates gateway context, policy decision, x402 context, and Casper proof.
- The UI is usable with one provider, one tool, one wallet, and one paid call.
- Tables, timelines, drawers, tabs, segmented controls, copy buttons, and status chips should be used where they improve clarity.
- Text must fit cleanly in compact UI, including on smaller responsive widths.
- The design should feel ready for a technical product demo, not like concept art.

## Anti-slop Risks To Avoid

Avoid:

- Generic SaaS landing page structure.
- Oversized hero sections that hide the product.
- Decorative effects with no product meaning.
- Abstract Web3 art that does not explain the workflow.
- One-note color treatment or visual style that makes every area feel the same.
- Wall-of-cards layouts where every section has equal weight.
- Cards nested inside cards.
- Fake metrics that do not correspond to the product model.
- Vague buzzwords like "AI-powered insights" without a concrete workflow.
- Placeholder copy that could fit any agent, wallet, API, or DeFi product.
- Claiming live Casper settlement without a real transaction/deploy hash.
- Implying chain-only data proves the provider, MCP tool, resource URL, price rule, or policy decision.
- Treating provider upstream API keys, MCP client access tokens, and wallet payment authorization as one thing.

## Interaction Opportunities

Use interactions that clarify the product:

- Mode switch or persistent environment banner for Live Testnet, Local, and Simulated.
- Guided demo path from dashboard to sandbox to receipt.
- Drawer for tool pricing configuration.
- Split pane for endpoint details and copyable client config.
- Policy preview before running a paid call.
- Step timeline in the sandbox.
- Receipt detail sections that can expand/collapse without hiding proof.
- Filters and search in explorer and registry.
- Copy buttons for endpoint config, receipt id, account hash, transaction/deploy hash, and raw proof URL.
- Tooltips for x402, facilitator, CEP-18, CAIP-2, MCP auth, payment payload, verify, and settle.
- Inline validation for price, payee, asset, network, and token scopes.

## Inspiration And Source Material

Use these as product/domain source material, not as visual templates:

- Quality profile: `../quality/2026-06-18-agent-commerce-gateway-quality-profile.md`
- Spec: `../specs/2026-06-18-agent-commerce-gateway.md`
- Stories: `../stories/2026-06-18-agent-commerce-gateway.md`
- Reality refresh: `../research/2026-06-18-agent-commerce-gateway-reality-refresh.md`
- Product context wiki: `../wiki/agent-commerce-gateway-product-context.md`
- Thesis wiki: `../wiki/agent-commerce-gateway-thesis.md`
- MCP gateway auth reality: `../research/2026-06-18-mcp-gateway-auth-reality.md`
- Casper x402 explorer reality: `../research/2026-06-18-casper-x402-explorer-reality.md`
- Casper x402 on-chain identification: `../research/2026-06-18-casper-x402-onchain-identification.md`
- External x402 and agent winner patterns: `../research/2026-06-18-external-x402-agent-winner-patterns.md`
- Source index: `../raw/source-index.md`
- CSPR.cloud x402 facilitator docs:
  - https://docs.cspr.cloud/x402-facilitator-api/reference.md
  - https://docs.cspr.cloud/x402-facilitator-api/supported.md
  - https://docs.cspr.cloud/x402-facilitator-api/verify.md
  - https://docs.cspr.cloud/x402-facilitator-api/settle.md
- Casper x402 implementation: https://github.com/make-software/casper-x402
- CSPR.trade MCP: https://github.com/make-software/cspr-trade-mcp
- MCP authorization: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- x402scan: https://github.com/Merit-Systems/x402scan

Important inspiration framing:

- CSPR.trade MCP proves Casper MCP/tooling precedent, but this product is a broader gateway/control plane.
- x402scan can inspire receipt/explorer readability, but the prototype must not claim x402scan has Casper-specific support unless that is proven separately.
- CSPR.live can be linked as raw Casper proof inspiration, but this product does not replace CSPR.live.

## Creative Freedom

The designer/prototype agent has freedom to choose visual direction, layout rhythm, typography, color, density, interaction patterns, and component treatment.

The only fixed design constraints are product constraints:

- It must feel like a serious technical operator platform.
- It must start inside the product, not on a marketing page.
- It must make the five surfaces and the paid-call loop obvious.
- It must preserve the auth boundary and receipt/proof boundary.
- It must label simulated/local/live states honestly.
- It must avoid generic AI/Web3 dashboard output.

Do not follow a rigid color recipe unless Abu later provides brand direction.

## Explicit Non-goals

Do not design or implement:

- Production backend architecture.
- Database schema.
- Real OAuth flow.
- Real MCP server.
- Real provider API integration.
- Real wallet custody.
- Real private-key handling.
- Real CSPR.cloud credentials.
- Real x402 settlement.
- Real Casper smart-contract code.
- Mainnet payment flow.
- A chain-wide Casper explorer.
- A marketing landing page as the primary prototype.

Do not claim:

- Live settlement without a real transaction/deploy hash.
- Chain-only proof of provider/tool/policy context.
- That client access tokens can authorize wallet payment.
- That provider upstream credentials are visible to agent clients.

## Open Questions

These do not block the design prototype, but should stay visible:

- Which provider source path should be the first prototype path: manual tool definition, OpenAPI import, existing MCP proxy, or one of each?
- Which wallet signing mode should the prototype assume: generated demo/test wallet, user-provided test key, CSPR.click, local signer, or hosted encrypted signer?
- Should the prototype default to simulated mode with a visible Live Testnet toggle, or show Live Testnet as an unavailable/locked mode until proof exists?
- Does Abu want separate provider and operator workspaces, or one combined demo workspace?
- Which sample tool best tells the hackathon story: CSPR.trade quote, weather/risk data, RWA document check, invoice asset pricing, or another paid API?
- What raw Casper proof URL/status format should appear once implementation chooses the verification path?

## Designer Prompt To Use

Use this prompt when handing the brief to a designer or prototype agent:

```text
Design a high-fidelity mocked product prototype for the Casper Agent Commerce Gateway using the attached designer brief and source artifacts.

Create the actual app experience, not a landing page. The prototype must show five connected surfaces: Provider Gateway, Agent Wallet Control Plane, Casper x402 Explorer / Receipt Layer, Discovery / Registry, and Demo Agent Sandbox.

The core flow is: provider publishes a paid tool, operator configures a Casper wallet policy, agent calls the tool, policy allows or blocks, x402 verifies/settles, and a receipt explains gateway context, policy decision, x402 context, and Casper proof.

All backend, database, OAuth, MCP, provider API, wallet, payment, x402, and Casper proof behavior should be mocked unless I explicitly provide live integration data. Keep provider upstream credentials, MCP client access auth, and x402 wallet/payment authorization visually separate. Label Live Testnet, Local, and Simulated modes honestly. Do not claim live Casper settlement without a real transaction/deploy hash.

Make it feel like serious operator software for agent commerce, not generic SaaS, not a wallet landing page, not a decorative Web3 concept, and not a wall of cards. Include empty, loading, error, disabled, success, policy block, verify failure, settlement failure, upstream API failure, client auth failure, and raw Casper proof unavailable states.
```
