# Prompt For Claude Code: Independent Casper GW Prototype Design Review

Copy this into Claude Code from the project root:

```text
You are reviewing the Casper GW / Casper Agent Commerce Gateway prototype for Abu.

Your job is to independently research, audit, and design-review the latest prototype. Do not implement anything yet. Do not assume Codex's prior conclusions are correct. Use prior notes as evidence to test, not instructions to blindly obey.

Current project root:
/Users/abu/dev/hackathon/casper-agentic

Current prototype to review:
/Users/abu/Downloads/Casper docs UI redesign feedback(1)/Casper Gateway.dc.html
/Users/abu/Downloads/Casper docs UI redesign feedback(1)/support.js

Comparison artifact:
/Users/abu/Downloads/Casper docs UI redesign feedback(1)/Casper Gateway v1 (pre-audit).dc.html

Screenshot artifact:
/Users/abu/Downloads/Casper docs UI redesign feedback(1)/screenshots/modal.png

Important: the screenshot may be stale. Inspect it, but if it conflicts with the current HTML/source behavior, flag the mismatch and treat the current source/interactive prototype as stronger evidence.

Read these first:
/Users/abu/dev/hackathon/casper-agentic/AGENTS.md
/Users/abu/dev/hackathon/casper-agentic/CLAUDE.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/handoffs/2026-06-22-claude-code-design-review-brief.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/source-index.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-product-context.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-thesis.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/x402-ai-agent-winner-patterns.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/cspr-trade-mcp-and-x402.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-agent-commerce-gateway-reality.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-mcp-gateway-auth-reality.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/research/2026-06-18-casper-x402-explorer-reality.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/api-mcp-x402-wallet-gateway-2026-06-18.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/external-x402-agent-winner-landscape-2026-06-18.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/raw/stellar-agents-winners-2026-06-18.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-discovery/2026-06-18-casper-agent-commerce-gateway.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-reintegration/2026-06-21-casper-gw-redesign-v2-audit.md
/Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-21-casper-gw-redesign-v2-correction-prompt.md

Research rule:
Start with local `.thoughts` context and local cloned/reference material. Do not browse broadly for MCP Pay, x402, Casper GW product direction, wallet policy, explorer patterns, or prior reference projects until local context has been checked. If local context is insufficient, state exactly what you checked and what gap remains before using web research. Use Context7 only for current SDK/API/library/CLI documentation, not for product decisions.

What Casper GW is supposed to be:
Casper GW is a Casper-native agent commerce gateway. It should connect:
1. Provider Gateway: bring an API/OpenAPI/manual route/remote MCP server, configure upstream auth, discover/select tools, price tools, and publish a hosted MCP/x402 endpoint.
2. Agent Wallet Control Plane: connect/create Casper agent wallets, fund them, set spend policy, and let agents pay safely.
3. Paid Tool Test Console: select or paste an MCP/x402 endpoint URL, discover tools, render inputs only if the tool needs inputs, choose wallet/policy, run the paid call, and produce a receipt.
4. Public Casper x402 Explorer: public unauthenticated receipt/proof search and detail pages.
5. Receipt/Proof Layer: separate gateway context, policy decision, x402 verify/settle, and Casper proof.

Core constraints:
- The prototype is evidence, not accepted product truth.
- Do not implement.
- Do not plan implementation yet.
- Do not invent private tools, private registries, hidden registries, or generic send-policy scope unless accepted local evidence requires them.
- Public explorer must be public: no sign-in, no wallet connection, no app sidebar.
- Authenticated `/app` is for provider setup, tool pricing/publishing, hosted endpoint, wallet policies, paid-tool testing, settings, and audit.
- Keep provider upstream credentials, MCP client access auth, and x402 wallet/payment authorization separate.
- Keep receipt layers separate: gateway context, policy decision, x402 verify/settle, and Casper proof.
- Do not claim live Casper settlement unless a real Casper transaction/deploy hash exists.
- Do not present simulated/local modes as product paths.

Use a workflow or subagents if available. Suggested roles:
1. Product mapper: reconstruct the accepted product from `.thoughts`.
2. Prototype mapper: inventory current screens, states, routes, data, and interactions from the HTML/support files.
3. Reference researcher: inspect local reference reports/repos for MCP Pay/x402/Cards402/TollPay/CSPR.live/Casper Wallet/testnet funding/explorer patterns.
4. Skeptic reviewer: find unsupported concepts, stale mocks, fake proof, auth/privacy/security gaps, and implementation blockers.
5. Designer reviewer: judge whether the UI feels premium, credible, and coherent enough for a hackathon judge and a real infrastructure product.

Main review questions:
1. Did the latest prototype actually fix the prior public explorer, registry/private-tool, test console, and Testnet/Mainnet issues?
2. Is there any remaining stale registry/private-tool concept in source, copy, data models, or UX?
3. Does the app flow make sense from first principles: Sources -> My Tools -> Hosted Endpoint -> Wallets & Policies -> Paid Tool Test Console -> Public Explorer?
4. Does wallet funding/deposit/readiness feel realistic? Check local Casper/CSPR.live/Casper Wallet/testnet faucet references and any Cards402/TollPay/agent-wallet notes before recommending changes.
5. Does the paid tool console behave like an MCP/x402 endpoint runner rather than a fake form?
6. Does the explorer feel like a normal public explorer, not a gated dashboard page?
7. Does the visual design feel premium, serious, dense enough, and coherent, or does it still feel like a generated mock?
8. Which prototype behaviors are real MVP requirements, later requirements, demo-only states, out of scope, or blockers?

Classify important prototype surfaces with:
- REAL_MVP
- REAL_LATER
- SIMULATED_DEMO_ONLY
- OUT_OF_SCOPE
- BLOCKED

Output one report with:
1. Executive verdict: accept, accept with fixes, or reject for another design pass.
2. Evidence checked: exact files and local references.
3. What the prototype gets right.
4. Blocking issues.
5. Screen-by-screen audit.
6. Wallet/funding/deposit audit.
7. Paid Tool Test Console audit.
8. Public Explorer/receipt audit.
9. Auth/privacy/proof-boundary audit.
10. Visual design quality audit.
11. Real-integration classification table.
12. Spec/story/designer-brief deltas.
13. Designer correction prompt if another design pass is needed.

Separate findings into:
- Must fix before implementation planning.
- Should improve before build.
- Nice later.

For each important claim, cite evidence by file path and line number or visible UI text when possible.
```
