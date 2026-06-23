# Casper GW Context Front Door

Last updated: 2026-06-23

Use this file when an agent enters the project cold. It is a map, not the full context.

## Current State

Casper GW / Casper Agent Commerce Gateway is at the post-prototype reintegration stage.

Verdict from the latest review: **planning is allowed**, but the visual design is **not fully approved yet**. Phase 0 is proven on Casper Testnet, Phase 1 provider-gateway work is locally implemented and verified, Phase 2 wallet readiness/policy work is locally implemented, reviewed, and verified, Phase 3 paid-tool console settlement is locally implemented, reviewed, verified, and proven with a real Casper Testnet deploy, Phase 4 public explorer proof lookup is locally implemented, reviewed, and verified, Phase 5 public explorer account search is locally implemented, reviewed, and verified, Phase 6 hosted endpoint payment enforcement is locally implemented, reviewed, and verified, and Phase 7 hosted endpoint settlement is locally implemented, reviewed, verified, and proven with a real Casper Testnet deploy. Do not jump into broad UI redesign or production custody.

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

## Completed Phase 3 Gate

Phase 3 paid-tool console settlement was completed locally on 2026-06-23. Initial independent review failed with three blockers and two should-fixes; all findings were accepted and fixed. A focused re-review then found one remaining receipt-rendering blocker, which was fixed and re-reviewed as passing.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- Backend selected-wallet gate commit: `8cecc37 feat: gate paid calls by selected wallet`
- Console UI wiring commit: `cd8579d feat: wire paid console request state`
- Product wording fix commit: `14082be fix: align signer gate wording`
- Selected-wallet live-smoke commit: `2bd95eb test: exercise selected wallet in live smoke`
- Review-fix commit: `3d02ac5 fix: close phase 3 review gaps`
- Final re-review fix commit: `1763382 fix: render verify-failed receipts honestly`
- Review fixes include required paid-call request fields, configured-endpoint-only Phase 3 paid execution, DB-backed receipt detail layers, facilitator failure-body preservation, and no fixture fallback after empty discovery.
- Final re-review fix ensures persisted `verify_failed` receipts render settlement as `not attempted` and do not show Casper proof rows.
- Post-fix WCSPR wrap transaction: `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`
- Post-fix live attempt: `dfb14079-44e0-4006-b66f-99e1f22f0fc0`
- Post-fix live deploy hash: `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`
- Post-fix live explorer link: `https://testnet.cspr.live/deploy/8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810`
- Independent re-review passed after the final receipt-rendering fix.
- `pnpm run ci` passed after the final fix with 84 unit tests, 10 browser tests, 2 intentional mobile skips, and `next build`.
- `pnpm smoke:live` passed after review fixes and spent one Abu-approved WCSPR payment.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 4 Gate

Phase 4 public explorer proof lookup was completed locally on 2026-06-23.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-4-public-explorer-proof-lookup.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-4-public-explorer-proof-lookup.md`
- Plan commit: `a61193b docs: plan public explorer proof lookup`
- Implementation commit: `92b611c feat: add public explorer proof lookup`
- Reviewer-fix commit: `50f9aa9 fix: harden explorer proof boundaries`
- Audit update commit: `13c6787 docs: record explorer review fixes`
- `/api/explorer/search` now searches Casper GW receipt id first, Casper GW deploy hash second, and CSPR.cloud external deploy proof third.
- External deploy proof is labeled `External Casper proof` and keeps gateway, policy, and x402 context explicitly unavailable.
- Casper GW deploy hashes still resolve to the rich four-layer receipt before external lookup.
- External FT action rows are filtered by deploy hash and configured payment asset package before payer/payee/amount are rendered.
- Fixture fallback remains visibly labeled as `Sample receipts`.
- Non-spending CSPR.cloud external lookup resolved wrap transaction `1f415ea5a10128cbc2ecc3061078bf64824d64dbea8fcfa42518a769415f6de4`.
- Casper GW deploy-hash lookup resolved Phase 3 deploy `8ed4569fd13c26e28d2b1826d833e88ed821bb74aeec175980992a3ba6af0810` to attempt `dfb14079-44e0-4006-b66f-99e1f22f0fc0`.
- Chrome inspection passed for public explorer search, external proof labeling, gateway receipt lookup, and no authenticated app nav.
- Independent review initially found two blockers and one should-fix; all were fixed and focused re-review passed.
- `pnpm run ci` passed after reviewer fixes with 90 unit tests, 10 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 5 Gate

Phase 5 public explorer account search was completed locally on 2026-06-23.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-5-explorer-account-search.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-5-explorer-account-search.md`
- Plan commit: `acd1517 docs: plan explorer account search`
- Implementation commit: `bb9260e feat: add explorer account search`
- Audit commit: `bf4d45f docs: audit explorer account search`
- `/api/explorer/search` now supports receipt, deploy, account, and wallet query prefixes.
- Casper GW account matches return rich local receipts before external CSPR.cloud account proof.
- External account proof is labeled `External account proof` and keeps gateway, policy, and x402 context explicitly unavailable.
- Account search accepts raw 64-character account hashes and `account-hash-<hash>` input.
- Non-spending local account lookup resolved the Phase 3 wallet to 3 Casper GW receipts.
- Non-spending external account lookup, with local DB intentionally disabled for that command, resolved the same account through CSPR.cloud account, gas balance, payment asset balance, and recent token-action data.
- Chrome inspection passed for public explorer account search and no authenticated app nav.
- Independent review passed with no findings.
- `pnpm run ci` passed with 94 unit tests, 10 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 6 Gate

Phase 6 hosted endpoint payment enforcement was completed locally on 2026-06-23.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-6-hosted-endpoint-payment-enforcement.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-6-hosted-endpoint-payment-enforcement.md`
- Plan commit: `afff428 docs: plan hosted endpoint enforcement`
- Implementation commit: `9fad7b8 feat: enforce hosted endpoint payment challenge`
- Audit commit: `b42ecce docs: audit hosted endpoint enforcement`
- `/api/mcp/[sourceId]` now supports authenticated POST for minimal MCP JSON-RPC `initialize`, `notifications/initialized`, `tools/list`, and `tools/call`.
- `tools/list` returns scoped published tools with Casper GW payment metadata and without provider credential refs or endpoint token hashes.
- Unpaid `tools/call` for a priced published tool returns HTTP `402` with x402 v2 `PaymentRequired` body and `PAYMENT-REQUIRED` header.
- Incoming `payment-signature` or `x-payment` headers fail closed with `payment_verification_not_enabled`; the route does not claim settlement, receipts, deploy hashes, or `PAYMENT-RESPONSE`.
- Independent review passed with no findings.
- `pnpm run ci` passed with 97 unit tests, 10 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 7 Gate

Phase 7 hosted endpoint settlement was completed locally on 2026-06-23.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-7-hosted-endpoint-settlement.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-7-hosted-endpoint-settlement.md`
- Plan commit: `0cedb61 docs: plan hosted endpoint settlement`
- Implementation commit: `35368d1 feat: settle hosted endpoint payments`
- Review-fix commit: `36cecee fix: persist hosted settlement failures`
- Hosted metadata/smoke commit: `e6863ca fix: preserve hosted payment metadata`
- Cleanup commit: `6cb971d fix: keep pricing helper top-level`
- `/api/mcp/[sourceId]` now accepts `PAYMENT-SIGNATURE`/`x-payment` for signed `tools/call` requests, binds the signed resource to the exact hosted route/tool, verifies through CSPR.cloud, enforces wallet policy before settlement, settles through CSPR.cloud, resolves Casper proof, and calls upstream MCP only after successful proof.
- Failure paths persist honest receipt/audit state for verify failure, policy block, settle body failure, settle request failure, proof pending, upstream returned error, and upstream thrown error.
- Hosted tool pricing now preserves server-owned WCSPR metadata in payment requirements; a first hosted smoke failed safely with `invalid_exact_casper_missing_token_name`, then passed after the metadata fix.
- Hosted live smoke receipt: `6bd29008-6943-4e71-aeca-4451effff473`
- Hosted live smoke deploy hash: `a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`
- Hosted live smoke explorer link: `https://testnet.cspr.live/deploy/a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`
- Independent review initially found two blockers and one should-fix; all were fixed. Scoped re-reviews passed with no findings.
- `pnpm run ci` passed after final code changes with 106 unit tests, 10 browser tests, 2 intentional mobile skips, and `next build`.
- `pnpm smoke:hosted-live` passed and spent one Abu-approved WCSPR hosted endpoint payment on Casper Testnet.

No GitHub PR was opened because no remote is configured in this checkout.

## Current Build Gate

The next likely engineering slice is explicit account-history pagination for the public explorer, hosted endpoint client polish, CSPR.click/browser signing planning, or another Abu-approved Context Engineering slice. Full account-history pagination and public-key/CSPR.name search are intentionally not part of Phase 5, Phase 6, or Phase 7 and need their own plan.

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
