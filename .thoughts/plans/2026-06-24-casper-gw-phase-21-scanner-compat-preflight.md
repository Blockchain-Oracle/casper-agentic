# Plan: Casper GW Phase 21 Scanner Compatibility Preflight

## Inputs

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/raw/repos/x402scan/docs/DISCOVERY.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`
- `.thoughts/verification/2026-06-24-casper-gw-phase-14-authorized-hosted-discovery.md`
- Current code:
  - `src/server/hosted-discovery.ts`
  - `src/server/hosted-client-metadata.ts`
  - `src/app/api/mcp/[sourceId]/route.ts`
  - `src/app/api/mcp/[sourceId]/discovery/route.ts`

## Assumptions

- Scoped bearer client access remains the accepted MVP hosted endpoint boundary.
- Public x402 scanners such as `x402scan` prefer public OpenAPI and `/.well-known/x402`; endpoint-only fallback expects unauthenticated probing to reach a parseable `402` challenge.
- Casper GW must not create a public catalogue, public/private tool model, registry, or public discovery surface in this phase.
- The useful safe next step is to make scanner compatibility status explicit to authorized operators, not to bypass client access.

## Open Questions

- Abu still needs to decide whether public scanner discovery should exist later, and if so whether it is opt-in per endpoint/tool.
- If public discovery is accepted later, a separate plan must decide whether to expose OpenAPI-first discovery, `/.well-known/x402`, endpoint-only unauthenticated 402 probes, or scanner-specific auth.

## Prototype Reintegration Gate

The prototype/reintegration path rejects public registry/private-tool semantics and requires client access auth to remain separate from payment authorization. This phase therefore cannot ship public scanner discovery. It may only expose an authorized compatibility preflight that explains what is currently compatible, what is blocked, and what future opt-in would require.

## Phase 1: Scanner Compatibility Model

### Goal

Encode the scanner compatibility boundary in a server-only model so tests and operators can inspect it without relying on tribal memory.

### Work

- Add `src/server/x402-scanner-compat.ts`.
- Evaluate a `HostedEndpointView` and hosted endpoint URL.
- Return:
  - `publicDiscovery: "not_enabled"`;
  - `endpointOnlyProbe: "blocked_by_client_access"`;
  - `runtimeChallenge: "available_after_client_access"`;
  - discovery precedence from `x402scan`: OpenAPI first, `/.well-known/x402` second, endpoint-only fallback third;
  - whether all visible tools have payment requirements;
  - next requirements for any future public scanner work.

### Real Integration Path

Use the same persisted hosted endpoint view already used by authorized discovery. Do not call external scanner services in this phase.

### Mock/Simulation Policy

Unit tests may use hosted endpoint fixtures. Runtime output must not fabricate settlement, public scanner registration, deploy hashes, or public discovery URLs.

### Checks

- Unit tests for all-paid-tools, missing-price tools, and no upstream credential leakage.

### Acceptance Criteria Covered

- Client access remains separate from payment authorization.
- Public scanner limitations are explicit and auditable.

### Stop Condition

Stop before public OpenAPI, public `/.well-known/x402`, unauthenticated hosted endpoint 402 probes, OAuth, registry/catalogue, or public scanner registration.

## Phase 2: Authorized Metadata Wiring

### Goal

Show scanner compatibility status only to authorized clients/operators who already have endpoint metadata access.

### Work

- Add scanner compatibility to `buildHostedClientMetadata`.
- Add scanner compatibility to `buildHostedDiscoveryManifest`.
- Keep the response free of provider upstream URLs, provider credentials, token hashes, raw bearer tokens, CSPR.cloud keys, signer material, and wallet keys.
- Add minimal Endpoint screen display that says public scanner indexing is not enabled and runtime x402 challenge is available after client access.

### Real Integration Path

Metadata is generated from the hosted endpoint model and displayed after client access generation.

### Mock/Simulation Policy

Tests may mock endpoint data. UI must not claim public scanner indexing works.

### Checks

- Unit tests for metadata and discovery manifest shape.
- Existing route tests for authorized discovery and endpoint metadata.
- Browser smoke remains unchanged except optional provider wiring assertion if needed.

### Acceptance Criteria Covered

- Authorized operators can see why public scanners cannot index the endpoint yet.
- No public route or registry semantics are introduced.

### Stop Condition

Stop before adding any public discovery URL or bypassing bearer access.

## Phase 3: Verification, Audit, And Review

### Goal

Prove this is a bounded preflight and not public scanner implementation.

### Work

- Run focused unit tests.
- Run `pnpm run guard:product`, `pnpm run guard:secrets`, and `pnpm run ci`.
- Write `.thoughts/verification/2026-06-24-casper-gw-phase-21-scanner-compat-preflight.md`.
- Request independent review for auth-boundary leaks, accidental public discovery, and misleading scanner claims.
- Commit only after reviewer blockers are fixed.

### Real Integration Path

No external scanner registration and no live payment are required.

### Mock/Simulation Policy

No product mock or fake scanner success state.

### Checks

- Focused unit tests.
- `pnpm run ci`.
- Independent review.

### Acceptance Criteria Covered

- Public scanner compatibility is handled honestly: current endpoint remains private/client-token gated, and future public discovery requires an explicit separate decision.

### Stop Condition

Stop if implementation would require exposing tool metadata publicly, weakening client access, or adding a registry/catalogue surface.

## Verification Checkpoint

The verification audit must state that Phase 21 does not make Casper GW publicly discoverable by x402scan. It only makes the current compatibility status explicit to authorized clients/operators.

## Handoff Notes

Public x402 scanner compatibility remains a product/security decision, not a hidden implementation detail. This phase prevents accidental overclaiming and gives the next planning step a concrete status object to build from.
