# Plan: Casper GW Phase 1 Provider Gateway

Date: 2026-06-23
Status: In progress

## Progress

2026-06-23:

- Phase 1A provider data access layer started: `provider-store` and `provider-model` cover provider source, discovered tool, price, publish-state, and sanitized source views.
- Phase 1B route foundation added: operator-gated source create/list, source discovery, and tool list routes.
- Phase 1C route foundation added: operator-gated select, price, and publish routes.
- Non-payment smoke created a real Remote MCP provider source for `https://mcp.cspr.trade/mcp`, discovered 23 real tools, persisted them as draft tools, priced `get_quote`, and published it.
- Phase 1D hosted endpoint and Phase 1E UI wiring remain pending.

## Inputs

- `.thoughts/README.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/design/2026-06-22-design-direction-and-structure.md`
- `.thoughts/verification/2026-06-22-casper-gw-phase-0.md`
- Current repo state on `feat/casper-gw-phase-0`, commit `883cb9c`.

## Assumptions

- Phase 0 is accepted as satisfied: one real Casper Testnet x402 paid `get_quote` call settled and persisted with deploy hash `5566d633e6dc41e20fed6d50d84bb3945ff7327cf3ebdb8ecd67e682e944fa8a`.
- `pnpm` remains the only package manager.
- Postgres + Drizzle remain the datastore path.
- CSPR.cloud hosted facilitator remains the x402 settlement path.
- Phase 1 focuses on provider gateway mechanics and stops before production wallet UX, Mainnet, OAuth 2.1, marketplace/discovery catalogue, or broad visual redesign.
- The first real provider source path is Remote MCP using `https://mcp.cspr.trade/mcp`.
- OpenAPI and manual-route source types may remain modeled but must be visibly deferred or unsupported until real implementation exists.
- The app can keep the current visual language while Phase 1 replaces fixture-backed provider surfaces with real datastore/API-backed flows.

## Open Questions

- GitHub remote is still missing, so a PR cannot be opened after the branch is ready. Abu needs to provide the repository remote when PR workflow is required.
- Final hosted endpoint base URL is not available yet. For Phase 1, use a local route shape and generated client config that clearly identifies the current origin or environment.
- Whether Phase 1 should expose only the internal operator-created endpoint or also allow pasted external endpoint runs remains resolved for console behavior, not provider publication. The provider source path should not become a public marketplace.

## Prototype Reintegration Gate

Prototype reintegration is complete and accepted-with-fixes. The following are non-negotiable:

- No registry, private tools, hidden registry, or public/private tool visibility model.
- No sandbox product surface.
- No Simulated/Local product modes.
- No fake deploy hashes.
- Keep provider upstream credentials, MCP client access, and wallet/payment authorization separate.
- Public explorer remains public and outside the authenticated app shell.
- Any fixture/sample data that remains must be labeled at the point of use.

## Phase 1A: Provider Data Access Layer

### Goal

Create the server-side provider gateway store and service layer on top of the existing Drizzle tables.

### Work

- Add `src/server/provider-store.ts` for source/tool/price/endpoint access-key CRUD.
- Add typed source/tool/price status helpers in a small module if needed.
- Preserve current Drizzle schema unless a real missing field appears during implementation.
- Record audit events for source create/discover, tool select, price save, publish/unpublish, and access-key creation.

### Real Integration Path

Postgres is real. Provider source discovery will be real only for Remote MCP in this phase.

### Mock/Simulation Policy

No fake discovered tools should be persisted as live data. Test fixtures can exist only inside tests.

### Checks

- Unit tests for provider-store create/list/update flows.
- Unit tests proving provider upstream credential references are never returned as raw values.
- File-size guard remains below 200-line target for new active source files.

### Acceptance Criteria Covered

RQ-07 to RQ-15, RQ-57 to RQ-59; Stories 1, 2, 3, and 11.

### Stop Condition

Provider source/tool/price records can be created and read from Postgres without exposing secret material.

## Phase 1B: Real Remote MCP Source Discovery

### Goal

Turn a Remote MCP endpoint into selectable provider tools using real MCP discovery.

### Work

- Add `POST /api/provider/sources` for source creation.
- Add `POST /api/provider/sources/[id]/discover` for discovery.
- Add `GET /api/provider/sources` and `GET /api/provider/tools`.
- Reuse `src/server/mcp-client.ts` and endpoint safety checks.
- Normalize discovered MCP tools into `provider_tools` rows with `Draft` or `Unsupported` status.
- Preserve tool input schema and output schema where provided by MCP.

### Real Integration Path

Use `@modelcontextprotocol/sdk` Streamable HTTP client against a real HTTPS MCP endpoint. Default test source remains `https://mcp.cspr.trade/mcp`.

### Mock/Simulation Policy

OpenAPI and manual source creation may return `unsupported_in_phase_1` or be disabled in UI. Do not silently fabricate OpenAPI/manual discovery.

### Checks

- Unit tests for tool normalization.
- API route tests for operator auth, invalid endpoint handling, discovery failure, and successful real-tool persistence using mocked MCP client output.
- Browser smoke should continue to prove public explorer separation.

### Acceptance Criteria Covered

RQ-07 to RQ-10, RQ-30 to RQ-35; Stories 1 and 7 partially.

### Stop Condition

A provider can create a Remote MCP source, discover real tools, and see persisted candidate tools without pricing or wallet setup.

## Phase 1C: Tool Selection, Pricing, And Publish State

### Goal

Let a provider select a discovered tool, set Casper x402 pricing, and mark it as published for a hosted endpoint.

### Work

- Add `POST /api/provider/tools/[id]/select`.
- Add `POST /api/provider/tools/[id]/price`.
- Add `POST /api/provider/tools/[id]/publish`.
- Validate network `casper:casper-test`, scheme `exact`, WCSPR package, amount, payee account, and timeout.
- Keep publication state separate from settlement/proof state.

### Real Integration Path

Pricing uses the same Casper Testnet x402 payment requirement shape proven in Phase 0.

### Mock/Simulation Policy

Publishing an endpoint must not imply that any call has been paid or settled. UI copy must keep endpoint-live separate from payment proof.

### Checks

- Unit tests for pricing validation.
- Unit/API tests for invalid price blocks and valid publish flow.
- Product guard should continue blocking rejected terms.

### Acceptance Criteria Covered

RQ-09 to RQ-15, RQ-40 to RQ-46; Story 3.

### Stop Condition

At least one discovered tool can be selected, priced, and published in Postgres with valid payment requirements.

## Phase 1D: Hosted MCP/x402 Endpoint Skeleton

### Goal

Expose a hosted endpoint that advertises published tools and returns x402 payment requirements for protected calls.

### Work

- Add hosted endpoint route shape under `src/app/api/mcp/[endpointId]/...` or a similarly explicit app-router path.
- Add endpoint lookup by source/access key.
- Add scoped bearer token creation/storage using `endpoint_access_keys` with hashed token storage.
- Return tool list from published provider tools.
- For protected calls, return/handle x402 requirements using the same payment requirement builder as Phase 0.
- Do not run arbitrary upstream calls until tool routing is explicit and tested.

### Real Integration Path

Endpoint metadata and payment requirement generation are real. Actual paid upstream execution may remain the Phase 0 `cspr-trade-mcp get_quote` path until full per-tool routing is completed.

### Mock/Simulation Policy

If a published tool is listed but not executable yet, mark it as not executable or stop before claiming hosted endpoint execution is complete.

### Checks

- Unit tests for token hashing and scope matching.
- API tests proving provider credentials are not returned in endpoint config.
- API tests proving unauthenticated endpoint access fails closed.
- API tests proving payment requirements use Casper Testnet/WCSPR/payee from persisted price.

### Acceptance Criteria Covered

RQ-14 to RQ-19, RQ-40 to RQ-46; Stories 3, 4, and 8 partially.

### Stop Condition

A client can request hosted endpoint metadata with correct scoped client access and receive published tool/payment requirement information without secret leakage.

## Phase 1E: Minimal UI Wiring, No Redesign

### Goal

Replace fixture-backed provider gateway surfaces with the new real provider APIs while avoiding a broad design pass.

### Work

- Wire source form to create/discover Remote MCP source.
- Show persisted discovered tools and status.
- Wire per-tool select/price/publish actions.
- Update endpoint page to show real published tools and generated client config.
- Label OpenAPI/manual paths as deferred if not implemented.
- Keep current route structure unless small changes are needed; do not perform the top-header/modal redesign in this phase unless explicitly approved as part of Phase 1.

### Real Integration Path

UI calls real server routes backed by Postgres and Remote MCP discovery.

### Mock/Simulation Policy

Fixture fallback is allowed only when the database is not configured and must be labeled as sample data. No fake proof or fake endpoint settlement.

### Checks

- Playwright browser smoke for source discovery, pricing/publish route, endpoint config, and existing explorer public route.
- `pnpm verify`
- `pnpm run ci`

### Acceptance Criteria Covered

AC-03, AC-04, AC-08, AC-09, AC-10, AC-11, AC-12.

### Stop Condition

The operator can create a Remote MCP source, discover `cspr-trade-mcp` tools, price/publish one tool, and inspect hosted endpoint config using real datastore records.

## Verification Checkpoint

Before claiming Phase 1 complete:

- Run `pnpm verify`.
- Run `pnpm run ci`.
- Run browser smoke for public `/explorer` and app provider gateway flows.
- Write `.thoughts/verification/YYYY-MM-DD-casper-gw-phase-1-provider-gateway.md`.
- Spawn an independent reviewer agent for code review.
- Fix blockers before committing/PR.

## Handoff Notes

- Do not rerun `pnpm smoke:live` unless a new live settlement proof is intentionally needed; it spends WCSPR.
- Use `pnpm wrap:wcspr` only when the signer needs more WCSPR for live paid-call testing.
- Literal `pnpm ci` is not usable under pnpm 10.33.0; use `pnpm run ci`.
- No GitHub PR can be opened until a remote is configured.
