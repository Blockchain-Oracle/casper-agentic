# Casper GW Context Front Door

Last updated: 2026-06-25

Use this file when an agent enters the project cold. It is a map, not the full context.

## Current State

Casper GW / Casper Agent Commerce Gateway is at the post-prototype reintegration stage.

Verdict from the latest review: **planning is allowed**, but the visual design is **not fully approved yet**. Phase 0 is proven on Casper Testnet, Phase 1 provider-gateway work is locally implemented and verified, Phase 2 wallet readiness/policy work is locally implemented, reviewed, and verified, Phase 3 paid-tool console settlement is locally implemented, reviewed, verified, and proven with a real Casper Testnet deploy, Phase 4 public explorer proof lookup is locally implemented, reviewed, and verified, Phase 5 public explorer account search is locally implemented, reviewed, and verified, Phase 6 hosted endpoint payment enforcement is locally implemented, reviewed, and verified, Phase 7 hosted endpoint settlement is locally implemented, reviewed, verified, and proven with a real Casper Testnet deploy, Phase 8 public explorer history pagination is locally implemented, reviewed, and verified, Phase 9 external account-history pagination is locally implemented, reviewed, and CI-verified, Phase 10 public WCSPR action feed browsing is locally implemented and CI-verified, Phase 11 public-key/CSPR.name account search is locally implemented and CI-verified, Phase 12 hosted endpoint connection-pack polish is locally implemented, reviewed, and CI-verified, Phase 13 public feed cache/rate-limit polish is locally implemented and CI-verified, Phase 14 authorized hosted endpoint discovery is locally implemented, reviewed, and CI-verified, Phase 15 shared public feed state is locally implemented, reviewed, and CI-verified, Phase 16 feed-state pruning is locally implemented, reviewed, and CI-verified, Phase 17 maintenance failure hardening is locally implemented, reviewed, and CI-verified, Phase 18 active source size cleanup is locally implemented, reviewed, and CI-verified, Phase 19 test file size cleanup is locally implemented, reviewed, and CI-verified, Phase 20 workflow guard enforcement is locally implemented, reviewed, and CI-verified, Phase 21 scanner compatibility preflight is locally implemented, reviewed, and CI-verified, Phase 22 CSPR.cloud Streaming readiness preflight is locally implemented, reviewed, and CI-verified, Phase 23 wallet-signing readiness boundary is locally implemented, reviewed, and CI-verified, Phase 24A CSPR.click signing-contract boundary is locally implemented, reviewed, and CI-verified, Phase 24B CSPR.click browser adapter/load boundary is locally implemented, reviewed, and CI-verified, Phase 24C server payment-intent handoff is locally implemented, reviewed, and unit-verified, Phase 24D browser-signed payment completion is locally implemented and unit/type verified, Phase 24E browser approval UI wiring is locally implemented, reviewed, and CI-verified, Phase 24F CSPR.click connect readiness is locally implemented and Chrome-verified, and Phase 24G CSPR.click primary-source refresh is locally implemented and CI-verified. Do not jump into broad UI redesign or production custody.

Phase 24H browser-wallet profile import is locally implemented and CI-verified. The app can derive a wallet profile from the active CSPR.click public key and share that browser connection with the paid-tool console, but no browser-approved x402 settlement/deploy proof has been claimed yet.

Phase 24I CSPR.click embedded provider config is locally implemented and focused-verified. The app now defaults CSPR.click to iframe mode with Google/Apple social-login providers before extension wallets, and Chrome verified the embedded modal without clicking a provider or claiming a wallet login/spend.

Phase 24J browser-signing settings state is locally implemented and focused-verified. Settings now reflects the shared CSPR.click browser-signing state instead of hard-coding `not enabled`, while still avoiding any live settlement or custody claim.

Phase 24K app-level CSPR.click connect button is Chrome-verified. The Casper GW `Connect CSPR.click wallet` button opens the embedded modal with Google/Apple and extension providers, does not open an `accounts.cspr.click/signin.html` tab, and does not claim login/spend/proof.

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

## Completed Phase 8 Gate

Phase 8 public explorer history pagination was completed locally on 2026-06-23.

- Plan: `.thoughts/plans/2026-06-23-casper-gw-phase-8-explorer-history-pagination.md`
- Verification audit: `.thoughts/verification/2026-06-23-casper-gw-phase-8-explorer-history-pagination.md`
- `/api/receipts` now returns server-side paginated receipt history with page metadata and filters for status, text, provider, tool, wallet/account, network, and time where data exists.
- `/explorer` now exposes public history filtering, date controls, and previous/next pagination without app auth, wallet connection, or sidebar.
- `/explorer?receipt=<id>` resolves the receipt detail through `/api/receipts/[id]`, so older receipts outside the current page can still deep link correctly.
- History browsing clears stale exact-search/deep-link state before changing filters or pages.
- Independent review found three should-fix issues; all were fixed:
  - public page number is capped to avoid huge offsets,
  - receipt deep links resolve outside the current page,
  - history paging/filtering no longer operates on stale search results.
- `pnpm run ci` passed with 110 unit tests, 12 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 9 Gate

Phase 9 external account-history pagination was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-9-external-account-history-pagination.md`
- `/api/explorer/search` now accepts `externalPage` and `externalPageSize` for account-history proof pagination.
- CSPR.cloud token-action pagination preserves `item_count` and `page_count`, and uses `page_size`; `limit` was verified as the wrong page-size parameter for this endpoint.
- Public account search keeps Casper GW receipts first when they exist and attaches separate CSPR.cloud external account history.
- External-only account search returns `external_proof` rows with gateway/policy/x402 context unavailable and Casper token-action facts in the Casper proof layer.
- `/explorer` now exposes minimal external account-history controls after account search while remaining public with no app auth, wallet connection, or sidebar.
- Non-spending CSPR.cloud account-history smoke resolved the known Testnet payer account to 6 WCSPR actions across 3 pages at page size 2.
- Initial independent review found one blocker and one should-fix; both were fixed:
  - CSPR.cloud action-page failures now return `upstream_error`/`503` instead of empty proof or `not_found`.
  - Out-of-range external pages now clamp/refetch the last CSPR.cloud page instead of rendering impossible page labels.
- Focused re-review passed with no remaining Blocking or Should-fix findings.
- `pnpm run ci` passed after review fixes with 118 unit tests, 14 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 10 Gate

Phase 10 public WCSPR action feed browsing was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-10-public-wcspr-action-feed.md`
- `/api/explorer/actions` now returns a bounded, public, CSPR.cloud-backed feed for the configured WCSPR package.
- `/explorer` now has an external WCSPR feed mode that remains public, no-sidebar, no-wallet, and no-auth.
- Feed rows are `external_proof` only. Gateway receipt, policy decision, and x402 verify/settle layers are explicitly unavailable unless a separate Casper GW receipt exists.
- The feed uses CSPR.cloud `page` and `page_size`, preserves `item_count` and `page_count`, and clamps/refetches out-of-range pages.
- Non-spending live smoke resolved the configured WCSPR package to 4,870 CSPR.cloud token actions across 1,218 pages at page size 4; first deploy: `a27e519e06c56b9132768683b3eeae0fdda5f5b2e85a8a4034adbfb67b16352e`.
- Local Playwright workers are capped at 2 to avoid local Next production-server timeout flakes; GitHub CI remains 1 worker.
- `pnpm run ci` passed with 125 unit tests, 16 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 11 Gate

Phase 11 account identifier search was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-11-account-identifier-search.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-11-account-identifier-search.md`
- `/api/explorer/search` now accepts Casper public keys and `.cspr` names in addition to receipt ids, deploy hashes, account hashes, and wallet/account prefixes.
- Public-key search resolves full Casper public-key hex through CSPR.cloud `/accounts/{public_key}`.
- CSPR.name search resolves `.cspr` names through CSPR.cloud `/cspr-name-resolutions/{name}` and then loads the resolved account.
- Resolved accounts reuse existing Casper GW account receipt lookup and CSPR.cloud external account-history proof.
- External-only identifier results remain `external_proof`; gateway/policy/x402 layers stay unavailable unless a Casper GW receipt exists.
- Non-spending live smoke resolved the known Testnet payer public key to 5 local Casper GW receipts plus CSPR.cloud account history, and resolved `faucet.cspr` to account `b383c7cc23d18bc1b42406a1b2d29fc8dba86425197b6f553d7fd61375b5e446`.
- `pnpm run ci` passed with 129 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 12 Gate

Phase 12 hosted endpoint connection-pack polish was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-12-hosted-endpoint-connection-pack.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-12-hosted-endpoint-connection-pack.md`
- `GET /api/mcp/[sourceId]` now returns a scope-safe `client` connection contract after scoped bearer auth succeeds.
- The connection contract includes an absolute endpoint URL, Streamable HTTP / JSON-RPC method metadata, bearer client-auth shape, and x402 challenge/payment/response header names.
- Generated Cursor, Claude Desktop, and curl snippets use the absolute endpoint URL after client access is created.
- Claude Desktop config now follows current `mcp-remote` docs: `mcp-remote@latest`, `--transport http-first`, and `--header Authorization:${CASPER_GW_MCP_AUTH_HEADER}`.
- Endpoint UI copy now names Streamable HTTP / JSON-RPC and `PAYMENT-SIGNATURE` separation without adding registry, sandbox, OAuth, or simulated/local modes.
- Independent reviewer `Gauss` reported no blockers or should-fix findings.
- `pnpm run ci` passed with 136 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 13 Gate

Phase 13 public WCSPR feed cache/rate-limit polish was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-13-public-feed-cache-rate-limit.md`
- `/api/explorer/actions` now uses a server-only in-process cache keyed by network, configured payment asset, page, and page size.
- Fresh cache hits avoid repeated CSPR.cloud calls; stale cached proof can be served when CSPR.cloud is unavailable.
- The route applies a small in-process per-client rate limit. Rate-limited requests return cached proof when available, otherwise `429` with `source: "rate_limited"`.
- The route emits `Cache-Control`, `x-casper-gw-feed-cache`, `x-casper-gw-rate-limit-remaining`, and `x-casper-gw-rate-limit-reset` headers.
- The public feed UI shows cache state as metadata only. External rows remain `external_proof` and do not claim gateway/policy/x402 context.
- Non-spending live smoke returned `cspr_cloud` cache `miss` followed by cache `hit` for the same feed page.
- `pnpm run ci` passed with 142 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 14 Gate

Phase 14 authorized hosted endpoint discovery was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`
- `GET /api/mcp/[sourceId]/discovery` now returns a source-specific discovery manifest only after scoped bearer client access succeeds.
- The discovery route applies the same tool-scope filtering as hosted endpoint metadata and sends `Cache-Control: no-store`.
- The manifest exposes the hosted endpoint URL, Streamable HTTP / JSON-RPC methods, bearer client-auth shape, x402 header names, visible published tools, input schemas, and payment requirements.
- The manifest is labeled `visibility: "authorized-source"` and does not create public catalogue infrastructure.
- Provider upstream URLs, provider credential refs, client token hashes, raw bearer tokens, signer material, and CSPR.cloud keys are not included in the manifest or client metadata.
- Endpoint client metadata now includes the authorized discovery manifest URL, and the Endpoint screen shows it only after scoped client access is generated.
- Independent reviewer `Bernoulli` reported no Blocking or Should-fix findings; a non-blocking leak-test suggestion was accepted.
- `pnpm run ci` passed after review with 145 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 15 Gate

Phase 15 shared public feed state was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-15-shared-feed-state.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-15-shared-feed-state.md`
- Migration: `drizzle/0002_first_shatterstar.sql`
- Public WCSPR feed cache entries are now persisted in Postgres when `DATABASE_URL` is available.
- Public feed rate buckets are now persisted in Postgres by hashed client identity only; raw client IPs are not stored or exposed.
- The existing in-process cache and limiter remain fallback behavior when Postgres is unavailable or errors.
- Only successful CSPR.cloud feed results are persisted. Cached/stale responses remain metadata-labeled and do not create Casper GW/x402 proof claims.
- `pnpm db:generate` and `pnpm db:migrate` passed locally.
- Non-spending cross-process smoke returned `cache: "miss"` followed by `cache: "hit"` for the same WCSPR page.
- Non-spending shared rate smoke allowed the first request, blocked the second, and did not expose the raw identity.
- Independent reviewer `Nash` reported no Blocking or Should-fix findings.
- `pnpm run ci` passed with 148 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.
- Follow-up: schedule `pruneSharedExternalActionFeedState()` once deployment/runtime scheduling is chosen.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 16 Gate

Phase 16 feed-state pruning was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-16-feed-state-pruning.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-16-feed-state-pruning.md`
- `pnpm maintenance:prune-feed` now prunes expired shared public feed cache rows and expired shared rate buckets without manual SQL.
- The maintenance command prints aggregate counts only: deleted cache entries, deleted rate buckets, database configured state, and prune timestamp.
- Missing `DATABASE_URL` fails loudly by default; `--allow-missing-database` exists only for explicit local validation.
- `.github/workflows/prune-feed-state.yml` provides a scheduled/manual GitHub Actions scheduler shape gated by `secrets.DATABASE_URL` and does not run in normal PR CI.
- No public route, UI, explorer, receipt, provider, payment, x402 settlement, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody behavior changed.
- Independent reviewer `Fermat` reported no Blocking or Should-fix findings.
- `pnpm run ci` passed with 152 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 17 Gate

Phase 17 maintenance failure hardening was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-17-maintenance-failure-hardening.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-17-maintenance-failure-hardening.md`
- `pnpm maintenance:prune-feed` still prints aggregate success output only.
- Missing `DATABASE_URL` still fails loudly, now as structured JSON with `error: "database_url_required"`.
- Unexpected prune failures are normalized to `error: "feed_state_prune_failed"` and do not print SQL text, connection strings, raw identities, deploy payloads, or secret-looking values.
- No scheduler semantics, public routes, UI, explorer, receipt, provider, wallet, payment, x402 settlement, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody behavior changed.
- Independent reviewer `Wegener` reported no Blocking or Should-fix findings.
- `pnpm run ci` passed with 153 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 18 Gate

Phase 18 active source size cleanup was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-18-active-source-size-cleanup.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-18-active-source-size-cleanup.md`
- JSON-RPC parsing/response helpers moved from `src/app/api/mcp/[sourceId]/route.ts` to `src/server/mcp-json-rpc.ts`.
- Hosted paid-call helpers moved into focused server modules for support types, error/output handling, and verify-failure persistence.
- Live paid-call validation/redaction and policy evidence moved into focused server modules.
- Paid tool test-console endpoint/discovered-tool panels moved into a focused client component.
- Active source files that previously triggered guard warnings are now under the 200-line warning target.
- `pnpm run guard:files` now warns only on oversized unit test files:
  - `tests/unit/explorer-search.test.ts`
  - `tests/unit/hosted-endpoint-post-routes.test.ts`
  - `tests/unit/hosted-paid-call.test.ts`
  - `tests/unit/live-paid-call.test.ts`
- No public route, explorer, receipt, wallet, provider, x402 settlement, discovery, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody behavior changed.
- Independent reviewer `Euclid` reported no Blocking or Should-fix findings.
- `pnpm run ci` passed with 153 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 19 Gate

Phase 19 test file size cleanup was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-19-test-file-size-cleanup.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-19-test-file-size-cleanup.md`
- Oversized unit tests were split into focused test files and fixture helpers:
  - explorer deploy/account search tests,
  - hosted endpoint POST fixtures,
  - hosted paid-call orchestration/post-settlement tests,
  - live paid-call orchestration/success/policy tests.
- `pnpm run guard:files` now passes with no warnings.
- No production source, public route, UI, explorer behavior, receipt behavior, wallet behavior, provider behavior, x402 settlement, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody behavior changed.
- Independent reviewer `Locke` initially found two coverage-preservation blockers in the moved live paid-call success/proof tests; both were fixed and focused re-review passed with no Blocking or Should-fix findings.
- `pnpm run ci` passed after reviewer fixes with 153 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 20 Gate

Phase 20 workflow guard enforcement was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-20-workflow-guard.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-20-workflow-guard.md`
- Added `pnpm guard:workflows` and wired it into `pnpm verify`.
- `scripts/guard-workflows.mjs` now enforces package script gates, normal CI workflow gates, and scheduled prune workflow gates.
- The prune workflow is allowlisted to `workflow_dispatch` and `schedule` only, including a regression for unexpected triggers after blank lines inside the YAML `on:` block.
- Package script checks require exact commands, so `pnpm test:browser` cannot satisfy the unit-test gate.
- No production runtime, public route, UI, explorer behavior, receipt behavior, wallet behavior, provider behavior, x402 settlement, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody behavior changed.
- Independent reviewer `Descartes` initially found one Blocking trigger-allowlist gap and one Should-fix exact-command gap; both were fixed, then a blank-line trigger parsing blocker was fixed, and final focused re-review passed with no Blocking or Should-fix findings.
- `pnpm run ci` passed after reviewer fixes with 160 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 21 Gate

Phase 21 scanner compatibility preflight was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-21-scanner-compat-preflight.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-21-scanner-compat-preflight.md`
- Added a server-side scanner compatibility status object to authorized endpoint metadata and authorized discovery manifests.
- Scanner status is honest: public discovery is `not_enabled`, endpoint-only probing is `blocked_by_client_access`, and runtime x402 challenge is available only after client access.
- No public OpenAPI route, `/.well-known/x402`, public scanner registration, registry/catalogue, or bearer-auth bypass was added.
- Client-facing endpoint metadata is now sanitized: provider upstream URL, source auth mode, credential configured state, and tool upstream target are not returned to client-token holders.
- Independent reviewer `Lagrange` initially found one Blocking upstream URL leak in `GET /api/mcp/[sourceId]`; it was fixed with sanitized endpoint metadata and focused re-review passed with no Blocking or Should-fix findings.
- `pnpm run ci` passed after reviewer fixes with 164 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 22 Gate

Phase 22 CSPR.cloud Streaming readiness preflight was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-22-streaming-readiness-preflight.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-22-streaming-readiness-preflight.md`
- Added `CSPR_CLOUD_STREAMING_BASE_URL` with the CSPR.cloud Testnet Streaming default.
- Added server-only streaming readiness metadata to `GET /api/health/integrations`.
- Streaming status is honest: public explorer mode remains `rest_feed`, runtime status is `not_enabled`, and actual WebSocket consumption is still deferred.
- No WebSocket client, SSE route, live feed UI, public scanner discovery, registry/catalogue, or simulated/local mode was added.
- Streaming URL handling is sanitized: only `wss:` bases are accepted and URL username/password are stripped before any health response.
- Independent reviewer `Banach` initially found one Blocking health-JSON URL userinfo/protocol-validation gap; it was fixed with sanitization and regression tests. Product-boundary reviewer `Gibbs` found no product-scope issues.
- `pnpm run ci` passed after reviewer fixes with 172 unit tests, 18 browser tests, 2 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Completed Phase 23 Gate

Phase 23 wallet-signing readiness boundary was completed locally on 2026-06-24.

- Plan: `.thoughts/plans/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`
- Verification audit: `.thoughts/verification/2026-06-24-casper-gw-phase-23-wallet-signing-readiness.md`
- Added server-only wallet-signing readiness metadata to `GET /api/health/integrations`.
- Signing status is honest: current path is `testnet_signer` for integration verification only, browser wallet/CSPR.click signing is `not_enabled`, and production custody is `not_claimed`.
- Removed stale `Hosted encrypted signer` copy from active settings/fixture source and added a product guard to block that phrase from active source.
- No CSPR.click SDK, browser approval UI, payment/x402 settlement change, production custody, or public explorer/feed behavior was added.
- Independent reviewer `Lorentz` found one Should-fix: settings copy implied the signer was configured even when env might be missing. It was fixed by using the non-stateful label `Testnet signer integration path`. Product-boundary reviewer `Noether` found no product-scope issues.
- `pnpm run ci` passed after review fixes with 176 unit tests, 19 browser tests, 3 intentional mobile skips, and `next build`.

No GitHub PR was opened because no remote is configured in this checkout.

## Pending Phase 24 Plan

Phase 24 real CSPR.click/browser signing is planned and partially started, but full browser signing is not implemented yet.

- Plan: `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- Completed Phase 24A audit: `.thoughts/verification/2026-06-25-casper-gw-phase-24a-signing-contract.md`
- Completed Phase 24A scope: pure CSPR.click typed-data result normalization and x402 payment payload assembly contract.
- Completed Phase 24B audit: `.thoughts/verification/2026-06-25-casper-gw-phase-24b-browser-adapter.md`
- Completed Phase 24B scope: browser-only CSPR.click public config parsing, CDN runtime preparation, browser client state detection, typed-data signature delegation, SDK rejection normalization, and readiness runtime metadata.
- Completed Phase 24C audit: `.thoughts/verification/2026-06-25-casper-gw-phase-24c-payment-intent.md`
- Completed Phase 24C scope: server-side browser payment-intent route that runs wallet/policy checks before returning redacted CSPR.click typed-data signing params. Policy blocks and incompatible wallets return no signing params.
- Completed Phase 24D audit: `.thoughts/verification/2026-06-25-casper-gw-phase-24d-browser-completion.md`
- Completed Phase 24D scope: backend route accepts a browser-produced x402 `PaymentPayload`, verifies/settles through CSPR.cloud, resolves Casper proof, calls the configured MCP tool only after settlement, and persists receipt outcomes. This does not use the local Testnet signer fallback.
- Completed Phase 24E audit: `.thoughts/verification/2026-06-25-casper-gw-phase-24e-browser-ui-wiring.md`
- Completed Phase 24E scope: paid console browser path now creates a server payment intent, checks active CSPR.click public key, requests `signTypedData`, builds the x402 payload, and submits browser completion when public CSPR.click runtime is configured. The integration signer path remains separate, the console timeline uses actual receipt status, and non-settled outcomes no longer render fixture status or proof-complete language.
- Completed Phase 24F audit: `.thoughts/verification/2026-06-25-casper-gw-phase-24f-csprclick-connect-readiness.md`
- Completed Phase 24F scope: public CSPR.click localhost config is documented, client env inlining is fixed, the app provides the CSPR.click `#app`/`#csprclick-ui` mount structure, the paid console exposes CSPR.click connect/readiness state, and Chrome verified that app-level connect opens the `accounts.cspr.click` iframe for `csprclick-template`.
- Current boundary: no completed CSPR.click sign-in, live browser-wallet x402 signature, live browser-wallet settlement, new deploy hash, or production custody claim exists yet.

## Current Build Gate

The next likely engineering slice is a credential/browser-gated live CSPR.click smoke, real feed-streaming runtime planning, public x402 scanner opt-in planning, remote deployment scheduling, or another Abu-approved Context Engineering slice. Broader explorer indexing beyond the configured WCSPR feed, actual WebSocket streaming consumption, public x402 scanner discovery, OAuth, remote deployment scheduling, and live CSPR.click signing proof still need their own accepted implementation slices.

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
