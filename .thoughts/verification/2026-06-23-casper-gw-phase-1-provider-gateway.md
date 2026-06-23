# Verification Audit: Casper GW Phase 1 Provider Gateway

Date: 2026-06-23
Branch: `feat/casper-gw-phase-0`
Commits audited: `57bce54`, `dd3f5df`, `119f948`

## Verdict

Conditional pass.

Phase 1 provider gateway foundations are implemented and verified: real Remote MCP source discovery, persisted tool selection/pricing/publish state, scoped hosted endpoint metadata, hashed client access tokens, and minimal UI wiring to real provider APIs. The independent review returned two blockers; both were accepted and resolved before this verdict. The condition is that Phase 1 is not the final hosted paid-call execution path; actual x402 paid execution remains the Phase 0 `cspr-trade-mcp get_quote` proof loop until per-tool upstream execution is implemented.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/plans/2026-06-23-casper-gw-phase-1-provider-gateway.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Phase 1 diff from `01e389a..119f948`

## Requirement Traceability

- Provider source/tool/pricing model: implemented in `src/server/provider-model.ts` and `src/server/provider-store.ts`.
- Real Remote MCP discovery: implemented through `POST /api/provider/sources`, `POST /api/provider/sources/[id]/discover`, and `@modelcontextprotocol/sdk` client reuse.
- Tool select/price/publish: implemented through `/api/provider/tools/[id]/select`, `/price`, and `/publish`.
- Hosted endpoint skeleton: implemented at `GET /api/mcp/[sourceId]` with `src/server/hosted-endpoint.ts`.
- Scoped MCP client auth: implemented in `src/server/endpoint-access.ts`; raw tokens are returned once, hashed at rest, and omitted from endpoint views.
- Auth separation: provider upstream credential refs remain server-side, MCP client bearer is separate, and wallet/x402 payment authorization is not conflated with either.
- Minimal UI wiring: implemented through `use-provider-gateway`, Import, Pricing, Endpoint, pricing drawer, and client config snippets.
- Rejected product surfaces: no registry/private tools, sandbox product surface, Simulated/Local user mode, fake deploy hash, or fake hosted credential was introduced.

## Acceptance Criteria Coverage

- Provider can create/load a Remote MCP source: covered by API route tests and UI hook wiring.
- Provider can discover real tools from `https://mcp.cspr.trade/mcp`: non-payment smoke discovered 23 tools and persisted them as draft tools.
- Provider can price and publish `get_quote`: non-payment smoke priced and published `get_quote`; unit tests cover server-side Casper defaults.
- Hosted endpoint returns published tools and payment requirements: covered by endpoint route tests and non-payment smoke for access key `57572955-ca93-4a66-a700-d0441eb60337`.
- Client access token is not persisted raw or returned in metadata: covered by `endpoint-access` tests and endpoint route redaction assertions.
- Limited endpoint client tokens are enforced per published tool id: covered by `endpoint-access` scope tests and hosted endpoint route tests.
- Provider pricing uses server-side Casper Testnet/WCSPR/payee defaults and rejects client-supplied payment fields: covered by provider tool action route tests.
- UI no longer uses fake hosted credentials: covered by `tests/unit/client-config.test.ts` and `tests/browser/smoke.spec.ts`.
- Public explorer remains public and separate from app shell: covered by Playwright smoke on desktop and mobile.

## Quality Gates

- `pnpm verify`: passed.
  - File guard: passed with no warnings after splitting `use-provider-gateway`.
  - Product guard: passed.
  - Secret guard: passed.
  - Vitest: 16 files, 54 tests passed.
  - Typecheck: passed.
  - Lint: passed.
- `pnpm test:browser`: passed.
  - 9 checks passed.
  - 1 mobile-only skip for the desktop provider-wiring nav check.
- `pnpm run ci`: passed.
  - Frozen install, verify, browser smoke, and `next build` passed.

## Review Findings

- Blocking finding accepted and fixed: endpoint access scopes stored `toolIds` but did not enforce them. Fix: access-key creation validates requested `toolIds` against published tools, `requireEndpointAccess` returns normalized scope, and hosted endpoint metadata is filtered by `access.scope.toolIds`.
- Blocking finding accepted and fixed: provider price route accepted client-supplied `asset`, `network`, `payTo`, `scheme`, and timeout. Fix: route now rejects those client fields, accepts only amount, and enforces server-side `casper:casper-test`, WCSPR, payee, and `exact` defaults.
- Manual hardening added: operator token is not persisted in browser storage.

## Deviations From Plan

- Phase 1E does not implement full hosted paid upstream execution. This matches the Phase 1D stop condition: endpoint metadata and payment requirements are real, while arbitrary upstream execution waits for explicit per-tool routing.
- OpenAPI and manual-route imports remain modeled but deferred; Remote MCP is the only real source discovery path in this phase.
- The paid console and wallet policy areas still contain fixture-backed UI where Phase 1 did not explicitly replace them.
- No GitHub PR was opened because no remote is configured yet.
- No live x402 smoke was rerun for Phase 1 to avoid unnecessary WCSPR spend; Phase 0 already contains the live Casper Testnet proof.

## Gaps And Risks

- Mobile nav switching is not yet covered for the provider wiring browser check.
- Endpoint access keys can be created repeatedly; revocation UI and token rotation UX are not implemented.
- The hosted endpoint currently exposes metadata/config, not full MCP tool invocation with per-tool payment settlement.
- Provider source creation can create duplicate sources; dedupe/unique constraints are not implemented.

## Follow-ups

- Add hosted endpoint tool invocation with explicit per-tool upstream routing.
- Add token revocation/rotation UI and tests.
- Add mobile provider-flow browser coverage after nav accessibility is improved.
- Write final Phase 1 handoff if Abu wants a separate handoff artifact.

## Evidence Log

- Phase 1 provider foundation commit: `57bce54`.
- Phase 1 hosted endpoint commit: `dd3f5df`.
- Phase 1 UI wiring commit: `119f948`.
- Non-payment MCP discovery smoke: source `731b05c9-d79c-4a7c-a2c9-c703d3ec5ef9`, 23 tools discovered.
- Non-payment publish smoke: `get_quote`, tool `8a94bd37-dbaa-4b11-a99a-226e5e4c6cc7`, price `da65ab44-ffc5-4055-a72b-49d91f6a2a64`.
- Non-payment endpoint smoke: access key `57572955-ca93-4a66-a700-d0441eb60337`, one published `get_quote`, `casper:casper-test`, scheme `exact`, token not printed.
- Full CI evidence: `pnpm run ci` passed after commit `119f948`.
- Independent reviewer `Anscombe`: returned two blockers; both accepted and fixed.
- Full CI evidence after review fixes: `pnpm run ci` passed with 54 unit tests, 9 browser checks, 1 mobile-only provider-wiring skip, and `next build`.
