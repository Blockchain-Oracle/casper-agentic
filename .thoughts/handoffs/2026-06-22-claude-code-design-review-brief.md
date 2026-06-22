# Claude Code Design Review Brief: Casper GW Current Prototype

Date: 2026-06-22
Status: handoff brief for independent Claude Code review
Owner: Abu

## Purpose

Ask Claude Code to independently audit the latest Casper GW prototype from product, UX, design, and integration-reality perspectives before this project moves into build planning.

This is not an implementation task. The prototype remains design evidence, not accepted product truth.

Claude Code should research from the local project context, inspect the current prototype, compare it against the intended product, and return a rigorous review with concrete designer-facing feedback.

## Current Prototype To Review

Primary prototype:

- `/Users/abu/Downloads/Casper docs UI redesign feedback(1)/Casper Gateway.dc.html`
- `/Users/abu/Downloads/Casper docs UI redesign feedback(1)/support.js`

Comparison artifact:

- `/Users/abu/Downloads/Casper docs UI redesign feedback(1)/Casper Gateway v1 (pre-audit).dc.html`

Screenshot artifact:

- `/Users/abu/Downloads/Casper docs UI redesign feedback(1)/screenshots/modal.png`

Important: the screenshot may be stale. It still appears to show older simulated/local/live-Testnet framing. Claude Code should inspect it, but source and current interactive behavior should be treated as stronger evidence when there is a conflict.

## Local Research Source Order

Claude Code should inspect local project context before broad web research.

Required local sources:

- `/Users/abu/dev/hackathon/casper-agentic/AGENTS.md`
- `/Users/abu/dev/hackathon/casper-agentic/CLAUDE.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/source-index.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-product-context.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-thesis.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/x402-ai-agent-winner-patterns.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/cspr-trade-mcp-and-x402.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-agent-commerce-gateway-reality.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-mcp-gateway-auth-reality.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-casper-x402-explorer-reality.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/api-mcp-x402-wallet-gateway-2026-06-18.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/external-x402-agent-winner-landscape-2026-06-18.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/stellar-agents-winners-2026-06-18.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-discovery/2026-06-18-casper-agent-commerce-gateway.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-reintegration/2026-06-21-casper-gw-redesign-v2-audit.md`
- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-21-casper-gw-redesign-v2-correction-prompt.md`

If local context is insufficient for a claim, Claude Code should say what was checked and only then use web research for the specific missing gap. Context7 is for current library/API/SDK/CLI docs, not product-direction decisions.

## Product North Star To Verify

Casper GW is a Casper-native agent commerce gateway, not just a wallet, not just an MCP proxy, and not a generic marketplace.

The intended product connects five surfaces:

1. Provider Gateway: connect an API, OpenAPI spec, manual route, or existing MCP server; configure upstream auth; discover/select tools; set x402 pricing; publish a hosted MCP/x402 endpoint.
2. Agent Wallet Control Plane: connect or create Casper agent wallets, fund them, set spend policy, and allow agents to pay safely.
3. Paid Tool Test Console: select or paste an MCP/x402 endpoint URL, discover tools, render inputs only when needed, choose wallet/policy, run the paid call, and produce a receipt.
4. Public Casper x402 Explorer: public, unauthenticated receipt/proof surface with search and public receipt detail pages.
5. Receipt/Proof Layer: separate gateway context, wallet policy decision, x402 verify/settle context, and Casper proof.

The judged proof should be a real Casper Testnet settlement path when possible. The product must not claim live Casper settlement unless there is a real Casper transaction/deploy hash.

## What The Latest Prototype Appears To Have Fixed

Codex's quick read of the current HTML source found these improvements. Claude Code should verify independently:

- Public explorer is separated from the authenticated app context.
- `/explorer` and receipt detail are presented as public surfaces, not gated dashboard pages.
- The authenticated app screen set is now Dashboard, Sources, My Tools, Hosted Endpoint, Wallets & Policies, Paid Tool Test Console, Settings, and Audit.
- The top-level Tool Registry screen appears removed.
- The paid tool console is now endpoint-first and discovery-driven.
- Console inputs appear only after tool selection, with a `No input required` state for no-input tools.
- Testnet is the primary network framing; Mainnet appears gated/hidden.
- The app has clearer separation between provider upstream credentials, MCP client access auth, and x402 wallet/payment authorization.

These are observations only. They are not acceptance.

## Open Areas Claude Code Must Judge

### Product IA

- Does the landing, public explorer, and authenticated app route model feel coherent?
- Is the public explorer truly public infrastructure, or does any visual/app-shell language still make it feel gated?
- Does `/app` feel like serious operator software instead of a collection of disconnected demo panels?
- Is the flow obvious: Sources -> My Tools -> Hosted Endpoint -> Wallets & Policies -> Paid Tool Test Console -> Public Explorer?

### Registry And Discovery

- Confirm whether any stale registry/private-tool concept remains.
- Do not invent private tools, private registries, or hidden registries unless a local accepted artifact requires them.
- Treat "registry" as optional future discovery/catalog behavior, not the MVP source of truth.
- Wallet policy allowlists should come from hosted endpoint tools, discovered external endpoint tools, or explicit endpoint/tool entries.

### Wallet And Funding Reality

- Audit whether the wallet screen feels realistic enough for a Casper agent-wallet control plane.
- Check whether the product needs a clearer funding/deposit flow before a wallet can pay:
  - connect wallet,
  - view account/address,
  - copy address,
  - fund on Testnet/faucet/onramp as applicable,
  - wait for confirmation,
  - show token balance/allowance/readiness,
  - explain signing mode and custody limits.
- Compare this against local Casper docs and any local reference notes for Cards402, TollPay, agent wallets, CSPR.live, Casper Wallet, or testnet faucet flows.
- Do not prescribe a fake deposit simulation as a product path. If a prototype-only preview state exists, it must be labeled as design fixture only.

### Paid Tool Test Console

- Verify it behaves like an MCP/x402 endpoint runner:
  - choose hosted endpoint or paste URL,
  - discover tools,
  - show payment requirements,
  - select tool,
  - render schema-specific inputs only when needed,
  - choose wallet/policy,
  - run policy check before signing,
  - pay/sign through x402,
  - show result and receipt.
- Decide whether the current "Prototype preview state" buttons should be hidden, moved, or preserved as design-only controls.

### Explorer And Receipt Design

- The explorer should feel like a normal public explorer: public search, receipt table, receipt detail, proof status, deploy hash links, no sign-in or wallet connection requirement.
- Audit whether it looks premium enough for a hackathon demo and whether it resembles credible explorer/product infrastructure.
- Confirm public receipt detail redacts private inputs, outputs, upstream credentials, MCP client tokens, and wallet-policy internals.
- Check whether gateway context, policy decision, x402 verify/settle, and Casper proof are visually and conceptually separated.

### Visual Design Quality

- Judge whether the current UI feels like a 10x/premium infrastructure product or a static generated mock.
- Identify layout, typography, density, rhythm, hierarchy, table treatment, empty states, status chips, and navigation problems.
- Compare with relevant references from local reports before making recommendations.
- If external visual research is needed, state the local gap first and cite the outside references used.

### Integration Reality

- Mark every important prototype behavior as one of:
  - `REAL_MVP`
  - `REAL_LATER`
  - `SIMULATED_DEMO_ONLY`
  - `OUT_OF_SCOPE`
  - `BLOCKED`
- Do not allow hidden mocks to pass as product behavior.
- In particular, inspect payment proof, wallet funding, endpoint discovery, source import, MCP auth, provider upstream auth, receipt proof, and explorer search.

## Suggested Claude Code Workflow

If Claude Code has subagent/workflow support, use it. Recommended roles:

- Product mapper: reconstructs the intended product from `.thoughts` and identifies accepted/non-accepted concepts.
- Prototype mapper: inventories screens, states, routes, data objects, and interactions in the current HTML/support files.
- Reference researcher: checks local raw reports and cloned docs/repos for MCP Pay/x402/Cards402/TollPay/CSPR.live/Casper Wallet/reference UI patterns.
- Skeptic reviewer: finds stale mocks, invented product concepts, unsupported claims, auth/proof/security gaps, and implementation blockers.
- Designer reviewer: judges visual quality and proposes designer-facing corrections without overfitting to prior Codex conclusions.

The main Claude Code agent should reconcile these into one report. Subagents should not replace the final synthesis.

## Expected Output From Claude Code

Return one concise but rigorous report with:

1. Executive verdict: accept, accept with fixes, or reject for another design pass.
2. Evidence checked: exact files and local references.
3. What the current prototype gets right.
4. Blocking product/UX/reality issues.
5. Screen-by-screen audit.
6. Wallet/funding/deposit audit.
7. Paid tool console audit.
8. Public explorer/receipt audit.
9. Auth, privacy, and proof-boundary audit.
10. Visual design quality audit.
11. Real-integration classification table using the labels above.
12. Spec/story/designer-brief deltas.
13. Designer correction prompt, if another design pass is needed.

The report should separate:

- Must fix before implementation planning.
- Should improve before build.
- Nice later.

Every important finding should cite local evidence by file path and, when possible, line number or visible UI text.

## Non-Goals

- Do not scaffold or implement the app.
- Do not rewrite the prototype.
- Do not update spec/stories/plan unless Abu explicitly asks after the review.
- Do not turn old prototype data or screenshot-only behavior into accepted scope.
- Do not add marketplace/private-registry/send-policy concepts unless the review finds accepted local evidence for them.
