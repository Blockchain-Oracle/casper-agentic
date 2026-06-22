# Designer Prompt: Correct The Casper GW Redesign

Use this prompt with the design/prototype agent after uploading the current redesign package and the reintegration audit.

## Prompt

You are revising the high-fidelity UI prototype for Casper GW, also called Casper Agent Commerce Gateway.

Before changing screens, read these project files:

- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-reintegration/2026-06-21-casper-gw-redesign-audit.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-product-context.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-thesis.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/specs/2026-06-18-agent-commerce-gateway.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/stories/2026-06-18-agent-commerce-gateway.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-18-designer-brief.md`

Also inspect the current redesign package:

- `/Users/abu/Downloads/Casper docs UI redesign feedback/Casper Gateway.dc.html`
- `/Users/abu/Downloads/Casper docs UI redesign feedback/screenshots/modal.png`

Treat the prototype as design evidence, not product truth. Your job is to correct the design so it matches the real product direction.

## Product Truth

Casper GW is a two-sided Casper-native platform for paid agent commerce.

Provider side:

- A developer brings an API, OpenAPI spec, manual route, or existing MCP server.
- The platform discovers or defines tools from that source.
- The developer selects tools/routes to expose.
- The developer configures upstream credentials server-side.
- The developer sets x402 pricing per selected tool.
- The developer publishes a hosted MCP/x402 endpoint.

Agent/operator side:

- A user creates or connects Casper agent wallets.
- The user funds wallets on Casper Testnet first, with Mainnet as a later/gated path.
- The user sets spend controls, allowlists, approval rules, and max spend limits.
- Agents/MCP clients can call paid tools only through those policies.

Run/prove side:

- A user can test a paid tool call by selecting a published tool or pasting an external MCP/x402 endpoint URL.
- The tester discovers tools/payment requirements, chooses wallet/policy, enters input, signs/pays when required, and shows result plus receipt.

Explorer side:

- The explorer is a Casper x402 receipt explorer for this gateway.
- The explorer is public and unauthenticated, like an explorer should be.
- It must live outside the gated `/app` dashboard shell.
- Anyone should be able to open it, search, and inspect public receipt/proof metadata without wallet connection.
- It must separate gateway context, policy decision, x402 payment context, and Casper proof.
- It must not expose upstream credentials, private request payloads, private tool outputs, MCP client tokens, or wallet policy internals.

Registry side:

- The registry is discovery for public paid tools.
- The wallet/policy surface is the source of truth for allowlists.

## Required Corrections

1. Split public explorer from authenticated app.

The current redesign makes the explorer feel like a gated dashboard screen. That is wrong.

Create a public explorer experience:

- `/explorer`
- `/explorer/receipts/:receiptId`
- Optional direct proof lookup route if useful

The public explorer should not use the authenticated app sidebar. It should use a public top nav, large search bar, latest receipts/proofs, network filters, and standalone receipt detail pages. No wallet connection or sign-in is required to view public proof.

Authenticated configuration belongs in `/app`.

2. Remove `Simulated` and `Local` as first-class product modes.

Use `Network: Testnet` as the default product framing. `Mainnet` may be disabled, gated, or marked as later if visible. Do not make simulation/local a top-level product path.

3. Do not show fake chain proof.

Do not display fake deploy hashes, fake explorer links, or `Settled` badges unless the UI is explicitly showing a real Testnet/Mainnet transaction state. Blocked and failed calls should clearly show `No Casper transaction`.

4. Rename `Demo Agent Sandbox`.

Use one of these names unless Abu chooses another:

- `Paid Tool Test Console`
- `x402 Tool Call Tester`
- `Agent Tool Runner`
- `Gateway Test Console`

This screen should feel like a real integration tester, not a scripted simulation.

5. Make pricing tool-first.

The pricing flow must be:

Source import -> discovered tools -> select tools -> configure price per selected tool -> publish endpoint.

The user should never wonder "what am I pricing?"

6. Make registry discovery-only.

Registry actions can include:

- `View tool`
- `Copy MCP config`
- `Test call`
- `Add to wallet policy`

Do not make the registry screen look like it owns wallet allowlist settings. Wallets & Policies owns allowlists.

7. Tighten receipt/explorer language.

Receipt layers should be:

- Gateway context.
- Policy decision.
- x402 payment context.
- Casper proof.

Allowed status examples:

- `Paid on Testnet`
- `Mainnet paid`
- `Policy blocked`
- `Payment failed`
- `Proof pending`
- `No Casper transaction`

Avoid `Live`, `Verified`, or `Settled` unless backed by actual chain proof.

## Recommended Information Architecture

Use a public/private route model.

Public:

- `/` landing/product entry.
- `/explorer` public Casper x402 explorer.
- `/explorer/receipts/:receiptId` public receipt detail.
- Optional public tool catalogue preview only if Abu approves.

Authenticated app:

- `/app` operations dashboard.
- `/app/sources` provider source import.
- `/app/tools` tool selection, pricing, and publish.
- `/app/endpoints` hosted endpoint/client auth.
- `/app/wallets` agent wallets and spend policies.
- `/app/test-console` paid tool test console.
- `/app/registry` account-aware registry actions.
- `/app/settings` credentials, facilitator, signing, and audit.

Group the authenticated app as:

Provider:

- Sources
- Tools & Pricing
- Hosted Endpoint

Operator:

- Wallets & Policies
- Tool Registry

Run & Prove:

- Paid Tool Test Console

System:

- Settings
- Audit

You can keep these as navigation sections, grouped tabs, or a progressive dashboard. The important thing is that users understand the workflow.

## Screen Requirements

Operations Dashboard:

- Show setup progress and next actions.
- Show recent paid calls, blocked calls, and proof status.
- Do not show simulation/local as product modes.
- Keep this inside `/app`. Do not put the public explorer inside the app dashboard.

Sources:

- Let users add API/OpenAPI/MCP/manual source.
- Show discovery result and unsupported tools.
- Lead into tool selection.

Tools & Pricing:

- Show selected source at the top.
- Show discovered tools.
- Let user select tools to expose.
- Price selected tools.
- Publish selected priced tools.

Hosted Endpoint:

- Show hosted MCP/x402 endpoint.
- Show client auth separately from upstream provider auth.
- Show payment requirement separately from endpoint liveness.

Wallets & Policies:

- Own wallet identity, network, funding, signing mode, spend caps, allowed tools/providers, and approval rules.
- Show policy evaluation as the step before payment.

Paid Tool Test Console:

- Support testing a published tool.
- Support pasting an external MCP/x402 endpoint URL if feasible in the prototype.
- Show tool discovery, wallet selection, policy check, payment action, result, and receipt.

Receipt Explorer:

- Design this as a public explorer, not a gated app page.
- No app sidebar.
- No wallet connection requirement.
- No sign-in requirement.
- Lead with a large search bar for receipt id, deploy hash, wallet address, provider, or tool.
- Show latest public receipts/proofs and network status.
- Filter by network, wallet, provider, tool, status, and date.
- Show gateway context, policy decision, x402 context, and Casper proof as separate sections.
- Redact private request inputs, private tool outputs, provider credentials, client tokens, and wallet policy internals.

Tool Registry:

- Show public paid tools for discovery.
- Include copy config, test call, and add-to-wallet-policy actions.
- Do not duplicate wallet allowlist management.

Settings & Audit:

- Show credential boundaries, client auth, facilitator config, signing mode config, and audit events.
- Keep provider upstream credentials, MCP/client auth, and x402 wallet/payment authorization separate.

## Visual Direction

Keep the improved Casper-flavored direction from the redesign:

- Casper red as a precise accent.
- Neutral professional surfaces.
- Dense, credible operator UI.
- Clear tables, policy panels, receipts, and status chips.

Public surfaces should feel premium and infrastructure-grade:

- Landing page: clear product entry, public explorer search, and launch app action.
- Explorer: standalone public proof product, not a dashboard widget.
- App: dense operator software for providers and wallet managers.

Do not make a marketing-only landing page. The first public screen should quickly lead to explorer search and app launch.

## Deliverables

Return:

1. Revised high-fidelity prototype.
2. A screen map.
3. A list of changed product decisions.
4. A list of any remaining mock/fixture surfaces.
5. A short note explaining how each screen connects to the real product flow.

Do not implement app code. Do not rewrite the spec or stories. This is a design correction and prototype reintegration pass only.
