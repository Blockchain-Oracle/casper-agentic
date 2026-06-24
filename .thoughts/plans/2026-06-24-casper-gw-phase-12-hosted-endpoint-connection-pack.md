# Plan: Casper GW Phase 12 Hosted Endpoint Connection Pack

## Inputs

- `.thoughts/README.md` current gate: Phase 11 is complete; hosted endpoint client polish is an allowed next slice.
- Phase 6 hosted endpoint enforcement plan and audit: client bearer access gates endpoint metadata and MCP JSON-RPC before x402 payment.
- Phase 7 hosted endpoint settlement plan and audit: signed `tools/call` requests settle through CSPR.cloud before upstream execution.
- Local references checked:
  - `.thoughts/raw/repos/MCPay/apps/api2/src/index.ts`: useful provider pattern is generated MCP endpoint URL plus client-facing connection details.
  - `.thoughts/raw/repos/casper-x402/js/README.md` and `examples/server/README.md`: Casper x402 flow is `402` challenge, client payment payload in `PAYMENT-SIGNATURE`, protected response plus `PAYMENT-RESPONSE`.
  - `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`: runtime `402` behavior is authoritative; static discovery can come later, and endpoint-only probing is acceptable when discovery docs are not yet exposed.
  - `.thoughts/raw/repos/cspr-trade-mcp/skill/cspr-trade/SKILL.md`: MCP clients expect copyable `mcpServers` config pointing at a remote URL.
- Context7 checked `/geelen/mcp-remote` for current Claude Desktop bridge syntax. It supports custom auth headers via `--header`, and `http-first` is the Streamable HTTP-first transport strategy.

## Assumptions

- Phase 12 should not redesign the app. UI changes are limited to the existing Endpoint screen.
- The scoped bearer token remains the Phase 12 MCP client auth MVP. OAuth is preserved as later architecture, not implemented here.
- Hosted endpoint URLs shown to external clients must be absolute. Relative `/api/mcp/...` is not enough for Cursor, Claude Desktop, curl, or reviewer copy/paste tests.
- A generated client token is visible only once in the operator session response. Stored token hashes remain server-only.

## Open Questions

- None blocking. A deployed public domain can replace localhost later through hosting configuration.

## Prototype Reintegration Gate

The prototype is evidence only. This slice follows accepted endpoint behavior from the reintegration/spec artifacts and avoids rejected surfaces:

- No registry/private tools.
- No sandbox or simulated/local product modes.
- No broad dashboard redesign.
- No claim of settlement unless the hosted endpoint actually returns a settled payment response and receipt.

## Phase 12: Hosted Endpoint Connection Pack

### Goal

Make the generated hosted MCP/x402 endpoint easier to connect from real MCP clients while preserving the three separate auth planes:

- Provider upstream credentials stay server-side.
- MCP client access uses a scoped bearer token.
- Wallet/payment authorization uses x402 payment headers and facilitator settlement.

### Work

- Add a server-side hosted endpoint client metadata helper.
- Return scope-safe client metadata from `GET /api/mcp/[sourceId]`, including:
  - absolute endpoint URL derived from the request URL,
  - transport type and JSON-RPC methods,
  - client bearer auth header shape,
  - x402 challenge/payment/response header names,
  - Casper network and accepted payment requirements summary.
- Update `clientConfig` snippets so Cursor, Claude Desktop, and curl use absolute endpoint URLs when available.
- Update Claude Desktop config to use `mcp-remote@latest`, `--transport http-first`, and an Authorization header env value based on Context7 docs.
- Update the Endpoint screen copy only where needed to show the absolute connection URL and header semantics.

### Real Integration Path

This is real endpoint integration polish. It uses the existing authenticated `GET /api/mcp/[sourceId]` and does not fake settlement, payment, tools, or receipt state.

### Mock/Simulation Policy

- Placeholder snippets remain only before a real source/token exists and must be visibly placeholder-shaped.
- Do not add simulated/local modes.
- Do not expose fake deploy hashes, fake settlement, provider secrets, token hashes, or upstream credentials.

### Checks

- Unit tests:
  - client config uses absolute URLs and correct Claude `mcp-remote` header syntax,
  - hosted endpoint metadata includes scope-safe connection/payment details,
  - hosted endpoint metadata does not leak token hashes, bearer token values, CSPR.cloud key, signer material, or provider upstream credentials.
- Browser smoke:
  - endpoint screen still renders client configuration and hosted endpoint connection state.
- Full local gate:
  - `pnpm run ci`
  - `pnpm run verify`
  - `pnpm run test:browser`
  - `pnpm build`

### Acceptance Criteria Covered

- External MCP clients can receive a copyable absolute endpoint config.
- Client auth and x402 payment auth are clearly separated in metadata and UI.
- Existing Phase 6/7 payment enforcement remains intact.
- Rejected product language remains blocked.

### Stop Condition

- Stop before implementing OAuth, production custody, broad UI redesign, public registry, marketplace, static x402 discovery documents, or a new settlement path.

## Verification Checkpoint

After implementation:

- Write `.thoughts/verification/2026-06-24-casper-gw-phase-12-hosted-endpoint-connection-pack.md`.
- Map this plan to code, tests, browser evidence, and guard commands.
- Request an independent reviewer agent to inspect the diff for leaks, broken MCP config, auth-boundary mistakes, and file-size violations.
- Fix blockers before committing.

## Handoff Notes

This phase improves the connection handoff around the already-proven hosted endpoint. It does not replace the live x402 proof loop or add new product surfaces.
