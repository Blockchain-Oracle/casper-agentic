# Prompt: Casper GW Designer Product-Flow Pass

Use this prompt with a designer/prototype agent.

```text
You are designing Casper GW / Casper Agent Commerce Gateway.

This is product and UX design work. Do not implement production backend, database, wallet, payment, MCP, x402, CSPR.cloud, or smart-contract integrations.

Do not use the current implementation UI as visual truth. It is an implementation scaffold and is known to be too clustered. You own the layout, visual direction, component choices, responsive behavior, and interaction model.

Read this file first:
<project-root>/.thoughts/design/2026-06-25-casper-gw-designer-product-flow-brief.md

Then read these supporting files:
<project-root>/.thoughts/README.md
<project-root>/.thoughts/wiki/agent-commerce-gateway-current-truth.md
<project-root>/.thoughts/specs/2026-06-22-casper-gw-current-spec.md
<project-root>/.thoughts/stories/2026-06-22-casper-gw-current-stories.md
<project-root>/.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md

Product summary:
Casper GW lets providers publish paid API/MCP tools, lets operators govern Casper wallets and spend policy, lets agents run paid x402 tool calls, and lets anyone inspect public Casper proof through an explorer.

Hard boundaries:
- /app is protected by wallet connection. If no wallet/operator connection exists, the app workspace is not visible.
- /explorer is public. It requires no sign-in, no wallet connection, and no authenticated app shell.
- The explorer can show Casper GW receipts and external CSPR.cloud proof. Only Casper GW receipts have gateway, policy, x402, and Casper proof layers.
- Provider upstream credentials, endpoint client access, and wallet/payment authorization are separate.
- Spend policy runs before wallet signing/payment.
- Policy blocks create no Casper transaction.
- Do not add registry/private-tool concepts, simulated/local product modes, fake proof, production custody claims, Mainnet claims, or generic token-send policy.
- Do not expose secrets, raw client tokens, provider credentials, private inputs/outputs, CSPR.cloud tokens, seed phrases, private keys, or internal policy config.

Design the connected product flows:
1. Public landing.
2. Public explorer search/feed/detail.
3. Protected /app wallet-connect gate.
4. Provider source creation and tool discovery.
5. Tool selection, pricing, and publishing.
6. Hosted endpoint and client access/connection details.
7. Wallet profile, readiness, funding, and policy.
8. Paid tool runner: endpoint -> discover tools -> select tool -> schema inputs or no-input state -> wallet/policy -> policy pre-check -> CSPR.click approval -> verify/settle -> receipt.
9. Public receipt/proof detail with four layers.
10. Settings and audit.

Required output:
- Route map and information architecture.
- Key screens and interactions.
- Required states for each flow.
- How public explorer and protected app differ.
- How wallet connection, wallet profile readiness, and spend policy relate.
- How receipt/proof layers are represented.
- Redaction and proof-honesty notes.
- Responsive design considerations.
- List of mocked data/integrations used in the prototype.
- Open questions or conflicts you discover.

You may choose the visual design and component patterns. Do not prescribe back-end implementation. If you mock proof/payment/wallet/MCP data, label it as sample/fixture in the prototype and list it in your handoff.
```
