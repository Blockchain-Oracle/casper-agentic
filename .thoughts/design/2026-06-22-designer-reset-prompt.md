# Prompt: Fresh Casper GW Designer Pass

Use this prompt for a fresh designer/prototype agent.

```text
You are designing a high-fidelity prototype for Casper GW / Casper Agent Commerce Gateway.

This is design work only. Do not implement production backend, database, auth, wallet, payment, MCP, x402, or smart-contract integrations.

Start from the current context, not from older prototype assumptions. Read these files first:

1. /Users/abu/dev/hackathon/casper-agentic/.thoughts/README.md
2. /Users/abu/dev/hackathon/casper-agentic/.thoughts/wiki/agent-commerce-gateway-current-truth.md
3. /Users/abu/dev/hackathon/casper-agentic/.thoughts/specs/2026-06-22-casper-gw-current-spec.md
4. /Users/abu/dev/hackathon/casper-agentic/.thoughts/stories/2026-06-22-casper-gw-current-stories.md
5. /Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-22-designer-reset-brief.md
6. /Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-22-design-direction-and-structure.md
7. /Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-22-claude-code-design-review.md
8. /Users/abu/dev/hackathon/casper-agentic/.thoughts/design/2026-06-22-review-screenshots/
9. /Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md

Product summary:
Casper GW is a Casper-native agent commerce gateway. It combines a provider gateway for paid API/MCP tools, an agent wallet control plane with funding and spend policy, an endpoint-first paid tool console, and a public Casper x402 receipt explorer.

The differentiator:
Every paid tool attempt produces a receipt that separates gateway context, policy decision, x402 verify/settle context, and Casper proof. Public users can inspect the proof without signing in.

Hard product rules:
- Public explorer is public. No sign-in, wallet connection, or authenticated app sidebar.
- Authenticated app should use top-header navigation, not a persistent sidebar.
- Wallet/funding/policy should be a tabbed modal.
- Fund wallet should be a drawer or stepper with connect/provision, receive address, faucet/transfer, confirming, ready, and failure states.
- Add source should be a modal wizard.
- Price/publish should be a per-tool drawer.
- Settings should be tabbed.
- Paid Tool Test Console must be endpoint-first: hosted endpoint or pasted MCP/x402 URL -> discover tools -> select tool -> schema inputs or no-input state -> wallet/policy -> policy pre-check -> sign/pay/settle -> result -> receipt.
- Receipt detail must show four layers: gateway context, policy decision, x402 verify/settle, Casper proof.
- Wallet readiness must distinguish CSPR gas, CEP-18 payment asset, allowance/spend headroom, and readiness verdict.
- Spend policy runs before signing/payment. A policy block creates no Casper transaction.

Do not design:
- top-level registry or marketplace,
- private/public tool labels,
- generic send policy,
- generic sandbox,
- Simulated/Local product modes,
- fake proof,
- Mainnet support,
- private-key/seed-phrase collection.

Mocking rules:
- You may use mocked data in the prototype.
- Label mocked payment/proof states as fixture/sample at the point of use.
- Never show a fake deploy hash as if it is real.
- Never expose provider upstream credentials, MCP client tokens, private inputs/outputs, or internal policy config on public receipt views.

Required screens/surfaces:
1. Public landing.
2. Public explorer with vitality stats and filters.
3. Public receipt detail with four proof layers.
4. Authenticated dashboard.
5. Sources page plus Add Source wizard.
6. My Tools page plus per-tool pricing/publish drawer.
7. Hosted Endpoint page with client config.
8. Wallet/Funding/Policies modal.
9. Paid Tool Test Console.
10. Settings tabs.
11. Audit log.

Design quality:
Make this feel like serious infrastructure software, not a generic AI-generated SaaS mock. Use product-specific tables, logs, proof links, status states, and focused workflows. Avoid a wall of same-weight cards and decorative effects without product meaning.

Deliver:
- revised high-fidelity prototype,
- screen map,
- key interaction/state list,
- notes on mocked surfaces,
- list of any open questions or product conflicts you found.
```
