# Verification Audit: Casper GW Phase 14 Authorized Hosted Endpoint Discovery

## Verdict

Pass.

This audit verifies the Phase 14 slice only: authorized source-specific hosted endpoint discovery. It does not verify public x402 scanner compatibility, OAuth, CSPR.click/browser signing, Mainnet, production custody, or any public catalogue behavior.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Local references checked before planning:
  - `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`
  - `.thoughts/raw/repos/cspr-trade-mcp/skill/cspr-trade/SKILL.md`
  - `.thoughts/raw/repos/MCPay/apps/api2/src/index.ts`
- Changed files in the working tree:
  - `src/server/hosted-discovery.ts`
  - `src/app/api/mcp/[sourceId]/discovery/route.ts`
  - `src/server/hosted-client-metadata.ts`
  - `src/components/screens/use-provider-gateway.ts`
  - `src/components/screens/endpoint-screen.tsx`
  - `src/components/gateway-app.tsx`
  - `tests/unit/hosted-endpoint.test.ts`
  - `tests/unit/hosted-endpoint-routes.test.ts`
  - `tests/unit/hosted-discovery-routes.test.ts`

## Requirement Traceability

| Requirement | Evidence | Result |
| --- | --- | --- |
| Add authorized hosted endpoint discovery without public catalogue semantics. | `src/server/hosted-discovery.ts` defines `manifest.scope` and `manifest.visibility` as `authorized-source`; no active source contains the banned `registry` product term. | Pass |
| Require scoped bearer client access before returning discovery. | `src/app/api/mcp/[sourceId]/discovery/route.ts` calls `requireEndpointAccess(sourceId, authorization)` before loading endpoint data. | Pass |
| Respect token tool scope. | The discovery route passes `access.scope.toolIds` into `getHostedEndpoint`. `tests/unit/hosted-discovery-routes.test.ts` asserts `getHostedEndpoint("source-1", ["tool-1"])`. | Pass |
| Return only hosted endpoint/client metadata needed by authorized clients. | `buildHostedDiscoveryManifest` returns endpoint URL, transport methods, bearer auth shape, x402 headers, visible tool schemas, payment requirements, and hosted resource URLs. | Pass |
| Do not leak provider upstream credentials, access-token hashes, raw client tokens, or upstream targets. | Manifest builder does not include source endpoint URL, credential refs, token hashes, or raw token values. Unit tests assert those strings are absent. | Pass |
| Add discovery URL to client metadata and minimal Endpoint screen wiring. | `src/server/hosted-client-metadata.ts` includes `client.discovery.manifestUrl`; `use-provider-gateway.ts`, `gateway-app.tsx`, and `endpoint-screen.tsx` show it only after client access generation. | Pass |
| Keep x402 payment auth separate from MCP client auth. | Client metadata still describes bearer client access separately from `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, and `PAYMENT-RESPONSE`. | Pass |
| Stop before public `.well-known/x402`, public OpenAPI indexing, OAuth, CSPR.click signing, Mainnet, broad redesign, or production custody. | No routes or UI were added for those surfaces. | Pass |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
| --- | --- |
| Static discovery is source-specific and authorized. | `GET /api/mcp/[sourceId]/discovery` is bearer-gated and returns `visibility: "authorized-source"`. |
| Discovery uses persisted provider records at runtime. | Route obtains data through `getHostedEndpoint`, the same hosted endpoint view path used by `/api/mcp/[sourceId]`. |
| Client metadata exposes a manifest URL after scoped client access. | Existing endpoint metadata response now includes `discovery.manifestUrl`; endpoint UI receives `endpointDiscoveryUrl`. |
| No banned product surfaces in active source. | `pnpm guard:product` passed inside `pnpm run ci`. |
| Browser/public explorer boundary unchanged. | Existing Playwright smoke passed; `/explorer` remains public and separate from `/app`. |
| Build output includes the new API route. | `next build` lists dynamic route `/api/mcp/[sourceId]/discovery`. |

## Quality Gates

- `pnpm exec vitest run tests/unit/hosted-endpoint.test.ts tests/unit/hosted-endpoint-routes.test.ts tests/unit/hosted-discovery-routes.test.ts`: passed, 3 files, 9 tests.
- `pnpm run ci`: passed.
  - `pnpm install --frozen-lockfile`: passed.
  - `pnpm verify`: passed.
  - `pnpm guard:files`: passed with pre-existing warnings only.
  - `pnpm guard:product`: passed.
  - `pnpm guard:secrets`: passed.
  - `pnpm test`: passed, 31 files, 145 tests.
  - `pnpm typecheck`: passed.
  - `pnpm lint`: passed.
  - `pnpm test:browser`: passed, 18 tests passed, 2 intentional mobile skips.
  - `pnpm build`: passed.

Pre-existing file-size warnings remain:

- `src/app/api/mcp/[sourceId]/route.ts`
- `src/components/screens/test-console-screen.tsx`
- `src/server/hosted-paid-call.ts`
- `src/server/live-paid-call.ts`
- `tests/unit/explorer-search.test.ts`
- `tests/unit/hosted-endpoint-post-routes.test.ts`
- `tests/unit/hosted-paid-call.test.ts`
- `tests/unit/live-paid-call.test.ts`

The Phase 14 files are below the warning threshold:

- `src/server/hosted-discovery.ts`: 109 lines.
- `tests/unit/hosted-discovery-routes.test.ts`: 105 lines.
- `src/components/screens/use-provider-gateway.ts`: 199 lines.

## Deviations From Plan

- The plan originally described a boolean public-registry-style declaration. During verification, `pnpm guard:product` rejected the runtime field name because it contained the banned product term. The implementation now uses `visibility: "authorized-source"` and `scope: "authorized-source"` instead. This preserves the intended boundary without creating a registry-shaped API contract.
- No live Casper transaction was attempted. Phase 14 is metadata/discovery only and does not alter settlement behavior.
- No new browser assertion was added for the discovery row specifically. Existing browser smoke covers public/app shell boundaries and provider wiring; unit tests cover the route and metadata contract.

## Gaps And Risks

- Independent reviewer `Bernoulli` reported no Blocking or Should-fix findings.
- Public x402 scanner compatibility remains intentionally unimplemented because scoped bearer client access is still the MVP boundary.
- The discovery manifest returns raw tool input schemas and payment requirements for authorized clients. This is expected, but it should remain behind client access until OAuth/public discovery is explicitly accepted.
- Existing non-Phase-14 file-size warnings still need future cleanup.

## Follow-ups

- Update `.thoughts/README.md` after the reviewer verdict and final commit hash are known.
- If Abu later accepts public discovery, create a separate Context Engineering plan for public scanner compatibility and auth model changes.

## Evidence Log

- Focused unit test command passed after splitting discovery route tests.
- Full CI passed after replacing the rejected runtime `registry` field wording with `visibility: "authorized-source"`.
- Independent review from sub-agent `Bernoulli` reported no Blocking or Should-fix findings.
- Bernoulli suggested one non-blocking stronger leak assertion for the bare upstream MCP URL; that assertion was added to the manifest and route tests.
