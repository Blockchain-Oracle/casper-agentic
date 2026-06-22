# Handoff: Casper Agent Commerce Gateway

Date: 2026-06-18
Status: Context Engineering planning pipeline complete, pending user approval for implementation.

## Current Product Decision

Build a Casper-native Agent Commerce Gateway with five surfaces:

1. Provider Gateway for APIs/OpenAPI/MCP sources, upstream auth, pricing, and hosted MCP/x402 endpoints.
2. Agent Wallet Control Plane for Casper wallets, funding state, spend policies, and safe agent payments.
3. Casper x402 Explorer/Receipt Layer joining gateway/facilitator context to Casper transaction/deploy proof.
4. Discovery/Registry for published paid tools.
5. Demo Agent Sandbox for a guided paid call.

## Most Important Reality Notes

- Casper x402 has a real path through CSPR.cloud and `make-software/casper-x402`.
- CSPR.cloud supports `/supported`, `/verify`, and `/settle` for Casper x402.
- `/settle` returns a Casper deploy hash on success.
- Casper x402 uses CEP-18 `transfer_with_authorization` and EIP-712 signatures.
- Remote MCP auth is OAuth/Bearer; it is not the same as x402 payment authorization.
- Provider upstream credentials must stay server-side.
- The explorer must be hybrid: gateway event context plus raw Casper proof.
- The root workspace is not an app yet; it is research/artifacts only.

## Key Artifacts

- Reality refresh: `.thoughts/research/2026-06-18-agent-commerce-gateway-reality-refresh.md`
- Product wiki context: `.thoughts/wiki/agent-commerce-gateway-product-context.md`
- Quality profile: `.thoughts/quality/2026-06-18-agent-commerce-gateway-quality-profile.md`
- Spec: `.thoughts/specs/2026-06-18-agent-commerce-gateway.md`
- Stories: `.thoughts/stories/2026-06-18-agent-commerce-gateway.md`
- Designer brief: `.thoughts/design/2026-06-18-designer-brief.md`
- Plan: `.thoughts/plans/2026-06-18-agent-commerce-gateway.md`
- Verification audit: `.thoughts/verification/2026-06-18-agent-commerce-gateway-planning-audit.md`

## Open Decisions Before Code

- Implementation stack: TypeScript-first is recommended, but not approved.
- Wallet signing mode: generated demo wallet, user-provided test key, CSPR.click, local signer, or hosted encrypted signer.
- Settlement mode: live Casper Testnet first or simulated first with live integration after UI proof.
- Provider source first path: manual route, OpenAPI import, or existing MCP proxy.
- Storage: SQLite for local demo vs hosted Postgres.
- Client auth MVP: static scoped token first, OAuth/Bearer architecture next.

## Suggested Next User Decision

Approve or adjust the spec/story/design/plan bundle before implementation starts.

If approved, the first implementation slice should be:

1. Scaffold a TypeScript app.
2. Build mocked high-fidelity UI from the designer brief.
3. Add local persisted models for provider source, tool, wallet policy, and receipt.
4. Add demo sandbox with simulated settlement state.
5. Integrate real Casper x402 after the loop is visible and stable.

## Do Not Lose

- The API-key/OAuth question is not a single decision. It is three boundaries:
  - provider upstream credentials,
  - MCP client auth,
  - wallet/payment authorization.
- The explorer is not a Casper chain-wide scanner for MVP.
- The strongest judging story is one complete paid tool call with a Casper-linked receipt.
