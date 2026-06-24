# Verification Audit: Casper GW Phase 21 Scanner Compatibility Preflight

## Verdict

Pass. Phase 21 adds an authorized scanner compatibility preflight only. It does not make Casper GW publicly discoverable by x402scan, does not add OpenAPI or `/.well-known/x402`, and does not bypass scoped bearer client access. Independent review passed after fixing one client-facing upstream URL leak.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-21-scanner-compat-preflight.md`
- `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`
- `src/server/x402-scanner-compat.ts`
- `src/server/hosted-client-metadata.ts`
- `src/server/hosted-discovery.ts`
- `tests/unit/x402-scanner-compat.test.ts`
- `tests/unit/hosted-discovery-routes.test.ts`
- Focused test, guard, and full CI output

## Requirement Traceability

- Encode scanner compatibility boundary:
  - `src/server/x402-scanner-compat.ts` returns `status: "not_publicly_indexable"`, `publicDiscovery: "not_enabled"`, and `endpointOnlyProbe: "blocked_by_client_access"`.
  - Discovery precedence is recorded as OpenAPI, `/.well-known/x402`, then endpoint-only probe, matching the local `x402scan` discovery reference.
- Preserve scoped client access:
  - No public route was added.
  - Existing `/api/mcp/[sourceId]` and `/api/mcp/[sourceId]/discovery` auth behavior is unchanged.
  - Scanner status is returned only inside authorized client metadata and authorized discovery.
- Avoid public scanner overclaiming:
  - Runtime challenge is labeled `available_after_client_access`, not public scanner ready.
  - Future scanner work is described as requiring a separate opt-in plan before public OpenAPI or `/.well-known/x402`.
- Prevent leaks:
  - Tests assert scanner metadata and discovery manifest do not contain upstream MCP URLs, credential refs, token hashes, raw client tokens, or secret-looking values.
  - `GET /api/mcp/[sourceId]` now returns a sanitized endpoint view that omits provider upstream URL, source auth mode, credential configured state, and tool upstream targets.

## Acceptance Criteria Coverage

- Authorized operators can see the current scanner boundary:
  - `buildHostedClientMetadata` and `buildHostedDiscoveryManifest` include `scannerCompatibility`.
- Public scanner compatibility is honest:
  - The status remains `not_publicly_indexable`.
  - Public discovery remains `not_enabled`.
  - Endpoint-only probing remains blocked by client access.
- No product-scope regression:
  - No registry/private-tool/sandbox/simulated/local mode text was introduced into active source.
  - `pnpm run guard:product` passed.
- No secret-scope regression:
  - `pnpm run guard:secrets` passed.

## Quality Gates

- Focused tests:
  - `pnpm exec vitest run tests/unit/x402-scanner-compat.test.ts tests/unit/hosted-discovery-routes.test.ts tests/unit/hosted-endpoint-routes.test.ts tests/unit/hosted-endpoint.test.ts`
  - Result: 4 files passed, 13 tests passed.
- Lightweight guards:
  - `pnpm run guard:files`: passed.
  - `pnpm run guard:product`: passed.
  - `pnpm run guard:secrets`: passed.
- Full CI:
  - `pnpm run ci`: passed.
  - Unit tests: 39 files, 164 tests passed.
  - Browser tests: 18 passed, 2 intentional mobile skips.
  - Build: `next build` completed successfully.

## Deviations From Plan

- The planned Endpoint screen display was intentionally not implemented in this slice because `src/components/screens/use-provider-gateway.ts` is already at 199 lines and adding UI state there would reintroduce file-size pressure. The compatibility object is available in authorized metadata/discovery and can be displayed in a future UI slice after a small state split.

## Gaps And Risks

- This phase does not make endpoints publicly indexable by x402scan. That remains a separate product/security decision.
- No external scanner command was run because no public scanner-compatible discovery endpoint exists by design.

## Follow-ups

- None required for this slice.

## Evidence Log

- New active source line counts:
  - `src/server/x402-scanner-compat.ts`: 34 lines.
  - `src/server/hosted-discovery.ts`: 112 lines.
  - `src/server/hosted-client-metadata.ts`: 95 lines.
  - `src/app/api/mcp/[sourceId]/route.ts`: 173 lines.
  - `src/server/hosted-endpoint.ts`: 129 lines.
  - `tests/unit/x402-scanner-compat.test.ts`: 93 lines.
  - `tests/unit/hosted-discovery-routes.test.ts`: 111 lines.
  - `tests/unit/hosted-endpoint.test.ts`: 182 lines.
  - `tests/unit/hosted-endpoint-routes.test.ts`: 189 lines.
- Independent review:
  - Reviewer `Lagrange` initially found one Blocking leak: `GET /api/mcp/[sourceId]` returned raw upstream source/tool fields after client access.
  - The route now returns sanitized endpoint metadata and regression tests assert the upstream MCP URL does not appear in the response.
  - Focused re-review passed with no Blocking or Should-fix findings.
- `pnpm run ci` completed successfully after reviewer fix on 2026-06-24.
