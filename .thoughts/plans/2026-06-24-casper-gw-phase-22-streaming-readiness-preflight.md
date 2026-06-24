# Plan: Phase 22 CSPR.cloud Streaming Readiness Preflight

## Inputs

- `AGENTS.md` current rules: local `.thoughts` first, no fake proof, no broad design work, no public scanner discovery without an accepted plan.
- `.thoughts/README.md` current build gate: feed streaming planning is an allowed next slice, while real feed streaming still needs its own accepted plan.
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`: CSPR.cloud REST/Streaming is the accepted hosted data path; Casper GW should not build a chain indexer.
- Phase 10, 13, 15, 16, and 17 feed plans/audits: the current public WCSPR feed is REST-backed, CSPR.cloud-sourced, cached/rate-limited, shared-state-backed, and prunable.
- CSPR.cloud Streaming API reference: Streaming is WebSocket-based, requires an authorization header, supports `/ft-token-actions`, may emit duplicate events, and connections may close during API upgrades.

## Assumptions

- The current REST-backed public WCSPR feed remains the production-safe feed path.
- A real streaming feed requires runtime and deployment decisions that are not accepted yet, especially long-lived WebSocket process behavior and reconnect/deduplication persistence.
- It is acceptable to expose non-secret streaming readiness metadata in the existing integration-health response.

## Open Questions

- Should the first real streaming consumer run inside the Next.js runtime, a separate worker, or a deployment-specific background service?
- Should streamed rows be persisted into the existing feed cache tables or a new event table keyed by `deploy_hash` and `transform_idx`?
- Should streaming be used only for explorer freshness, or also for wallet readiness/proof refresh later?

## Prototype Reintegration Gate

This phase does not copy or implement prototype UI. It preserves the accepted reintegration boundary:

- No mock streaming product mode.
- No fake live feed rows.
- No registry/private tools/sandbox/simulated/local product modes.
- No public x402 scanner discovery.

## Phase 1: Server-Side Streaming Readiness Model

### Goal

Encode the CSPR.cloud Streaming boundary in server-only code so future agents cannot accidentally claim the public explorer has a real-time feed before the runtime and persistence design is accepted.

### Work

- Add `CSPR_CLOUD_STREAMING_BASE_URL` to the env contract with the Testnet default.
- Add a server-only streaming readiness module that returns:
  - configured streaming base URL,
  - configured REST fallback,
  - intended `/ft-token-actions` stream path,
  - configured payment-asset filter,
  - explicit `not_enabled` runtime status,
  - required future gates for reconnect, dedupe, persistence, and deployment runtime.
- Add the readiness object to `GET /api/health/integrations`.

### Real Integration Path

This is a readiness/preflight slice only. It records the real CSPR.cloud Streaming endpoint shape and future requirements. It does not open a WebSocket or consume events.

### Mock/Simulation Policy

No product mock is introduced. Tests may assert the readiness object and URL building, but the app must not render streamed rows or claim live updates.

### Checks

- Unit tests for env defaults, streaming readiness redaction, payment-asset stream URL building, and health response shape.
- Existing browser health smoke should continue to pass and must not expose secrets.
- `pnpm run guard:product`, `pnpm run guard:secrets`, `pnpm run guard:files`, focused tests, then `pnpm run ci`.

### Acceptance Criteria Covered

- Public explorer remains honest about external proof source and current REST feed.
- CSPR.cloud remains the accepted indexed-data source.
- Streaming is represented as a future real integration, not as a UI mock or fake product mode.

### Stop Condition

Stop before opening a WebSocket, adding an SSE endpoint, changing the public feed UI to "live", adding a background worker, adding deployment-specific streaming runtime, or persisting streamed events.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-24-casper-gw-phase-22-streaming-readiness-preflight.md` mapping this plan to code, tests, CI, and review evidence.

## Handoff Notes

The next accepted streaming phase should decide worker/runtime ownership first. Without that decision, the correct product behavior remains the existing REST-backed feed plus this readiness metadata.
