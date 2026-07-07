<h1 align="center">Casper GW</h1>

<p align="center"><b>An x402 payment gateway on Casper — publish paid MCP/API tools, let AI agents pay per call with an API key, and verify every settlement on-chain.</b></p>

<p align="center">
  <a href="https://cspr-gw.xyz">Testnet app</a> ·
  <a href="https://mainnet.cspr-gw.xyz">Mainnet app</a> ·
  <a href="https://cspr-gw.xyz/explorer">Explorer</a> ·
  <a href="https://www.canva.com/design/DAHOv1B8K_4/d2msxRqQqhGepb0Lw82w0A/view">Pitch deck</a> ·
  <a href="https://github.com/Blockchain-Oracle/casper-agentic">Source</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Blockchain-Oracle/casper-agentic/main/assets/banner.png" alt="Casper GW — proof for every agent payment" width="960" />
</p>

**Casper GW is MCPay, on Casper.** A provider points the gateway at an MCP server or HTTP API and prices its tools in WCSPR. An AI agent calls a tool with a scoped `casper_` API key; the gateway verifies the key, signs an x402 payment with its own funded Casper wallet, settles it through the CSPR.cloud facilitator, runs the tool, and returns the result plus a **real Casper deploy hash** anyone can verify. The whole loop — connect, register, price, pay, prove — is public with no account required to look.

> ⚠️ **Unaudited hackathon software** built for the Casper Agentic Buildathon 2026. **Testnet** ([cspr-gw.xyz](https://cspr-gw.xyz)) is the recommended surface. Mainnet is deployed and browsable; real-money settlement lights up once the mainnet gateway wallet is funded.

## Live deployments

| Surface | URL | Network |
|---|---|---|
| App (testnet) | <https://cspr-gw.xyz> | Casper Testnet |
| App (mainnet) | <https://mainnet.cspr-gw.xyz> | Casper Mainnet |
| Explorer (settlement ledger) | <https://cspr-gw.xyz/explorer> | public, no sign-in |
| Source | <https://github.com/Blockchain-Oracle/casper-agentic> | — |

**Network is per-deployment, not a runtime toggle.** One codebase; each domain builds for one network (its own database, gateway wallet, CSPR.click app id, and WCSPR contract). The nav/footer badge shows which network you're on.

## The agentic loop

1. **Register** (`/register`) — point the gateway at an MCP or HTTP endpoint. It discovers the tools; the owner prices each one in WCSPR and picks the **payout wallet** (defaults to their connected wallet — providers earn to their own account).
2. **Get a funded key** (Account → Developer keys) — mint a `casper_` key scoped to specific tools with a spend cap, and fund it by depositing CSPR (auto-wrapped to WCSPR).
3. **Pay per call** — an agent calls the hosted MCP endpoint (or `POST /api/paid-calls/run`) with the key. The gateway settles the x402 payment on Casper and returns the tool result + payment response + receipt id.
4. **Verify** — every settlement is public on `/explorer` and `/receipt/[id]`: tool · amount · deploy hash → cspr.live. The receipt is a **3-layer proof**: gateway context → x402 verify/settle → Casper on-chain proof.

## Architecture

Casper GW is a Next.js app on Vercel with Postgres (Neon). It holds no custody model beyond one funded gateway signer per deployment; the agent's spend boundary is the API key.

<p align="center"><img src="https://raw.githubusercontent.com/Blockchain-Oracle/casper-agentic/main/assets/diagrams/architecture.png" alt="Casper GW system architecture" width="1000" /></p>

### A paid call, end to end

The gateway signs every payment with its own wallet — no wallet pop-ups, no per-user custody. A rejected key never settles.

<p align="center"><img src="https://raw.githubusercontent.com/Blockchain-Oracle/casper-agentic/main/assets/diagrams/settle-sequence.png" alt="Paid-call settlement sequence" width="900" /></p>

### One codebase, one network per domain

<p align="center"><img src="https://raw.githubusercontent.com/Blockchain-Oracle/casper-agentic/main/assets/diagrams/domain-network.png" alt="Domain equals network deployment separation" width="720" /></p>

## Casper contracts & accounts

Casper GW does **not** deploy a custom on-chain contract — it settles CEP-18 **WCSPR** (Wrapped CSPR, the only settle-able Casper x402 asset today) through CSPR.cloud's hosted x402 facilitator. These are the on-chain identifiers the gateway interacts with:

### Casper Testnet

| What | Address | Explorer |
|---|---|---|
| WCSPR CEP-18 contract (settlement asset) | `3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e` | [cspr.live](https://testnet.cspr.live/contract-package/3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e) |
| Gateway settlement account | `bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12` | [cspr.live](https://testnet.cspr.live/account/bcf0dfd8955b196a69d9265ffa746b499b7644d12ed2cdc5dea01d914c1fdc12) |

### Casper Mainnet

| What | Address | Explorer |
|---|---|---|
| WCSPR CEP-18 contract (settlement asset) | `8df5d26790e18cf0404502c62ce5dc9025800ad6975c97466e20506c39c505b6` | [cspr.live](https://cspr.live/contract-package/8df5d26790e18cf0404502c62ce5dc9025800ad6975c97466e20506c39c505b6) |

The x402 facilitator is CSPR.cloud's hosted service at `https://x402-facilitator.cspr.cloud` (its `/supported` advertises `casper:casper` and `casper:casper-test`, `exact` scheme).

## Evidence — real Casper Testnet settlements

Every `settled` receipt is backed by an accepted Casper deploy. Reproduce with `pnpm smoke:live`.

| Flow | Deploy hash |
|---|---|
| Gateway-signed paid call | [`829f0704…a83f27e7`](https://testnet.cspr.live/deploy/829f070480a09e049897813b766e5e81e3be2f9e563f906c38d1ce92a83f27e7) |
| Gateway-signed paid call | [`37a85c9a…885ff83d`](https://testnet.cspr.live/deploy/37a85c9a61ecd8402da58154498b512e95a3f1c3b36b694ae64ea199885ff83d) |
| Agent API-key paid call | [`4ab57794…d5cedc83`](https://testnet.cspr.live/deploy/4ab57794dc8e2f36cba9144b088a20e67815a750b2289cb1210804b1d5cedc83) |
| Gateway WCSPR top-up (wrap) | [`40708a30…81ea4efc`](https://testnet.cspr.live/transaction/40708a307153c9f8469faddaf154848a61591e1869c08d109a8f783581ea4efc) |

## What we do NOT claim

- The gateway signer is a **managed** wallet, one per deployment — not user custody, and labelled as such.
- Mainnet is **deployed and browsable**, but real-money settlement is pending a funded mainnet gateway wallet — the app honestly shows "gateway not ready to settle" until then.
- Browser/CSPR.click *wallet-direct* x402 signing does not settle on Casper yet (the facilitator rejects the typed-data scheme); the proven path is the gateway-signer + API-key model above.
- WCSPR is the only settle-able Casper x402 asset today (native CSPR wraps 1:1 to WCSPR); USDC does not exist on Casper.

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
CASPER_WCSPR_WRAP_AMOUNT=<motes> pnpm wrap:wcspr   # wrap CSPR → WCSPR when the gateway runs low (7.5/call)
pnpm smoke:live                                    # end-to-end → real Casper deploy hash
```

Routes: `/` landing · `/servers` → `/servers/[id]` · `/explorer` · `/receipt/[id]` · `/register`. Sign-in and keys are modals from the nav.

## Pay from an agent / CLI

```bash
curl -X POST https://cspr-gw.xyz/api/paid-calls/run \
  -H "x-api-key: casper_…" \
  -H "content-type: application/json" \
  -d '{"endpointUrl":"https://mcp.cspr.trade/mcp","toolName":"get_currencies","args":{}}'
# → { "status": "settled", "explorerUrl": "https://testnet.cspr.live/deploy/…" }
```

The gateway enforces the key's scope before settling: an out-of-scope tool returns `403`, an over-cap or insufficient-balance call `402`, a revoked/invalid key `401` — none of which settle.

## Repository layout

```
src/app/            Next.js App Router — public pages + API routes (/api/mcp, /api/paid-calls, /api/provider, …)
src/server/         gateway core — live-paid-call (settle), x402 payment + facilitator, api-keys, provider store
src/components/     Proof-Print UI (Tailwind v4 + shadcn) — nav, account, manage, receipt, csprclick
src/lib/            client-safe libs — casper-networks registry, formatters, receipt models
src/db/             Drizzle schema + migrations (Postgres)
scripts/            ops — live smoke, WCSPR wrap
assets/             banner, screenshots, and rendered architecture diagrams (.mmd → .png)
```

## Credits

- **CSPR.cloud** (make-software) — hosted Casper indexer + x402 facilitator (verify/settle) + CSPR.click wallet connect. Casper GW runs no node or indexer of its own.
- **casper-x402** (`@make-software/casper-x402`) — the `exact` Casper x402 scheme.
- **MCPay** — the public-catalogue / register / pay-per-call product shape, adapted to Casper.
- Casper Network AI toolkit and CSPR.trade (`mcp.cspr.trade`) — the demo MCP server the gateway settles against.
