# Designer Brief: Casper GW Clean Structure Pass

Date: 2026-06-22
Status: Design brief for a fresh high-fidelity prototype pass. Design is not approved yet.

## Purpose

Create a high-fidelity prototype for Casper GW that reflects the current product truth after reintegration. This is a structure and realism pass, not a broad visual redesign.

The designer should be able to start fresh from this brief without relying on old conversation context. The prototype should avoid the prior mistakes: top-level registry, private/public tool labels, simulated/local product modes, fake proof, generic demo sandbox, and wallet screens that skip funding.

## Prototype Scope

Design a polished, responsive product prototype covering:

- Public landing.
- Public explorer.
- Public receipt detail.
- Authenticated operator app.
- Provider source/tool/pricing/endpoint flow.
- Wallet/funding/policy flow.
- Paid Tool Test Console.
- Settings and audit.

The prototype may use mocked data. It must label mocked proof/payment states as fixtures and must not imply live Casper settlement unless a real deploy hash exists.

Do not implement production database, auth, wallet, payment, API, MCP, or smart-contract integrations in the design prototype.

## Product Context

Casper GW is a Casper-native agent commerce gateway.

It combines:

- Provider Gateway: connect an API/OpenAPI/manual route/remote MCP server, discover tools, price selected tools, and publish a hosted MCP/x402 endpoint.
- Agent Wallet Control Plane: connect/provision a Casper agent wallet, fund it, show readiness, and enforce spend policy before payment.
- Paid Tool Test Console: run paid tool calls against hosted or pasted MCP/x402 endpoints.
- Public Explorer/Receipt Layer: show public receipts with gateway context, policy decision, x402 state, and Casper proof.

The differentiator is not "we convert APIs to MCP" and not "we have a wallet." The differentiator is the policy-gated, Casper-settled, public receipt loop.

## Target Users

- Provider: wants to monetize an API/MCP tool without exposing upstream credentials.
- Agent Operator: wants agents to spend safely through a funded Casper wallet and policy.
- Agent Client: Cursor, Claude Desktop, or a custom MCP client calling paid tools.
- Viewer/Judge: wants to verify the Casper/x402 proof without needing an account.

## Domain Knowledge The Designer Needs

- MCP client access is not payment authorization. A client token or OAuth flow lets a client call the gateway; it does not authorize wallet spending.
- Provider upstream credentials are separate and must stay server-side.
- x402 wallet/payment authorization is separate again and happens only after policy allows a call.
- CSPR.cloud is the default hosted Casper data and x402 facilitator path for MVP.
- Casper proof proves payment settlement only. It does not prove the private tool input/output, provider workspace, or policy config.
- Public receipt detail must redact private inputs, private outputs, upstream credentials, MCP client tokens, and internal policy config.
- Wallet readiness requires funding. Show CSPR gas, CEP-18 payment asset, allowance/spend headroom, and readiness verdict.
- Policy block creates no Casper transaction. It is a successful control outcome.

## Core User Journey

1. Provider connects a source.
2. Provider discovers tools.
3. Provider selects a tool.
4. Provider prices it for Casper x402.
5. Provider publishes a hosted MCP/x402 endpoint.
6. Operator opens wallet/funding/policy modal.
7. Operator connects/provisions wallet.
8. Operator funds wallet and waits for readiness.
9. Operator configures spend policy.
10. Operator opens Paid Tool Test Console.
11. Operator selects hosted endpoint or pastes MCP/x402 URL.
12. Console discovers tools.
13. Operator selects tool and fills schema-specific inputs.
14. Policy pre-check runs.
15. Wallet/payment authorization and x402 settle run.
16. Receipt is created.
17. Public explorer shows receipt and Casper proof.

## Screen-by-screen Direction

### Public Landing

Purpose: Explain the product and drive users into public explorer or operator app.

Required content:

- Clear headline around public Casper x402 receipts/proof.
- Search entry for receipt/deploy/provider/tool.
- Latest receipt preview.
- Explanation of the four receipt layers.
- CTA to explorer and authenticated app.

Do not hide the product behind generic marketing copy.

### Public Explorer

Purpose: Public infrastructure page.

Required content:

- No sign-in requirement.
- No wallet connection.
- No authenticated app sidebar.
- Search/filter table.
- Vitality strip: receipts, paid on Testnet, policy blocks, payment failures/proof pending, unique providers/tools.
- Deploy hash/proof links to `testnet.cspr.live` where real hashes exist.

### Receipt Detail

Purpose: The signature proof surface.

Required sections:

- Gateway context.
- Policy decision.
- x402 verify/settle.
- Casper proof.

Required behavior:

- Redact private data.
- State that Casper proof covers payment settlement only.
- Distinguish paid, blocked, failed, pending, and no-transaction states.

### Authenticated App Shell

Use sticky top-header navigation, not a persistent sidebar.

Suggested top nav:

- Dashboard.
- Sources.
- My Tools.
- Endpoint.
- Test Console.

Right side:

- Testnet network pill.
- Wallet/account button opening Wallet/Funding/Policies modal.
- Account menu with Settings, Audit, View public explorer.

### Dashboard

Purpose: Status overview and next best action.

Show provider readiness, endpoint readiness, wallet readiness, policy readiness, and proof status. Do not make it a generic card wall.

### Sources

Purpose: Manage connected provider sources.

Add Source should be a modal wizard:

1. Source type.
2. URL/upload/manual details.
3. Upstream auth.
4. Discover tools.
5. Review unsupported operations.

### My Tools

Purpose: Provider-owned tools from connected sources.

Show tool list with publication states. Clicking a tool opens a drawer for:

- Schema/details.
- Pricing.
- Publish/unpublish.
- Endpoint visibility.

Do not include public/private registry toggles.

### Hosted Endpoint

Purpose: Copy and inspect the hosted MCP/x402 endpoint.

Show endpoint URL, published tools, client auth model, payment requirements, Cursor/Claude/custom config, and the warning that client access does not authorize wallet spending.

### Wallet/Funding/Policies Modal

This should be a modal with tabs:

- Wallets.
- Funding.
- Policies.

Wallets tab:

- Connected/provisioned wallet list.
- Public address/account.
- Signing mode.
- Custody limitation.

Funding tab:

- Receive address and copy action.
- Testnet faucet/transfer instructions.
- Confirming state.
- CSPR gas balance.
- CEP-18 payment-asset balance.
- Allowance/spend headroom.
- Ready/needs gas/needs payment asset/faucet exhausted states.

Policies tab:

- Max per call.
- Session/day budget.
- Allowed endpoint/tool/provider.
- Network/asset.
- Manual approval if included.
- Policy preview before payment.

### Paid Tool Test Console

Purpose: MCP/x402 endpoint runner.

Flow:

1. Choose `My hosted endpoint` or `Paste MCP/x402 URL`.
2. Discover tools.
3. Select tool.
4. Render inputs from schema or show `No input required`.
5. Choose wallet/policy.
6. Run policy pre-check.
7. Sign/pay/settle.
8. Show result.
9. Show receipt link.

Prototype-only scenario controls may exist only if clearly labeled as design fixtures, not product controls.

### Settings

Use tabs:

- Credentials.
- Network.
- Facilitator.
- Signing.

### Audit

Show append-only events with filters for source, pricing, publish, policy, payment, proof, auth, upstream, and settings events.

## Data, States, And Mocking Rules

Required states:

- Source: empty, connecting, connected, discovery failed, unsupported operation.
- Tool: draft, selected, priced, published, unpublished, unsupported.
- Wallet: new, connected, funding, confirming, ready, needs gas, needs payment asset, faucet exhausted, signing unavailable.
- Policy: allowed, blocked, manual approval required.
- Payment: requirements shown, verifying, settling, paid, verify failed, settle failed, proof pending.
- Receipt: paid on Testnet, policy blocked, payment failed, client auth failed, upstream failed, proof pending, no transaction.

Mocking rules:

- Mocked proof must be labeled as fixture/sample.
- Do not show fake real-looking deploy hashes as if they are real.
- Do not use live-looking secret prefixes.
- Do not show provider credentials in public or client-facing surfaces.

## Prototype Quality Bar

The prototype should feel like serious infrastructure software:

- Clear information architecture.
- Dense but calm operator screens.
- Tables and logs where operators compare state.
- Focused modals/drawers for tasks.
- No wall of same-weight cards.
- No nested card clutter.
- No generic AI/SaaS hero that could fit any product.
- No decorative effects without product meaning.

## Anti-slop Risks To Avoid

- Reintroducing a top-level registry/marketplace.
- Reintroducing private/public tool labels.
- Treating wallet as just a balance card.
- Skipping the funding journey.
- Making explorer look like a gated dashboard.
- Showing simulated/local modes as product modes.
- Making a generic sandbox instead of an endpoint-first paid tool console.
- Claiming settlement proof without a real deploy hash.
- Mixing provider credentials, client auth, and payment authorization.

## Interaction Opportunities

- Top-header app shell.
- Wallet/funding/policy tabbed modal.
- Fund-wallet drawer/stepper.
- Add-source modal wizard.
- Per-tool pricing drawer.
- Tabbed settings.
- Public explorer filters and vitality stats.
- Receipt detail with four strong proof layers.

## Inspiration And Source Material

Read these before designing:

- `.thoughts/README.md`
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/design/2026-06-22-design-direction-and-structure.md`
- `.thoughts/design/2026-06-22-claude-code-design-review.md`
- `.thoughts/design/2026-06-22-review-screenshots/`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`

Reference patterns:

- MCPay: top nav and account/wallet modal pattern.
- TollPay: sticky top nav for MCP/x402 product shell.
- Cards402: wallet/funding/readiness pattern.
- x402scan: public explorer feel.
- CSPR.live: raw Casper proof/deploy link behavior.

## Creative Freedom

The designer may evolve visual style, spacing, typography, and interaction polish. Keep the structure, product boundaries, proof honesty, and domain-specific content intact.

The current red/black/editorial visual language can be kept if it helps, but it is not more important than clear product structure.

## Explicit Non-goals

- Do not implement the production app.
- Do not add backend/database/API/wallet/payment integration.
- Do not design a top-level registry/marketplace.
- Do not design private/public tools.
- Do not design generic token sending.
- Do not design Simulated/Local as product modes.
- Do not claim Mainnet support.
- Do not ask users for private keys or seed phrases.

## Open Questions

- Which exact signing mode should the prototype emphasize?
- Should optional public discovery/catalog appear later after the core loop, or remain entirely out of prototype scope?
- Which final product name should be used in the UI?
