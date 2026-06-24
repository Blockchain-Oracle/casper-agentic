# Plan: Casper GW Phase 14 Authorized Hosted Endpoint Discovery

## Inputs

- `.thoughts/README.md` current gate: Phase 13 is complete; static hosted endpoint discovery planning is an allowed next slice.
- Phase 6 and Phase 7 hosted endpoint work: scoped client bearer auth is required before hosted endpoint metadata, tool listing, 402 challenge, and settlement.
- Phase 12 connection-pack work: authenticated endpoint metadata already exposes absolute endpoint URL, transport, client bearer auth shape, x402 header names, and tool payment summaries.
- Current spec/stories:
  - `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
  - `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- Prototype reintegration:
  - `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Local references:
  - `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`: OpenAPI-first and `/.well-known/x402` are public discovery patterns; endpoint-only probing works when discovery docs are unavailable.
  - `.thoughts/raw/repos/cspr-trade-mcp/skill/cspr-trade/SKILL.md`: MCP clients expect clear endpoint/config/tool setup information.
  - `.thoughts/raw/repos/MCPay/apps/api2/src/index.ts`: useful provider UX pattern is generated endpoint URL plus previewable tools.

## Assumptions

- Scoped bearer client access remains the MVP auth model. OAuth remains later architecture.
- A public global `/.well-known/x402` would create a public catalogue/registry shape and is not accepted in this phase.
- A public x402scan-compatible endpoint probe is not currently possible without either requiring bearer credentials or bypassing the client-auth boundary.
- Published endpoint tools may be described to authorized clients, but provider upstream credentials and token hashes must remain server-only.

## Open Questions

- Whether Abu wants a public discovery/catalogue later remains open and should be a separate accepted plan.
- Whether the hosted endpoint should eventually expose OpenAPI-first x402 discovery for public scanners remains deferred until the client-auth/OAuth model is decided.

## Prototype Reintegration Gate

The prototype is evidence only. This phase must not reintroduce rejected surfaces:

- No registry/private tools.
- No public marketplace/catalogue.
- No sandbox or simulated/local modes.
- No CSPR.click signing, Mainnet, OAuth, production custody, or fake settlement.

## Phase 14: Authorized Source-Specific Discovery Manifest

### Goal

Give authorized MCP clients and operators a static, source-specific discovery document for a hosted endpoint without making the endpoint public registry infrastructure.

### Work

- Add a server-only discovery manifest builder for a `HostedEndpointView`.
- Add `GET /api/mcp/[sourceId]/discovery`.
- Reuse the same scoped bearer access guard and tool scope filtering as `GET /api/mcp/[sourceId]`.
- Return a static manifest containing:
  - absolute endpoint URL,
  - transport and JSON-RPC methods,
  - client bearer auth header shape,
  - x402 challenge/payment/response header names,
  - published tools visible to the token scope,
  - input schemas and payment requirements,
  - clear declaration that this is source-specific authorized discovery, not public registry discovery.
- Add a discovery URL to the existing authenticated client metadata response.
- Update the existing Endpoint screen minimally to show/copy the discovery manifest URL after client access exists.

### Real Integration Path

The manifest is generated from persisted provider source/tool/pricing records already used by the hosted endpoint. It does not fabricate tools or settlement evidence.

### Mock/Simulation Policy

- Unit tests may mock the hosted endpoint/store layer.
- Runtime discovery must use real persisted provider records.
- Do not return fake deploy hashes, fake receipts, fake settlement state, provider credentials, or raw bearer tokens.

### Checks

- Unit tests:
  - manifest builder includes endpoint/tool/payment metadata,
  - route requires scoped bearer auth,
  - route respects token tool scope,
  - route does not leak `credentialRef`, `tokenHash`, raw bearer token, CSPR.cloud key, signer material, or upstream credentials.
- Browser smoke:
  - existing Endpoint screen still shows placeholder config before token generation.
  - no public explorer/app shell regression.
- Full `pnpm run ci`.

### Acceptance Criteria Covered

- Hosted endpoint config is more discoverable for real authorized clients.
- Client access auth remains separate from x402 payment auth.
- Static discovery does not become a public registry.

### Stop Condition

Stop before public `/.well-known/x402`, public OpenAPI indexing, public registry/catalogue, OAuth, CSPR.click signing, Mainnet, broad redesign, or production custody.

## Verification Checkpoint

After implementation:

- Write `.thoughts/verification/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`.
- Map plan requirements to code, tests, browser evidence, and reviewer findings.
- Request independent review for auth-boundary leaks, product-scope drift, and discovery correctness.
- Fix blockers before committing.

## Handoff Notes

This phase intentionally provides authorized source-specific discovery only. Public x402 scanner compatibility is a separate product/security decision because the current hosted endpoint requires scoped bearer client auth before x402 payment challenge behavior.
