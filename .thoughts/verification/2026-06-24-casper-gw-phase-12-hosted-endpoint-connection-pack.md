# Verification: Casper GW Phase 12 Hosted Endpoint Connection Pack

## Scope

Phase 12 made the already-implemented hosted MCP/x402 endpoint easier to connect from real MCP clients without changing the product surface.

Implemented:

- Authenticated hosted endpoint metadata now includes a scope-safe `client` connection contract.
- The connection contract returns an absolute endpoint URL derived from the authenticated request URL.
- The contract documents Streamable HTTP / JSON-RPC methods, scoped bearer client auth, and x402 header names.
- Cursor, Claude Desktop, and curl snippets now use the generated absolute endpoint URL when available.
- Claude Desktop config uses `mcp-remote@latest`, `--transport http-first`, and `--header Authorization:${CASPER_GW_MCP_AUTH_HEADER}` based on current Context7 docs.
- Endpoint UI copy now names the transport and separates client bearer auth from x402 payment auth.

Not implemented:

- OAuth.
- Public registry, private tools, marketplace, sandbox, simulated/local modes.
- Static OpenAPI or `/.well-known/x402` discovery documents.
- New settlement path or new live payment spend.

## Evidence Sources

- Local plan: `.thoughts/plans/2026-06-24-casper-gw-phase-12-hosted-endpoint-connection-pack.md`
- Local MCP Pay reference: `.thoughts/raw/repos/MCPay/apps/api2/src/index.ts`
- Local Casper x402 references:
  - `.thoughts/raw/repos/casper-x402/js/README.md`
  - `.thoughts/raw/repos/casper-x402/js/examples/server/README.md`
- Local x402scan discovery reference: `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`
- Local CSPR.trade MCP reference: `.thoughts/raw/repos/cspr-trade-mcp/skill/cspr-trade/SKILL.md`
- Context7 docs:
  - `/geelen/mcp-remote`, query: `Claude Desktop mcp-remote headers authorization bearer token MCP client config`
  - `/geelen/mcp-remote`, query: `Streamable HTTP transport option mcp-remote Claude Desktop args`

## Code Mapping

- `src/server/hosted-client-metadata.ts`
  - Builds the hosted endpoint client metadata contract.
  - Normalizes request URLs to absolute URL without query/hash.
  - Returns auth/payment/transport/tool metadata without bearer token values or token hashes.
- `src/app/api/mcp/[sourceId]/route.ts`
  - Adds `client` metadata to authenticated `GET /api/mcp/[sourceId]`.
  - Keeps existing `access`, `endpoint`, `transport`, and `x402` fields for compatibility.
- `src/lib/client-config.ts`
  - Updates Claude Desktop `mcp-remote` config to pass Authorization via `--header`.
  - Updates curl snippet to probe `tools/list` over JSON-RPC.
- `src/components/screens/use-provider-gateway.ts`
  - Stores the absolute endpoint URL returned by authenticated endpoint metadata after client-access generation.
  - Resets stale endpoint token/URL/count when provider source changes.
- `src/components/screens/endpoint-screen.tsx`
  - Shows transport and x402 payment-header separation in the existing Endpoint screen.

## Auth Boundary Check

Preserved:

- Provider upstream credentials remain server-side and are not returned in endpoint metadata.
- MCP client access remains a scoped bearer-token MVP.
- x402 wallet/payment authorization remains a separate `PAYMENT-SIGNATURE` flow after a 402 challenge.

Leak checks:

- Unit tests assert metadata and route responses do not contain `cgw_test_`, `credentialRef`, or `tokenHash`.
- `pnpm guard:secrets` passed through `pnpm run ci`.

## Test Evidence

Focused tests:

```bash
pnpm exec vitest run tests/unit/client-config.test.ts tests/unit/hosted-endpoint.test.ts tests/unit/hosted-endpoint-routes.test.ts
```

Result: 3 files passed, 9 tests passed.

Static gates:

```bash
pnpm typecheck
pnpm lint
pnpm run guard:files
pnpm run guard:product
```

Result: passed. `guard:files` still reports pre-existing >200-line warnings under the 300-line hard cap. The touched `src/components/screens/use-provider-gateway.ts` was trimmed back to 197 lines.

Browser and build:

```bash
pnpm run test:browser
pnpm build
```

Result: browser smoke passed with 18 passed and 2 intentional mobile skips. Build passed.

Aggregate gate:

```bash
pnpm run ci
```

Result: passed.

- Unit tests: 30 files passed, 136 tests passed.
- Browser tests: 18 passed, 2 intentional mobile skips.
- `next build`: passed.

Note: an earlier parallel run of `pnpm build` and `pnpm run test:browser` caused Next.js to reject a concurrent build lock. The browser smoke was rerun by itself and passed, then the sequential `pnpm run ci` gate passed.

## Acceptance Mapping

- External MCP clients can receive copyable absolute endpoint config: satisfied by `client.endpointUrl` and UI wiring after access-token generation.
- Client auth and x402 payment auth are separated: satisfied by `client.auth`, `client.payment`, endpoint UI copy, and tests.
- Existing hosted endpoint enforcement and settlement remain intact: existing route behavior and hosted paid-call tests still pass.
- Rejected product language remains blocked: `pnpm guard:product` passed.

## Residual Risk

- Claude Desktop config uses the current `mcp-remote` documented header syntax. It has not been manually run against Claude Desktop in this phase.
- Static x402 discovery docs remain deferred. x402scan-style endpoint-only probing still depends on a client bearer token for this hosted MCP endpoint, so public discovery for protected hosted endpoints needs a separate accepted plan.
- No new live Casper spend was required for this metadata/config slice.

## Independent Review

Reviewer agent `Gauss` reviewed the Phase 12 uncommitted diff and reported no blocking or should-fix findings.

Reviewer checks:

- Verified `mcp-remote` current docs via Context7 for `--header` and `http-first`.
- Inspected `mcp-remote@0.1.38` parser behavior for header/env substitution.
- Ran focused hosted endpoint/client-config unit tests.
- Ran product, secret, and file guards.

Reviewer residual risks:

- Claude Desktop config is docs/package verified but not manually run inside Claude Desktop.
- Absolute endpoint URL generation depends on the request URL seen by Next.js and should be checked after deployment/proxy config exists.
- `src/app/api/mcp/[sourceId]/route.ts` remains above the 200-line warning threshold but below the 300-line hard cap; split later if that route grows again.
