# Prototype Reintegration Audit V2: Casper GW Current Redesign

Date: 2026-06-21
Prototype inspected: `/Users/abu/Downloads/Casper docs UI redesign feedback (1)/Casper Gateway.dc.html`
Status: design audit for Abu review

## Verdict

The current prototype fixed several important earlier problems: it has a public explorer, removes the old user-facing `Simulated/Local/Live Testnet` mode rail from the source file, and frames the app around Testnet with Mainnet gated.

The prototype is still not ready to hand to implementation because it invents product structure around `Tool Registry`, `public/private tools`, and a generic `tool input` box that does not match the MCP/x402 tool-runner pattern Abu described.

The biggest correction is this:

- The MVP does not need a top-level `Tool Registry`.
- The MVP should not support or display `private tools`.
- The app should have `My Tools` and `Published Endpoint`, not a registry/private visibility model.
- The paid tool test console should be the place where a user provides or selects an MCP/x402 endpoint URL, discovers tools, selects a tool, sees generated inputs only if the tool needs them, chooses wallet/policy, runs the call, and gets a receipt.

Planning remains blocked until these deltas are accepted.

## Inputs Checked

- `/Users/abu/Downloads/Casper docs UI redesign feedback (1)/Casper Gateway.dc.html`
- `/Users/abu/Downloads/Casper docs UI redesign feedback (1)/screenshots/modal.png`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-product-context.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-thesis.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/x402-ai-agent-winner-patterns.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/cspr-trade-mcp-and-x402.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/api-mcp-x402-wallet-gateway-2026-06-18.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-agent-commerce-gateway-reality.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-mcp-gateway-auth-reality.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/specs/2026-06-18-agent-commerce-gateway.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/stories/2026-06-18-agent-commerce-gateway.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-reintegration/2026-06-21-casper-gw-redesign-audit.md`

OneMem was attempted, but the workspace memory backend is not configured. This audit uses local project artifacts only.

## Product Truth

Casper GW is not primarily a public marketplace.

Casper GW is a Casper-native agent commerce gateway:

1. A provider connects an API, OpenAPI spec, manual route, or remote MCP server.
2. The gateway discovers tools.
3. The provider selects tools to expose.
4. The provider prices selected tools for x402.
5. The provider publishes a hosted MCP/x402 endpoint.
6. An operator connects/funds a Casper agent wallet.
7. The operator sets spend policy for paid tool calls.
8. A paid tool runner calls a selected or pasted MCP/x402 endpoint.
9. The gateway enforces policy before signing/payment.
10. Casper x402 settlement happens on Testnet.
11. The public explorer shows receipts and Casper proof.

## Direct Answers To Abu's Questions

### Was Registry Supposed To Exist?

Not as a required top-level MVP surface.

Earlier `.thoughts/specs` and `.thoughts/stories` do contain `Discovery / Registry`, `public tools`, and `private tools` requirements. That is now stale design/spec drift caused by earlier prototype direction.

The current product does not need a separate `Tool Registry` page to prove the core hackathon loop. If a discovery surface exists later, it should be optional and clearly secondary.

Recommended MVP decision:

- Remove top-level `Tool Registry` from the authenticated app.
- Do not design a registry/private-tool model.
- Put provider-owned tools under `My Tools`.
- Put public proof under `/explorer`.
- Put endpoint discovery and tool calling under `Paid Tool Test Console`.

### Do We Have Private Tools?

No, not as an accepted product concept.

The prototype uses:

- `registry: true/false`
- `public registry`
- `private`
- `private tools hidden`

That is the wrong mental model.

Accepted language should be:

- `Draft`: discovered but not selected/published.
- `Selected`: chosen to expose.
- `Priced`: has x402 price.
- `Published`: available on the hosted MCP/x402 endpoint.
- `Unpublished`: not available on endpoint.

Do not use:

- `Private tool`
- `Private registry`
- `Private tools hidden`
- `List in public registry`

If a tool requires scoped MCP client auth, call that `client access required`, not `private tool`.

### What Should Replace Registry?

Two surfaces cover the real need:

1. `My Tools`
   - Provider-owned tools discovered from source.
   - Selected tools.
   - Pricing.
   - Publish/unpublish to hosted endpoint.
   - Endpoint status.

2. `Paid Tool Test Console`
   - Select one of my published endpoints/tools, or paste an external MCP/x402 endpoint URL.
   - Discover available tools from that endpoint.
   - Show tool payment requirements.
   - Generate input controls from the selected tool schema only if inputs are required.
   - Choose wallet/policy.
   - Run call, pay/sign, show result, show receipt.

Optional later:

- `Public Tool Directory` or `Discover`
- Only if Abu explicitly accepts a public index/discovery product.
- It should not be part of MVP unless it strengthens the demo.

### Are We Doing Send Policy?

No, not as a separate product.

The accepted concept is `wallet spend policy` for paid tool calls. It is not a general-purpose wallet send/transfer policy.

MVP spend policy should mean:

- Max per tool call.
- Daily/session budget if useful.
- Allowed endpoint/tool/provider.
- Allowed network and asset.
- Manual approval before signing.
- Block before wallet signing if policy fails.

Do not design arbitrary token-send controls unless Abu explicitly adds that scope.

## Current Prototype: What It Gets Right

- Public landing and public explorer are now separated from `/app`.
- `/explorer` is public and unauthenticated.
- Receipt details redact private request inputs, private outputs, credentials, MCP tokens, and policy internals.
- Testnet/Mainnet framing is improved: Testnet primary, Mainnet gated/hidden.
- Source import supports OpenAPI, Remote MCP, and manual route.
- Tools & Pricing is more tool-first than the previous prototype.
- Endpoint separates client auth from x402 payment auth.
- Wallet policy states that policy blocks before signing and produces no Casper transaction.
- The app links receipts to the public explorer.

## Current Prototype: Blocking Issues

### 1. Top-Level Registry Is Wrong For MVP

The prototype has:

- App nav item: `Tool Registry`.
- Screen title: `Tool registry`.
- Copy: `Discover public paid tools and add them to a wallet policy.`
- Registry table with copy config, test call, add to wallet policy.

This makes the app look like a marketplace/directory product. That is not the core product Abu described.

Decision:

- `Tool Registry` should be removed from primary navigation for MVP.
- If a future discovery page remains, it must be explicitly optional/later.

### 2. Private/Public Tool Labels Are Invented

The prototype says:

- `private tools hidden`
- `public registry`
- `private`
- `List in public registry for discovery`

This invents a product model that has not been accepted.

Decision:

- Remove private/public registry visibility from MVP.
- Replace with publish status on provider tools:
  - `draft`
  - `selected`
  - `priced`
  - `published`
  - `unpublished`

### 3. `My Published Tool` Is Too Narrow

The test console has two target buttons:

- `My published tool`
- `External endpoint URL`

This is close, but still framed around a pre-existing internal list. The stronger pattern is endpoint-first:

1. Choose source:
   - `My endpoint`
   - `Paste MCP/x402 URL`
2. Resolve/discover endpoint.
3. Display tools from that endpoint.
4. Select tool.
5. Render input schema if needed.
6. Run through wallet/policy and x402 payment.

The console should not rely on registry data.

### 4. Tool Input Is Wrong

The prototype always shows a generic textarea:

```text
tool input
{ "pair": "CSPR/USD", "side": "buy" }
```

That does not match the MCP tool-call experience Abu described.

Correct behavior:

- Do not show input by default before a tool is selected.
- After tool discovery, inspect the selected tool's input schema.
- If the tool has no inputs, show `No input required`.
- If the tool has simple fields, render fields.
- If the tool has a JSON schema object, render schema-aware fields or a structured JSON editor.
- Keep raw JSON as an advanced option only.

Examples:

- `list_pairs` with schema `(none)` should have no input area.
- `get_cspr_quote` should ask for `pair` and `side`.
- `get_market_depth` should ask for `pair` and `depth`.

### 5. Wallet Policy Uses Registry Tools

The prototype builds wallet policy options from `registryTools`.

That is wrong if registry is removed.

Correct source:

- Wallet policy allowlist should come from:
  - discovered tools from a pasted endpoint,
  - tools on the provider's hosted endpoint,
  - manually added endpoint/tool identifiers.

Policy is about what the wallet can call, not what appears in a registry.

### 6. Screenshot Is Stale Evidence

The package screenshot still shows the older modal with:

- `Simulated`
- `Local`
- `Live Testnet`
- `SETTLED`
- `CSPR.cloud x402 · simulated`

The current source file is improved, but the screenshot is stale/mismatched. The design agent should not use that screenshot as truth.

## Corrected Information Architecture

Public:

- `/`
- `/explorer`
- `/explorer/receipts/:receiptId`

Authenticated app:

- `/app`
- `/app/sources`
- `/app/tools`
- `/app/endpoints`
- `/app/wallets`
- `/app/test-console`
- `/app/settings`
- `/app/audit`

Remove from MVP:

- `/app/registry`

Optional later only:

- `/discover`
- `/directory`
- `/tools/public`

## Correct App Surface Definitions

### `/app/sources`

Purpose: connect an upstream source and discover tools.

Contains:

- Source type: OpenAPI, Remote MCP, Manual route.
- Source URL/upload/route.
- Upstream auth method.
- Server-side credential boundary.
- Connect/discover action.
- Discovery result.
- Supported tools.
- Unsupported operations.
- Tool schema preview.

Does not contain:

- Pricing.
- Registry visibility.
- Wallet policy.
- Public/private labels.

### `/app/tools`

Purpose: manage provider-owned tools from connected sources.

Contains:

- `My Tools` list.
- Source context.
- Tool selection.
- Tool schema.
- x402 price per call.
- Publish/unpublish to hosted endpoint.
- Endpoint availability status.

Does not contain:

- Public registry toggles.
- Private/public tool labels.

### `/app/endpoints`

Purpose: show the hosted MCP/x402 endpoint.

Contains:

- Hosted endpoint URL.
- Client auth config.
- Copy config for clients.
- Payment auth/payment requirements.
- Published tools on this endpoint.
- Network/asset/facilitator.

Does not contain:

- Upstream secrets.
- Registry discovery.
- Wallet spend policy.

### `/app/wallets`

Purpose: agent wallet and spend policy control.

Contains:

- Casper wallet/account identity.
- Funding status.
- Signing mode.
- Network and asset.
- Max per call.
- Optional daily/session cap.
- Allowed endpoint/tool/provider.
- Manual approval before signing.
- Policy evaluation.
- Wallet activity.

Does not contain:

- General wallet send policy.
- Public registry state.
- Provider source configuration.

### `/app/test-console`

Purpose: endpoint/tool runner for MCP/x402 calls.

Contains:

- Target selector:
  - `My hosted endpoint`
  - `Paste MCP/x402 URL`
- Endpoint URL input.
- `Discover tools` action.
- Discovered tools list.
- Payment requirements per tool.
- Tool selection.
- Generated input controls from selected tool schema.
- `No input required` state for no-input tools.
- Wallet/policy selector.
- Policy pre-check.
- x402 sign/pay action.
- Tool result.
- Receipt link.

Does not contain:

- Scenario toggles as product controls.
- Registry dependency.
- Always-visible raw JSON input.

### `/app/settings`

Purpose: system settings.

Contains:

- Provider upstream credential vault references.
- MCP client access auth.
- OAuth/Bearer target configuration.
- x402 facilitator config.
- Network settings: Testnet primary, Mainnet gated/hidden.
- Signing/custody mode.
- Audit settings.

Does not contain:

- Tool pricing.
- Registry visibility.
- Wallet spend rules, except signing/custody defaults.

## Required Spec Deltas

These are proposed deltas, not accepted edits yet.

- Remove or reopen RQ-38, RQ-39, RQ-40, RQ-40A.
- Remove `private tools` from MVP requirements.
- Replace `Discovery / Registry` with `Endpoint Tool Discovery` in the test console.
- Replace `public registry visibility` with `published on hosted endpoint`.
- Replace `registry tool -> allowlist` with `discovered endpoint/tool -> wallet policy`.
- Clarify that broad registry/search is secondary after one complete real paid-tool loop.
- Add requirement: tool input UI is generated from the selected tool schema and hidden when no input is required.
- Add requirement: raw JSON input is advanced/debug mode only.

## Required Story Deltas

These are proposed deltas, not accepted edits yet.

- Remove Story 11 and Story 14 from MVP, or mark them `REAL_LATER`.
- Add a story: user pastes MCP/x402 endpoint URL, discovers tools, selects a tool, and sees payment requirements.
- Add a story: no-input tool shows no input form and can be called directly after wallet/policy selection.
- Add a story: schema-input tool renders fields from schema.
- Add a story: wallet policy allowlist can be built from a discovered endpoint/tool, not from registry.
- Add a story: provider sees `My Tools` with draft/selected/priced/published status.

## Required Designer Corrections

1. Remove `Tool Registry` from primary app navigation.
2. Remove `private tools hidden`.
3. Remove `public registry` and `private` chips from provider tools.
4. Remove `List in public registry for discovery`.
5. Rename or reframe the provider tool list as `My Tools`.
6. Make `Published tools` live under endpoint and tools pages.
7. Make `Paid Tool Test Console` endpoint-first and discovery-first.
8. Add a real `Discover tools` step after endpoint URL entry.
9. Show discovered tools before showing input fields.
10. Generate inputs from tool schema; no-input tools show `No input required`.
11. Wallet policy should select allowed endpoints/tools, not registry tools.
12. Keep the public explorer exactly as a public proof surface, but ignore the stale screenshot.

## Planning Gate Decision

Do not implement from this prototype as-is.

Implementation planning is allowed only after the prototype or accepted design notes remove:

- top-level registry as MVP,
- private/public tool labels,
- registry-derived wallet policy,
- always-on generic tool input,
- scenario toggles as product-facing controls.

The smallest correct MVP loop is:

`source -> my tools -> price -> endpoint -> wallet policy -> test console endpoint discovery -> call/pay -> receipt -> public explorer`

