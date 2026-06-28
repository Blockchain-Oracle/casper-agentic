# Casper GW — proof for every agent payment

An **x402 payment gateway on Casper** for AI agents. A provider points the gateway at an MCP server
or API and prices its tools in WCSPR. An agent mints a scoped `casper_` API key and **pays per tool
call**; the gateway settles each call on Casper Testnet and produces a real deploy hash anyone can
verify. Built for the Casper Agentic Buildathon 2026.

It is MCPay-on-Casper: the public catalogue + register flow shape of [MCPay](https://mcpay.tech),
the x402 micropayments + MCP servers from Casper's AI Toolkit, settled natively on Casper.

## Why it's agentic

The API key **is the agent's wallet.** Each key is a scoped session — *allowed tools · spend cap ·
expiry* ("autonomy with limits") — so an agent pays for services on its own, with cryptographic
proof per call, and never touches a primary key. The gateway is the trust layer; the agent just calls.

## How it works

1. **Register** (`/register`) — paste an MCP/API endpoint → the gateway discovers its tools → price each in WCSPR → publish.
2. **Browse** (`/servers` → `/servers/[id]`) — anyone can browse published servers and run a tool inline (the gateway settles the payment).
3. **Get a key** (API keys, in the nav) — mint a `casper_` key, scoped to specific tools + a spend cap. Use it from any client/agent/CLI.
4. **Pay per call** — `POST /api/paid-calls/run` with `x-api-key: casper_…`. The gateway verifies the key's scope, signs an x402 `TransferWithAuthorization` (WCSPR) with its own funded Testnet wallet, and the CSPR.cloud facilitator verifies + settles on Casper.
5. **Verify** (`/explorer`, `/receipt/[id]`) — every settlement is public: tool · amount · deploy hash → cspr.live. The receipt is a 3-layer proof (gateway context → x402 verify/settle → Casper proof).

## Architecture

- **Next.js (App Router) + Tailwind v4 + shadcn/ui** — fully public, no auth wall; the API key is the spend boundary.
- **x402 on Casper** — `@make-software/casper-x402` (`exact` scheme) + `@x402/fetch`, settled through the hosted **CSPR.cloud x402 facilitator** (verify/settle). No Casper node or indexer to run.
- **Gateway-signer model** — the gateway signs every payment from one funded Testnet wallet (env PEM). Managed, Testnet-only — **not production custody**, and labelled as such.
- **Postgres (Drizzle)** — provider sources/tools/prices, API keys, paid-call attempts, x402 records, Casper proofs.
- **Asset** — WCSPR (wrapped CSPR, 1:1). It is the only settle-able Casper x402 asset today; `tool_prices` stores asset/network/payee per tool so multi-asset is a config change later.

## Live Testnet proof

Real settlements through the gateway-signer path (reproduce with `pnpm smoke:live`):

| Path | Deploy hash |
| --- | --- |
| Gateway-signer settle | [`96da2620…29290741`](https://testnet.cspr.live/deploy/96da262075cc6634188ee8544d5ad043b33b9ec39f7aa55eb297023829290741) |
| Agent API-key settle | [`4ab57794…d5cedc83`](https://testnet.cspr.live/deploy/4ab57794dc8e2f36cba9144b088a20e67815a750b2289cb1210804b1d5cedc83) |

A receipt is only `settled` when a real Casper deploy hash backs it.

## Run it

Needs `pnpm@10.33.0` and a `.env.local` (see `.env.example`: CSPR.cloud key, Casper signer PEM, payee, `DATABASE_URL`).

```bash
docker compose up -d        # Postgres (start Docker/OrbStack first)
pnpm install
pnpm db:migrate
pnpm dev                    # http://localhost:3000

# quality gates
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# real Casper settlement (needs a funded gateway wallet)
CASPER_WCSPR_WRAP_AMOUNT=<motes> pnpm wrap:wcspr   # wrap CSPR → WCSPR when low (7.5 WCSPR/call)
pnpm smoke:live                                    # end-to-end → real Casper deploy hash
```

Routes: `/` landing · `/servers` → `/servers/[id]` · `/explorer` · `/receipt/[id]` · `/register`. API keys open from the nav.

## Pay from an agent / CLI

```bash
curl -X POST http://localhost:3000/api/paid-calls/run \
  -H "x-api-key: casper_…" \
  -H "content-type: application/json" \
  -d '{"endpointUrl":"https://mcp.cspr.trade/mcp","toolName":"get_quote","args":{"amount":"10","token_in":"CSPR","token_out":"WCSPR","type":"exact_in"}}'
# → { "status": "settled", "explorerUrl": "https://testnet.cspr.live/deploy/…" }
```

The gateway enforces the key's scope before settling: an out-of-scope tool returns `403`, an over-cap
call `402`, a revoked/invalid key `401` — none of which settle.

## Honesty

- `settled` / deploy-hash links require a real Casper Testnet deploy hash. No fixtures in product surfaces.
- The gateway settlement wallet is a managed **Testnet** wallet, never presented as user custody.
- Public receipts redact private inputs/outputs, provider credentials, and API keys.
