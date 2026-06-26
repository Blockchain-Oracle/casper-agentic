# Casper GW / Casper Agent Commerce Gateway

A Casper-native agent commerce gateway for the Casper Agentic Buildathon.

The current product shape is provider gateway + agent wallet control plane + endpoint-first paid tool console + public Casper x402 receipt explorer. Receipts separate gateway context, policy decision, x402 verify/settle state, and Casper proof.

## Status

The current authoritative context is in `.thoughts/README.md`.

The server-signing payment paths are **Casper Testnet-proven** (real deploy hashes below). The public explorer's sample stats remain labeled fixtures; a receipt is only `settled` when a real Casper Testnet deploy hash backs it.

Current product rules:

- Casper Testnet first; Mainnet later/gated.
- No user-facing Simulated/Local product modes.
- No top-level registry/private-tool MVP scope.
- No live Casper settlement claim unless a real transaction/deploy hash exists.
- Wallet funding/readiness is required, not just a static funded label.

## Payment model — one signing engine, three triggers

Every paid call settles a fresh, per-call EIP-712 `TransferWithAuthorization` (WCSPR) through the
CSPR.cloud x402 facilitator, which pays gas. There is no pre-approved session — each call is signed
once. The three ways a call is triggered all converge on the same verify → settle → Casper-proof tail:

1. **Pay with my agent wallet** (web button) — the Gateway server-signs with the UI-selected wallet
   under that wallet's spend limits + tool allowlist. Route: `POST /api/paid-calls/agent-wallet`.
2. **Connect & sign** (web) — the user's own Casper wallet approves via CSPR.click (Casper wallets only).
3. **Autonomous agent + API key** — an agent sends only a bearer token bound to a hosted wallet; the
   Gateway server-signs under policy. The MCP route (`POST /api/mcp/[sourceId]`) branches: a caller
   signature → caller-signs; a wallet-bound token → server-signs; neither → HTTP 402.

The **agent wallet** is a Casper-Gateway-held wallet (key encrypted at rest, AES-256-GCM, Testnet only —
not production custody). Policy (max-per-call, daily limit, tool allowlist, kill switch) is evaluated
**before** signing on the server-signed paths, so a blocked call produces no signature and no x402 record.

## Live Testnet proof

Signer funded; 20 WCSPR wrapped from CSPR via `pnpm wrap:wcspr`. Reproduce after `pnpm db:migrate`:

| Trigger | Command | Deploy hash |
| --- | --- | --- |
| Autonomous agent + API key | `pnpm smoke:server-signed` | [`ed099423…737df513`](https://testnet.cspr.live/deploy/ed099423396c78ca6c0c5c241f43bbbeb838622960f193ea106fe6b0737df513) |
| Pay with my agent wallet | `pnpm smoke:agent-wallet` | [`bb0698b5…37037d0`](https://testnet.cspr.live/deploy/bb0698b557e924aab11f16988cc0b1f208a7c1a8fbacc018d6581a5f577037d0) |

Both settled (`receipt.status = "settled"`, HTTP 200) against the live CSPR.cloud facilitator and the
CSPR.trade MCP `get_quote` tool. Requires a configured `.env.local` (CSPR.cloud key, signer PEM, DB).

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm verify          # guards + unit tests + typecheck + lint
pnpm db:migrate      # apply Drizzle migrations (incl. wallet_keys + token→wallet binding)

# Live Casper Testnet proofs (need .env.local; each settles ~7.5 WCSPR)
pnpm wrap:wcspr           # wrap CSPR → WCSPR for the signer
pnpm smoke:server-signed  # Trigger 3: agent + API key
pnpm smoke:agent-wallet   # Trigger 1: pay with my agent wallet
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
