# Casper GW Context Front Door

Last updated: 2026-06-23

Use this file when an agent enters the project cold. It is a map, not the full context.

## Current State

Casper GW / Casper Agent Commerce Gateway is at the post-prototype reintegration stage.

Verdict from the latest review: **planning is allowed**, but the visual design is **not fully approved yet**. Phase 0 is proven on Casper Testnet, and Phase 1 provider-gateway work is locally implemented and verified. Continue with Phase 2 wallet readiness/policy work before broad UI redesign.

The current product shape:

- MCPay-style provider gateway: connect API/OpenAPI/remote MCP, discover tools, price, publish hosted MCP/x402 endpoint.
- Cards402-style agent wallet control plane: connect/provision wallet, fund it, enforce spend policy before signing/payment.
- Public Casper x402 explorer: public receipt/proof search and detail pages.
- Four-layer receipt: gateway context, policy decision, x402 verify/settle, Casper proof.
- Casper proof path uses CSPR.cloud hosted indexer + hosted x402 facilitator. Do not plan to run a Casper node or build a chain indexer.

## Read In This Order

1. Project rules:
   - `AGENTS.md`
   - `CLAUDE.md` currently delegates to `AGENTS.md`

2. Current build handoff:
   - `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
   - Read section `0. Engineering Rules of Engagement` before making any claim or plan.

3. Current design direction:
   - `.thoughts/design/2026-06-22-design-direction-and-structure.md`
   - This is the scoped designer direction: top-header nav, modal/tab/drawer structure, wallet funding journey.

4. Current spec and stories:
   - `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
   - `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
   - `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
   - `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`

5. Fresh designer handoff:
   - `.thoughts/design/2026-06-22-designer-reset-brief.md`
   - `.thoughts/design/2026-06-22-designer-reset-prompt.md`

6. Current design evidence:
   - `.thoughts/design/2026-06-22-claude-code-design-review.md`
   - `.thoughts/design/2026-06-22-review-screenshots/`

7. Historical baseline product artifacts:
   - `.thoughts/quality/2026-06-18-agent-commerce-gateway-quality-profile.md`
   - `.thoughts/specs/2026-06-18-agent-commerce-gateway.md`
   - `.thoughts/stories/2026-06-18-agent-commerce-gateway.md`
   - Treat older quality/spec/story items as subject to the deltas in the 2026-06-22 current profile and handoff.

8. Research and references:
   - `.thoughts/raw/source-index.md`
   - `.thoughts/wiki/`
   - `.thoughts/research/`
   - `.thoughts/raw/repos/`

## Superseded Or Stale Context

- Older v1/v2 prototype audits are useful history, but the 2026-06-22 reintegration handoff supersedes their architecture/feasibility conclusions.
- The 2026-06-18 spec/stories are historical. Current behavior is in `2026-06-22-casper-gw-current-spec.md` and `2026-06-22-casper-gw-current-stories.md`.
- The old `BLOCKED` conclusion around explorer data path/facilitator is resolved: CSPR.cloud provides the hosted indexer and hosted x402 facilitator path.
- Active app code has been cleaned of the old `registry`, `sandbox`, and `Simulated/Local` product surfaces. Treat any reintroduction of those concepts as a regression unless Abu explicitly accepts it.
- A downloaded `screenshots/modal.png` may show stale simulated/local framing. Prefer current HTML/source and the latest review screenshots when they conflict.

## Non-Negotiable Rules

- Research before claiming. Never write `blocked`, `not possible`, or invent an endpoint, SDK call, field, flow, or error code before checking authoritative sources.
- Source order for product decisions: local `.thoughts/` -> cloned repos in `.thoughts/raw/repos/` -> CSPR.cloud docs -> Casper docs -> Casper AI toolkit -> Context7 for current library/SDK syntax -> targeted web only for a named gap.
- Keep credential planes separate:
  - provider upstream credentials,
  - MCP client access auth,
  - x402 wallet/payment authorization.
- Keep receipt layers separate:
  - gateway context,
  - policy decision,
  - x402 verify/settle,
  - Casper proof.
- Never show `Paid on Testnet`, `settled`, or a deploy hash unless a real Casper Testnet deploy hash exists.
- Public explorer is public: no sign-in, no wallet connection, no authenticated app sidebar.
- Do not reintroduce private tools, private registries, hidden registries, generic send policy, or simulated/local product modes.
- Wallet policy means spend and permission controls for paid agent tool calls.

## Completed Phase 0 Gate

Phase 0 proof was completed on 2026-06-23.

- Verification audit: `.thoughts/verification/2026-06-22-casper-gw-phase-0.md`
- Commit: `883cb9c feat: prove casper x402 paid call`
- WCSPR wrap transaction: `5cb92938e22ba2fafa4db978a8e42099b52399e99afc76c8b365fa04de5e60cc`
- Paid x402 deploy hash: `5566d633e6dc41e20fed6d50d84bb3945ff7327cf3ebdb8ecd67e682e944fa8a`
- Persisted receipt attempt: `158ab798-5e21-4512-9823-fe6d95b8d3e5`
- `pnpm verify` and `pnpm run ci` passed after independent review fixes.

No GitHub PR was opened because no remote is configured.

## Completed Phase 1 Gate

Phase 1 provider gateway was completed locally on 2026-06-23.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-1-provider-gateway.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-1-provider-gateway.md`
- Provider foundation commit: `57bce54 feat: add provider gateway foundation`
- Hosted endpoint commit: `dd3f5df feat: add hosted endpoint skeleton`
- UI wiring commit: `119f948 feat: wire provider gateway ui`
- Reviewer-fix commit: `abeb955 fix: enforce provider endpoint scopes`
- Real Remote MCP non-payment smoke discovered 23 tools from `https://mcp.cspr.trade/mcp`, priced/published `get_quote`, and generated scoped endpoint metadata without printing the client token.
- Independent review found two blockers; both are fixed:
  - endpoint access scopes now enforce limited `toolIds`,
  - pricing uses server-side Casper Testnet/WCSPR/payee defaults and rejects client-supplied payment fields.
- `pnpm verify` and `pnpm run ci` passed after the reviewer fixes.

No GitHub PR was opened because no remote is configured in this checkout.

## Current Build Gate

Current implementation plan:

- `.thoughts/plans/2026-06-23-casper-gw-phase-2-wallet-readiness-policy.md`

Phase 2 should build the wallet readiness and policy path:

- persisted wallet profiles,
- real CSPR.cloud readiness evidence for CSPR gas + WCSPR balance,
- spend policy persistence and fail-closed evaluation,
- minimal UI wiring for wallet registration, readiness refresh, and policy saving,
- no fake funded state and no production custody claim.

Do not start broad design work, production custody, CSPR.click signing, or paid-console settlement work as part of Phase 2 unless Abu explicitly changes scope.

Historical Phase 0 gate, now satisfied:

- Build CSPR.cloud REST/streaming client paths needed for deploy proof, account balance, and CEP-18/token-action reads.
- Build CSPR.cloud x402 facilitator client for `/supported`, `/verify`, and `/settle`.
- Persist the four receipt layers in a datastore.
- Wrap one real upstream tool, preferably `cspr-trade-mcp get_quote`.
- Make one real Casper Testnet paid call.
- Stop when a receipt has a real deploy hash resolvable on `testnet.cspr.live`.

Do not silently stub missing production facts. Ask Abu for:

- `CSPR_CLOUD_API_KEY`
- CEP-18 Testnet payment-token decision/package hash
- wallet signing mode decision

## Current Design Gate

The design pass should not be a full redesign. It should apply:

- top-header app navigation instead of the prototype sidebar,
- wallet/funding/policy as a modal with tabs,
- fund-wallet journey as a drawer or stepper,
- add-source as a modal wizard,
- price-and-publish as a per-tool drawer,
- settings as a tabbed page,
- explorer vitality strip and real `testnet.cspr.live` proof links,
- per-result fixture labels where data is mocked.

The visual language can stay; the required correction is structure and wallet funding realism.
