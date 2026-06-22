# Prototype Reintegration Audit: Casper GW Redesign

Date: 2026-06-21
Status: design audit for Abu review
Scope: audit the redesigned prototype package before any spec/story/plan/implementation update

## Verdict

The redesigned prototype is directionally closer on brand and credibility, but it is not ready to treat as the accepted product design.

The main problem is not visual quality. The problem is product truth. The prototype still presents `Simulated`, `Local`, and `Live Testnet` as first-class product modes, while Abu's updated direction is that the product should be grounded around Casper `Testnet` and eventually `Mainnet`. Development fixtures may exist behind the scenes, but the user-facing product should not look like a simulation product.

The second problem is information architecture. Provider setup, tool selection, pricing, wallet policy, registry, paid-call testing, and receipt exploration are all present, but some screens read as isolated dashboards instead of one joined workflow. Pricing is especially unclear because the user lands on "Pricing" before the selected tool/source relationship is obvious.

The third problem is the public/private boundary. The explorer is currently treated like a gated dashboard screen inside the same sidebar shell as wallet and provider configuration. That is wrong. The explorer should be a public proof surface that anyone can open, search, and inspect without connecting a wallet or signing into the app. The authenticated `/app` area is for configuration and operations.

Planning should not continue until these design corrections are accepted.

## Inputs Checked

- `/Users/abu/Downloads/Casper docs UI redesign feedback/Casper Gateway.dc.html`
- `/Users/abu/Downloads/Casper docs UI redesign feedback/support.js`
- `/Users/abu/Downloads/Casper docs UI redesign feedback/screenshots/modal.png`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-product-context.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-thesis.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/specs/2026-06-18-agent-commerce-gateway.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/stories/2026-06-18-agent-commerce-gateway.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-18-designer-brief.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-discovery/2026-06-18-casper-agent-commerce-gateway.md`

## Product Truth To Confirm

This is my current understanding of the product we are building.

Casper GW, also called Casper Agent Commerce Gateway, is a two-sided Casper-native platform for paid agent commerce.

Provider side:

- A developer brings an API, OpenAPI spec, manual route, or existing MCP server.
- The platform discovers or defines tools from that source.
- The developer selects which tools/routes to expose.
- The developer configures upstream auth/server-side credentials without exposing them to clients.
- The developer sets x402 pricing per selected tool.
- The developer publishes a hosted MCP/x402 endpoint that agents can call.

Agent/operator side:

- A user creates or connects Casper agent wallets.
- The user funds wallets on the relevant Casper network.
- The user sets spend controls: max per call, max per day/session, allowed providers/tools, allowed assets, approval rules, and fail-closed behavior.
- Agents or MCP clients can call paid tools through those wallet policies.

Run/prove side:

- A user can test a paid tool call by selecting a published tool or pasting an external MCP/x402 endpoint URL.
- The tester should discover tools/payment requirements, choose wallet/policy, submit tool input, sign/pay when required, and see the tool result.
- A successful paid call should produce a receipt that joins gateway context, policy decision, x402 payment context, and Casper proof.

Explorer side:

- The explorer is not a generic block explorer.
- It is a Casper x402 receipt explorer for this gateway.
- It is public and unauthenticated by default, like an explorer should be.
- It should live outside the gated `/app` dashboard shell.
- It should not require wallet connection to view receipts, deploy hashes, providers, tools, or public payment proof.
- It should make clear which parts are gateway metadata, which parts are x402/payment data, and which part is actual Casper chain proof.
- It must not expose upstream secrets, private request payloads, private tool outputs, provider credentials, or user-only policy details.

Registry side:

- The registry is discovery for published tools.
- It is not the source of truth for wallet allowlists.
- Registry actions may copy client config or add a tool to a selected wallet policy, but allowlist management belongs in the wallet/policy surface.

Settings/audit side:

- Settings should separate provider upstream credentials, MCP/client authentication, x402 wallet/payment authorization, facilitator config, and audit logs.
- Settings should not blur custody, provider secrets, client auth, or payment authorization.

## Route And Access Model

The product should be split into public proof/discovery surfaces and authenticated operator surfaces.

Public:

- `/` landing/product entry.
- `/explorer` public Casper x402 explorer.
- `/explorer/receipts/:receiptId` public receipt detail.
- `/explorer/deploy/:hash` or equivalent proof lookup if the design needs a direct proof route.
- Optional public tool catalogue or registry preview, if Abu accepts that direction.

Authenticated app:

- `/app` operations dashboard.
- `/app/sources` provider source import.
- `/app/tools` tool selection, pricing, and publish.
- `/app/endpoints` hosted endpoint/client auth.
- `/app/wallets` agent wallets and spend policies.
- `/app/test-console` paid tool test console.
- `/app/registry` provider/operator discovery actions that require account context.
- `/app/settings` credentials, facilitator, signing, and audit.

The public explorer should not use the app sidebar. It should have its own public top nav, large search affordance, network/status controls, latest receipts, and receipt detail pages. The app can link to explorer receipts, but the explorer should not feel trapped inside the app.

## Screen-to-Reality Matrix

| Surface | Current redesign | Reality correction |
| --- | --- | --- |
| Dashboard | Shows operational overview and global mode pills. | Keep overview, but replace global `Simulated/Local/Live Testnet` with a network/proof status model centered on `Testnet` and `Mainnet`. |
| Source Import | Imports API/OpenAPI/MCP/manual source. | Keep. Make the next step explicit: discovered tools must be selected before pricing. |
| Tool Pricing & Publish | Pricing exists as its own screen with configure buttons. | Rename/reframe as `Tools & Pricing`. Start from selected source and selected tool. Pricing is a property of a tool, not a standalone activity. |
| Hosted Endpoint | Shows hosted MCP/x402 endpoint and client auth. | Keep, but separate endpoint liveness from payment settlement. Endpoint being live does not mean Casper settlement is live. |
| Wallet Control Plane | Wallet profiles and policy controls exist. | Keep. This should be the authoritative place for wallet allowlists, spend caps, network, signing mode, and approval rules. |
| Demo Agent Sandbox | Lets user run a scenario and inspect matching receipt. | Rename and rebuild mental model. This should be a `Paid Tool Test Console` or `x402 Tool Call Tester`, not a fake-sounding sandbox. |
| Casper x402 Explorer | Receipt table/modal exists inside the gated dashboard/sidebar shell. | Move to a public explorer experience outside `/app`. Remove fake proof. Receipt state must clearly distinguish `Paid on Testnet`, `Policy blocked`, `Payment failed`, `Proof pending`, and `No transaction`. |
| Discovery / Registry | Shows published tools and an operator allowlist panel. | Keep registry as discovery. Move allowlist source of truth to wallet policy; registry can only add/copy into that policy. |
| Settings & Audit | Shows runtime modes, credentials, facilitator, signing, audit. | Remove runtime simulation as product framing. Keep credential boundaries and audit logs. Add Testnet/Mainnet network settings and disabled Mainnet guardrails if needed. |

## Integration Inventory

| Integration area | MVP expectation | Design implication |
| --- | --- | --- |
| Provider source import | Real source metadata can be defined/imported. OpenAPI/MCP discovery may start with a constrained path. | UI must show source, discovered tools, selected tools, and unsupported tools separately. |
| Upstream credentials | Server-side only. Never exposed in client config, receipt, registry, or browser state. | Credential copy must say "stored server-side" and never show secret-like values. |
| MCP/client auth | Separate from provider upstream auth and wallet/payment auth. Scoped bearer token can be MVP, OAuth-ready architecture can be shown. | Endpoint screen should label client access auth separately from payment auth. |
| x402 payment | Judged path should be real Casper Testnet if feasible. | Primary proof path should be Testnet. Do not make simulation the main mode. |
| Wallet policy | Real policy decisions must be enforced before payment attempt. | UI should show policy evaluation before payment. Blocks should produce no Casper transaction. |
| Casper proof | Only real deploy/transaction hash can be called live settlement proof. | No fake hash, fake CSPR.live link, or `Settled` badge in fixture/demo state. |
| Public explorer | Public payment/proof inspection without wallet connection. | Public route, no app sidebar, no login wall, no private payload/secret leakage. |
| Registry | Discovery and config handoff. | Registry should not own wallet policy. |
| Paid-call tester | Real or testnet call runner for a selected/pasted endpoint. | The surface should feel like an integration tester, not a scripted demo. |

## Mocked Prototype Surface Register

| Prototype behavior | Current risk | Decision |
| --- | --- | --- |
| Global `Simulated` mode | Makes the product look like a simulation-first demo and weakens hackathon proof. | `OUT_OF_SCOPE` for user-facing product design. If fixtures are needed, label as internal design/development fixture only. |
| Global `Local` mode | Confuses users because Abu's product framing is Testnet/Mainnet, not local chain/facilitator mode. | `OUT_OF_SCOPE` for primary UI. If local dev exists, keep it out of the judged product surface. |
| `Live Testnet` as one of three modes | Makes real Testnet feel optional beside fake modes. | Replace with network selector/status: `Testnet` primary, `Mainnet` disabled or guarded until approved. |
| `SETTLED` receipt while facilitator says simulated | Contradiction. Judges will read this as fake settlement. | `BLOCKED` until receipt vocabulary is corrected. |
| Fake deploy hash/link in non-live state | Looks like claimed chain proof without real proof. | `OUT_OF_SCOPE`. Never show fake proof as a receipt value. |
| Explorer inside gated app shell | Makes the explorer feel like a private dashboard report instead of public proof infrastructure. | `BLOCKED` until explorer is moved to a public route/layout. |
| Demo scenario runner | Useful for showing flow, but "sandbox" implies fake. | `REAL_MVP` if reframed as paid-call tester with real selected/pasted endpoint and real wallet/policy path. |
| Registry-side allowlist panel | Duplicates wallet policy mental model. | `REAL_MVP` only as a preview/action into wallet policy, not as separate source of truth. |
| Pricing screen without obvious selected tool | Causes "what am I pricing?" confusion. | `BLOCKED` until pricing is tied to source/tool selection. |

## No-Shipping-Mock Decisions

- `REAL_MVP`: provider source/tool selection, tool pricing, endpoint publishing, client auth model, wallet profile, spend policy, paid-tool tester, receipt explorer, registry discovery, audit log.
- `REAL_MVP`: public explorer routes that allow anyone to search and inspect public receipt/proof metadata without signing in.
- `REAL_MVP`: Casper Testnet proof for the judged payment loop if credentials/funding/tooling allow it.
- `REAL_LATER`: Mainnet payment execution, production custody, full OAuth flow, full chain-wide explorer, broad third-party registry moderation.
- `SIMULATED_DEMO_ONLY`: design fixtures and fake data used only to explain empty states or disconnected offline prototypes. These must not appear as product modes or proof claims.
- `OUT_OF_SCOPE`: user-facing `Simulated` and `Local` runtime modes as primary product controls.
- `BLOCKED`: any receipt or explorer state that claims `Settled` without a real Casper Testnet/Mainnet transaction/deploy hash.

## Required UX Corrections

### 1. Replace Runtime Modes With Network/Proof Status

Current redesign has `Simulated`, `Local`, and `Live Testnet` in the top bar and settings. This came from an earlier spec/brief direction, but Abu's latest feedback reopens that decision.

Recommended correction:

- Top bar should show `Network: Testnet` by default.
- `Mainnet` can appear as disabled, gated, or "coming later" if we want the future path visible.
- Do not show `Simulated` or `Local` as product modes.
- If a prototype fixture is needed, use a small non-product watermark such as `Design fixture` in the design file only. Do not put it in the product navigation.
- Receipt proof status should come from actual transaction state, not the global mode.

### 2. Rename And Reframe The Sandbox

The current `Demo Agent Sandbox` should not feel like a scripted mock.

Recommended names:

- `Paid Tool Test Console`
- `x402 Tool Call Tester`
- `Agent Tool Runner`
- `Gateway Test Console`

Recommended behavior:

1. User selects one of their published tools, or pastes an external MCP/x402 endpoint URL.
2. The console discovers tools/payment requirements when possible.
3. User selects a tool and enters input.
4. User chooses wallet and policy.
5. The system evaluates policy.
6. If allowed, the user signs/pays on Casper Testnet.
7. The tool result and receipt are shown.
8. Blocked or failed calls produce a receipt/audit event with no fake Casper proof.

### 3. Make Pricing Tool-First

Current pricing is too easy to read as "configure pricing in abstract."

Recommended correction:

- Rename `Tool Pricing & Publish` to `Tools & Pricing`.
- Top of screen should show selected provider/source.
- First action should be `Select tools to expose`.
- Only after a tool is selected should pricing controls appear.
- Each tool row/card should show route/name, input schema summary, upstream auth requirement, MCP exposure status, x402 price, publish status, and registry visibility.
- The publish button should say what is being published: `Publish priced tool`, `Update endpoint`, or `Publish to registry`.

### 4. Make Registry Discovery, Not Wallet Policy

Registry should answer: "What paid tools exist and how do I connect to them?"

Wallet policy should answer: "What can this wallet/agent spend on?"

Recommended correction:

- Registry actions: `View tool`, `Copy MCP config`, `Test call`, `Add to wallet policy`.
- If the user clicks `Add to wallet policy`, ask/select the target wallet/policy and then show it inside Wallet Control Plane.
- Remove or de-emphasize any registry-side allowlist panel that looks like a separate settings source.

### 5. Keep Explorer, But Tighten Proof Language

The explorer is valuable, but the receipt modal must be stricter.

The explorer must also be public. It should not sit inside the authenticated dashboard sidebar and should not require wallet connection. A judge, provider customer, or random ecosystem user should be able to open the explorer URL and inspect a receipt directly.

Recommended receipt layers:

- Gateway context: provider, tool, endpoint, client/app, request id, timestamp.
- Policy decision: wallet, policy, allowed/blocked, spend cap checked, reason.
- x402 context: payment requirement, asset, amount, payee, facilitator, verify/settle status.
- Casper proof: network, deploy/transaction hash, block/era if available, explorer link.

Allowed status examples:

- `Paid on Testnet`
- `Mainnet paid`
- `Policy blocked`
- `Payment failed`
- `Proof pending`
- `No Casper transaction`

Avoid these unless backed by real proof:

- `Settled`
- `Live`
- `Verified`
- `CSPR.cloud settled`
- Any fake deploy hash or fake explorer URL

Public explorer privacy rules:

- Show public receipt id, provider display name, tool id/name, network, asset, amount, payer/payee public addresses, x402 status, Casper proof, timestamp, and gateway status.
- Redact or omit private request inputs, private tool outputs, provider upstream credentials, internal API keys, MCP client tokens, and user-only policy configuration.
- If the UI shows request/result summaries, label them as provider-approved public metadata.

## Proposed Information Architecture

The current nine surfaces can stay, but they should be grouped so the workflow is obvious.

Public:

- Landing page
- Casper x402 Explorer
- Public receipt detail

Provider app:

- Sources
- Tools & Pricing
- Hosted Endpoint

Operator app:

- Wallets & Policies
- Tool Registry

Run & Prove app:

- Paid Tool Test Console

System:

- Settings
- Audit

This grouping reduces the "everything is a separate product" feeling and makes the flow easier to understand.

## Screen-Level Feedback

### Operations Dashboard

Keep it inside `/app`, but make it a workflow dashboard. It should show:

- Provider setup progress.
- Published tools count.
- Wallets and policies ready.
- Testnet proof status.
- Recent paid calls and blocked calls.
- Next action: import source, price tool, configure wallet, run test call, inspect receipt.

### Source Import

Keep source import broad, but do not imply every source type is equally implemented.

Show:

- Source type: OpenAPI, MCP server, manual route.
- Connection/auth status.
- Tool discovery result.
- Unsupported routes/tools.
- Next action: select tools to expose.

### Tools & Pricing

This is a critical correction.

The screen should lead with the selected source and discovered tools. Pricing controls should live inside selected tool detail. The user should never wonder "pricing for what?"

### Hosted Endpoint

This screen should answer:

- What URL do agents/MCP clients call?
- What client auth is required?
- What payment requirements are advertised?
- Which tools are published?
- Which network is payment proof expected on?

It must not expose upstream provider credentials.

### Wallets & Policies

This should own:

- Casper account/wallet identity.
- Network.
- Funding/test balance state.
- Signing mode.
- Spend caps.
- Allowed providers/tools.
- Manual approval settings.
- Audit trail.

This is where custom settings belong.

### Paid Tool Test Console

This replaces or renames the sandbox.

It should support two paths:

- Test one of my published tools.
- Test an external MCP/x402 endpoint by URL.

It should be the judge-friendly proof flow.

### Receipt Explorer

Keep as a dedicated public surface. It should make proof boundaries impossible to confuse.

It should not:

- Use the authenticated app sidebar.
- Require wallet connection.
- Require account creation.
- Hide receipt detail behind provider/operator login.

It should:

- Have a public top navigation.
- Lead with a large search input for receipt id, deploy hash, wallet address, provider, or tool.
- Show latest public receipts and network status.
- Link back to `/app` only for actions that require ownership, such as managing a provider or wallet.

Filters should include:

- Network.
- Wallet.
- Provider.
- Tool.
- Status.
- Date.

### Registry

Keep only if it is discovery.

It should show:

- Public paid tools.
- Price.
- Network.
- Auth requirements.
- Provider.
- Endpoint/config snippet.
- Add to selected wallet policy.
- Test call.

It should not show a separate allowlist that competes with wallet policy.

### Settings And Audit

Keep:

- Credential boundaries.
- Client auth model.
- Facilitator config.
- Signing mode config.
- Audit events.

Remove or demote:

- User-facing `Simulated` and `Local` runtime modes.

## Spec Deltas

These are proposed deltas, not accepted edits yet.

- Reopen any requirement that names global `Simulated`, `Local`, and `Live Testnet` as product modes.
- Replace with a network/proof model: `Testnet` primary, `Mainnet` later/gated.
- Add a requirement that non-real fixtures must not appear as settlement/proof claims.
- Rename `Demo Agent Sandbox` requirement to `Paid Tool Test Console` or equivalent.
- Add support for testing an external MCP/x402 endpoint URL, if feasible for MVP.
- Add public explorer route requirements: `/explorer` and public receipt detail pages are unauthenticated.
- Add public explorer privacy rules so no credentials, raw prompts, private payloads, or private outputs leak.
- Clarify that registry discovery and wallet allowlist management are separate.
- Clarify that pricing is downstream of source/tool selection.

## Story Deltas

These are proposed deltas, not accepted edits yet.

- Update the paid-call tester story so the user can select a published tool or paste an endpoint URL.
- Update receipt stories so blocked/failed calls explicitly produce no Casper transaction proof.
- Add a public viewer story: anyone can open `/explorer`, search by receipt/deploy hash/wallet/provider/tool, and inspect public proof without signing in.
- Add a privacy story: private request/result data is redacted from public explorer views unless explicitly marked public.
- Update registry stories so `Add to allowlist` targets a selected wallet policy.
- Update pricing story so the happy path begins with selecting a discovered tool.
- Add a story for Testnet proof readiness and Mainnet disabled/gated behavior.

## Quality Profile Deltas

These are proposed deltas, not accepted edits yet.

- Add a hard quality gate: no fake deploy hash or fake Casper explorer link in user-facing proof UI.
- Add a hard quality gate: user-facing mode labels must not imply simulated settlement as a product path.
- Add a UX gate: pricing cannot be reviewed unless tool/source context is visible.
- Add a UX gate: registry cannot own wallet allowlist state.
- Add a UX gate: explorer cannot be designed as a gated dashboard/sidebar page.
- Add a privacy gate: public explorer must redact secrets, tokens, upstream credentials, private request payloads, and private tool outputs.
- Add a proof gate: any claim of settled/live/verified must cite an actual Casper Testnet/Mainnet transaction/deploy hash.

## Plan Prerequisites

Do not move to implementation planning until Abu accepts or rejects these corrections:

1. Replace global `Simulated/Local/Live Testnet` with `Testnet/Mainnet` network/proof framing.
2. Rename/reframe `Demo Agent Sandbox` into a real paid-tool test console.
3. Make pricing explicitly tool-first.
4. Define registry as discovery and wallet policy as allowlist source of truth.
5. Tighten receipt/explorer proof vocabulary.
6. Move explorer to a public route/layout outside the authenticated app shell.

## Blockers And Open Questions

- Should Mainnet be visible as disabled/gated, or hidden entirely for the hackathon MVP?
- Should the paid-tool tester support external endpoint URL testing in MVP, or only accepted as a near-MVP extension?
- Which exact name should replace `Demo Agent Sandbox`?
- Should registry be a full top-level surface, or a tab/action inside Wallets & Policies plus Endpoint discovery?
- Should the public landing page include a public tool catalogue preview, or should public discovery be limited to the explorer for now?
- Does Abu want the design to show a development fixture label anywhere, or should all fixture language stay out of the submitted prototype?

## Planning Gate Decision

Planning is blocked for the full product design until the design agent revises the prototype around the product truth above.

A smaller planning slice is allowed only after the revised design clearly shows:

- Provider source -> tool selection -> pricing -> endpoint.
- Wallet -> policy -> allowlist.
- Paid tool tester -> policy check -> x402 payment -> receipt.
- Public explorer -> gateway context, x402 context, Casper proof without login.
- Testnet/Mainnet framing without user-facing simulation/local proof claims.

## Evidence

The redesigned prototype includes these useful improvements:

- Updated Casper-flavored visual language.
- Distinct provider, wallet, test, explorer, registry, and settings surfaces.
- Matching receipt links for settled, blocked, and failed test scenarios.
- Credential boundary copy in settings.
- Registry actions that can feed wallet policy.

The redesigned prototype still includes these critical issues:

- Global `Simulated`, `Local`, `Live Testnet` mode selector.
- Explorer placed inside the gated app/sidebar shell instead of a public explorer layout.
- Receipt modal that can show `SETTLED` while the x402 facilitator is labeled simulated.
- Fake or placeholder raw proof values in non-live states.
- Pricing surface that does not strongly anchor pricing to selected source/tool.
- Registry allowlist UI that can look like a second source of truth beside wallet policy.
- Sandbox naming that makes the judged paid-call path feel like a fake demo.
