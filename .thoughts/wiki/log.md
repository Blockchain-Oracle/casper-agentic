# Wiki Log

## 2026-06-17

- Ingested user-provided hackathon brief into `../raw/hackathon-brief-pasted-text.txt`.
- Created source index for Casper Agentic Buildathon, Casper docs, AI Toolkit, CSPR.cloud, CSPR.trade MCP, npm packages, and GitHub repositories.
- Cloned `casper-network/docs-redux` `dev` branch into `../raw/repos/docs-redux` at commit `34b2071b550feef46fcdbb40bb87f1a711df8958`.
- Added initial domain pages:
  - `casper-agentic-buildathon.md`
  - `casper-ecosystem-tooling.md`
  - `cspr-trade-mcp-and-x402.md`
- Added `casper-docs-redux-map.md` after local repo inspection.
- Added main reality research brief at `../research/2026-06-17-casper-agentic-buildathon-reality.md`.
- Added docs-redux research brief and pre-build quality profile.

## 2026-06-18

- Added `../raw/submission-landscape-2026-06-18.md` with DoraHacks and GitHub search surfaces for existing public buildathon submissions and related repos.
- Added `../research/2026-06-18-opportunity-landscape-from-existing-submissions.md` as a facts-only opportunity landscape from existing evidence.
- Added `opportunity-landscape.md` to the wiki and linked it from the index.
- Expanded `../raw/source-index.md` with observed DoraHacks and GitHub submission/repo sources.
- Added `../raw/external-x402-agent-winner-landscape-2026-06-18.md` with external x402 winner, agent-wallet, Stellar/Solana/Coinbase, GitHub topic, and Casper DeFi source notes.
- Added `../research/2026-06-18-external-x402-agent-winner-patterns.md` as a facts-only comparison of external winner patterns and Abu's agent-wallet hypothesis.
- Added `x402-ai-agent-winner-patterns.md` to the wiki and linked it from the index.
- Added `../raw/stellar-agents-winners-2026-06-18.md` from Abu-provided Stellar winner links, including direct repo evidence for Cards402, CleverCon, RenderGate, x402-mcp-stellar-template, and TollPay.
- Updated the external x402 winner research and wiki page to replace the earlier Stellar-winners gap with the verified winner set and its agent-payment infrastructure pattern.
- Added `../raw/api-mcp-x402-wallet-gateway-2026-06-18.md` with OpenAPI-to-MCP, MCP monetization, wallet policy, and Casper x402 source notes.
- Added `../research/2026-06-18-agent-commerce-gateway-reality.md` for the researched API/MCP monetization plus agent wallet-control-plane product direction.
- Added `agent-commerce-gateway-thesis.md` to the wiki and linked it from the index.
- Added `../raw/casper-x402-explorer-2026-06-18.md` and `../research/2026-06-18-casper-x402-explorer-reality.md` for Abu's proposed Casper x402 explorer/receipt layer.
- Updated `agent-commerce-gateway-thesis.md` from a two-sided gateway into a three-pillar product: provider gateway, agent wallet control plane, and Casper x402 explorer/receipt layer.
- Added `../research/2026-06-18-casper-x402-onchain-identification.md` to clarify that Casper chain data can identify the `transfer_with_authorization` settlement shape, but full x402 resource/tool context requires gateway/facilitator records.
- Added `../research/2026-06-18-mcp-gateway-auth-reality.md` to separate provider upstream credentials, MCP client authentication, and Casper x402 wallet authorization before writing the spec.
- Added `../raw/agent-commerce-gateway-reality-refresh-2026-06-18.md` and `../research/2026-06-18-agent-commerce-gateway-reality-refresh.md` after refreshing Context7, CSPR.cloud, Casper x402, CSPR.trade MCP, x402 foundation, and x402scan sources.
- Added `agent-commerce-gateway-product-context.md` to lock the approved five-surface product shape and the three-part auth boundary before implementation planning.
- Added quality, spec, stories, designer brief, research-backed plan, verification audit, and handoff artifacts for the Agent Commerce Gateway planning pipeline.

## 2026-06-22

- Added `agent-commerce-gateway-current-truth.md` after prototype reintegration and Claude Code review.
- Recorded current corrections: registry/private-tool semantics are no longer MVP scope, Demo Sandbox is now Paid Tool Test Console, Simulated/Local product modes are removed, wallet funding/readiness is required, and CSPR.cloud is the default hosted indexer/facilitator path.
- Added current v2 spec and stories:
  - `../specs/2026-06-22-casper-gw-current-spec.md`
  - `../stories/2026-06-22-casper-gw-current-stories.md`
- Added fresh designer reset artifacts:
  - `../design/2026-06-22-designer-reset-brief.md`
  - `../design/2026-06-22-designer-reset-prompt.md`
- Added current quality profile:
  - `../quality/2026-06-22-casper-gw-current-quality-profile.md`
  - Initially recorded that lint/typecheck/build passed, but active `src/` still contained stale registry/sandbox/simulated-local prototype semantics that needed removal before implementation handoff.
- Cleaned active app source and added focused verification audit:
  - Removed registry/private-tool, sandbox, and Simulated/Local active product surfaces from `src/`.
  - Added public `/explorer` and operator `/app` route separation.
  - Added `../verification/2026-06-22-active-source-cleanup-audit.md`.
- Migrated package manager from npm to pnpm:
  - Added `pnpm-lock.yaml`, pinned `pnpm@10.33.0`, removed `package-lock.json`, and updated active project commands.
  - Added `../verification/2026-06-22-pnpm-migration-audit.md`.
