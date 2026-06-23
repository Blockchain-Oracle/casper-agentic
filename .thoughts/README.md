# Casper GW Context Front Door

Last updated: 2026-06-23

Use this file when an agent enters the project cold. It is a map, not the full context.

## Current State

Casper GW / Casper Agent Commerce Gateway is at the post-prototype reintegration stage.

Verdict from the latest review: **planning is allowed**, but the visual design is **not fully approved yet**. Phase 0 is proven on Casper Testnet, Phase 1 provider-gateway work is locally implemented and verified, and Phase 2 wallet readiness/policy work is locally implemented, reviewed, and verified. Phase 3 paid-tool console settlement is locally implemented with a real Testnet deploy and is pending independent reviewer closeout; do not jump into broad UI redesign or production custody.

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

## Completed Phase 2 Gate

Phase 2 wallet readiness and policy was completed locally on 2026-06-23.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-2-wallet-readiness-policy.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-2-wallet-readiness-policy.md`
- Wallet readiness commit: `be179cc feat: add wallet readiness checkpoint`
- Spend policy commit: `b1fdfff feat: add wallet spend policy gate`
- Wallet UI commit: `c05875a feat: wire wallet control ui`
- Reviewer-fix commit: `5c0d997 fix: close wallet policy review gaps`
- Persisted wallet profiles, CSPR.cloud readiness checks, persisted spend policy, fail-closed paid-call policy evaluation, and minimal wallet UI wiring are in place.
- Real non-payment readiness smoke detected CSPR gas and WCSPR for the configured Testnet signer wallet.
- Real no-payment policy-block smoke created blocked attempt `7200a0f5-72e4-48c1-b0b1-8dea7acf9e48` and no payment/deploy claim.
- Independent review initially found two blockers and one should-fix; all were fixed and re-review passed.
- `pnpm run ci` passed after the reviewer fixes with 72 unit tests, 10 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Phase 3 Gate Pending Review

Phase 3 paid-tool console settlement was implemented locally on 2026-06-23. Initial independent review failed with three blockers and two should-fixes; all findings were accepted and fixed. The gate is pending independent re-review closeout.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- Backend selected-wallet gate commit: `8cecc37 feat: gate paid calls by selected wallet`
- Console UI wiring commit: `cd8579d feat: wire paid console request state`
- Product wording fix commit: `14082be fix: align signer gate wording`
- Selected-wallet live-smoke commit: `2bd95eb test: exercise selected wallet in live smoke`
- Review fixes include required paid-call request fields, configured-endpoint-only Phase 3 paid execution, DB-backed receipt detail layers, facilitator failure-body preservation, and no fixture fallback after empty discovery.
- Post-fix WCSPR wrap transaction: `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`
- Post-fix live attempt: `dfb14079-44e0-4006-b66f-99e1f22f0fc0`
- Post-fix live deploy hash: `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`
- Post-fix live explorer link: `https://testnet.cspr.live/deploy/8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`
- `pnpm run ci` passed after the review fixes with 83 unit tests, 10 browser tests, 2 intentional mobile skips, and `next build`.
- `pnpm smoke:live` passed after review fixes and spent one Abu-approved WCSPR payment.

No GitHub PR was opened because no remote is configured in this checkout.

## Current Build Gate

Do not start the next engineering slice until the Phase 3 independent re-review has passed and the verification audit is updated from conditional pass to pass.

After reviewer closeout, the next likely engineering slice is Phase 4 public explorer + receipt-detail hardening: join datastore receipt layers with CSPR.cloud proof, improve search/filter/detail states, preserve redaction, and keep `/explorer` public/no app shell.

Do not start broad design work, production custody, CSPR.click signing, Mainnet, generic send policy, registry/private tools, or new simulated product modes unless Abu explicitly changes scope through the Context Engineering flow.

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
