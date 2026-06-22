# Casper GW / Casper Agent Commerce Gateway

A Casper-native agent commerce gateway for the Casper Agentic Buildathon.

The current product shape is provider gateway + agent wallet control plane + endpoint-first paid tool console + public Casper x402 receipt explorer. Receipts separate gateway context, policy decision, x402 verify/settle state, and Casper proof.

## Status

The current authoritative context is in `.thoughts/README.md`.

Planning is allowed after prototype reintegration. Active app code has been cleaned of the older registry, sandbox, and simulated/local-mode product concepts, but it is still fixture-backed and must not be treated as live Casper settlement.

Current product rules:

- Casper Testnet first; Mainnet later/gated.
- No user-facing Simulated/Local product modes.
- No top-level registry/private-tool MVP scope.
- No live Casper settlement claim unless a real transaction/deploy hash exists.
- Wallet funding/readiness is required, not just a static funded label.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

Open the public overview at [http://localhost:3000](http://localhost:3000), the operator app at [http://localhost:3000/app](http://localhost:3000/app), and the public explorer at [http://localhost:3000/explorer](http://localhost:3000/explorer).

## Context Sources

- Front door: `.thoughts/README.md`
- Current product truth: `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- Current quality profile: `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- Current spec: `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- Current stories: `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- Current reintegration handoff: `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Designer reset brief: `.thoughts/design/2026-06-22-designer-reset-brief.md`
- Designer reset prompt: `.thoughts/design/2026-06-22-designer-reset-prompt.md`

## Demo Path

1. Provider connects source and discovers tools.
2. Provider selects/prices a tool and publishes hosted MCP/x402 endpoint.
3. Operator connects/provisions wallet.
4. Operator funds wallet and reaches readiness.
5. Operator configures spend policy.
6. Paid Tool Test Console discovers endpoint tools and runs a paid call.
7. Receipt is created.
8. Public explorer shows gateway context, policy decision, x402 state, and Casper proof.
9. Settings/Audit expose trust boundaries.

## Proof Honesty

- Endpoint/provider liveness is not settlement/proof liveness.
- Fixture data must be labeled as fixture/sample.
- `Paid on Testnet`, `settled`, or deploy-hash links require a real Casper Testnet deploy hash.
- Public receipts must redact private request inputs, outputs, provider credentials, MCP client tokens, and internal policy config.
