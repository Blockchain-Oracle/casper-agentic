# AGENTS.md

## Project Snapshot

Casper GW (Casper Agent Commerce Gateway) is a Next.js App Router app for the Casper Agentic Buildathon. It **is MCPay, on Casper** (Abu's framing): a public gateway where you register an MCP/API server, price its tools in WCSPR, and agents pay per call with an API key; the gateway signs each x402 payment with its own funded Testnet wallet, settles on Casper, and produces a real deploy hash anyone can verify in the public explorer.

Active rebuild plan: `/Users/abu/.claude/plans/now-i-m-trying-to-delegated-lampson.md` (companion `.thoughts/plans/2026-06-27-casper-gw-mcpay-rebuild-plan.md`). Deeper context in `.thoughts/` (wiki, research, raw reports, cloned reference repos, spec, stories) — start at `.thoughts/README.md`.

## Reference Repos — READ THE SOURCE, don't guess

The clones in `.thoughts/raw/repos/` are the product blueprint: **MCPay** (`MCPay/apps/app`) and **Cronos402** (`cronos402/app`) for the gateway UX/flows, **x402scan** (`x402scan/apps/scan`) for the explorer, **casper-x402** for the x402/Casper protocol, **csprclick-examples** for wallet connect.

- **Before implementing any UI, flow, or pattern that mirrors a reference, open and READ the actual reference source file(s) for that exact surface — in the same turn — and state which files you read.** A sub-agent summary, an earlier digest, or your memory is NOT a substitute for the primary source at implementation time.
- "Take inspiration from X" / "check X" means: read X's source for the thing you are building, **now, before building**. "Don't copy" means don't paste their code — it does NOT mean don't read it closely. Match their proven structure, then adapt to Casper.
- Saying "I'll check MCPay" is not checking MCPay. Reading the file is. When unsure about a surface, the answer is in the reference's source, not your interpretation of it.

## Current Product Shape (post 2026-06-27 pivot)

- **Public-first, NO authenticated `/app`** (MCPay has none). Every route is public: `/` landing, `/servers` (browse MCP servers) → `/servers/[id]` (a server's tools + inline Run/Pay accordion), `/explorer` (x402 settlement ledger), `/receipt/[id]` (public proof), `/register` (add a server). Sign-in/keys are modals, not pages.
- **Payment = API-key / managed-wallet model.** The gateway signs every x402 payment with ONE funded Testnet wallet (env PEM). There are **NO per-user agent wallets and NO spend policy** — removed in the pivot. The only pre-settlement gate is a funding-readiness check.
- **Receipt = 3 real layers**: gateway context → x402 verify/settle → Casper proof. (The old "policy decision" layer was removed.)
- **Asset = WCSPR** — the only settle-able Casper x402 asset (native CSPR is wrapped 1:1 to WCSPR; paying WCSPR IS paying CSPR). USDC does not exist on Casper. `tool_prices` holds asset/network/payTo per tool, so multi-asset is a future config change, not a rewrite.
- **Design = "Proof-Print"**: Tailwind v4 + shadcn/ui, Casper red `#FF473E`, dark console + bone receipt-paper surfaces, the proof-stamp signature. One global light/dark toggle (next-themes `data-theme`).

## Working Pace And Quality Bar

- The June 30, 2026 deadline is NOT a working constraint. Never invoke it to justify cutting scope, skipping gates, or rushing.
- Deadline pressure never licenses mediocre work, half-finished slices, fake/stubbed product behavior, or mock/placeholder/aspirational docs.
- Documentation must describe real, verified behavior only. Abu strongly dislikes mock/placeholder docs.
- Default to doing it right over fast-and-wrong. Verify (lint/typecheck/build/test, and a real run where relevant) before claiming progress is stable.

## Research Source Order

- For product/UX/x402/Casper questions, check local context first — **read the actual source** in `.thoughts/raw/repos/` (per the Reference Repos rule), plus `.thoughts/wiki/`, `.thoughts/research/`, `.thoughts/raw/`, and the active plan.
- Use **Context7** for current library/API/SDK/CLI syntax. Abu actively WANTS online + library research — use it; do not reinvent solved problems by hand (API keys, schema forms, tables, etc.).
- For CSPR.click: `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`, then `.thoughts/raw/repos/csprclick-examples/`, then `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/`, then Context7.

## Working Rules

- Keep provider upstream credentials, client API-key access, and the gateway x402 signer separate.
- Do not claim live Casper settlement unless a real Casper deploy hash exists.
- Do not present `Simulated`/`Local` as user-facing product modes. Framing is Casper Testnet first, Mainnet later/gated.
- Public explorer is public infrastructure: `/explorer` + receipt detail must be viewable with no sign-in or wallet.
- Browser/CSPR.click x402 signing does NOT settle on Casper yet (the provider rejects the typed-data scheme) — it is deferred; lead with the gateway-signer/API-key path that really settles.
- Do not re-introduce agent wallets, spend policy, the `/app` shell, or a 4th receipt layer unless Abu explicitly re-accepts them.
- Do not invent private tools/registries, or CDR / Story Protocol / cdr-kit semantics.

## Commands

Use `pnpm@10.33.0`. Do not reintroduce `package-lock.json`.

```bash
pnpm dev        # next dev (Turbopack) on :3000
pnpm lint
pnpm typecheck
pnpm build
pnpm test       # vitest

# real Casper settlement (needs Postgres up + a funded gateway wallet):
docker compose up -d            # Postgres (start OrbStack/Docker first: open -a OrbStack)
pnpm db:migrate
pnpm smoke:live                 # end-to-end real settle -> real Casper deploy hash
CASPER_WCSPR_WRAP_AMOUNT=<motes> pnpm wrap:wcspr   # top up the gateway wallet's WCSPR
```

Context7: `eval "$(/opt/homebrew/bin/brew shellenv)" && npx ctx7@latest library <name> "<question>"`

## Gotchas

- **Never run `pnpm build` while `pnpm dev` is running** — it corrupts `.next` and serves stale code. Kill dev, `rm -rf .next`, restart.
- A second `pnpm dev` silently binds port 3001; kill all `next dev` / `next-server` and free 3000 before restarting.
- The gateway wallet must hold WCSPR (7.5/call) + CSPR gas, or every paid call returns `blocked` (not a bug — fund it). See memory `casper-gw-gateway-wallet-funding`.
- next-themes uses `attribute="data-theme"`; the Tailwind v4 dark variant must target `[data-theme=dark]`, not `.dark`.

## Quality Gates

- Run lint, typecheck, build (and tests) before claiming progress is stable.
- Browser-check desktop + mobile, public routes, the settle path, and the receipt proof layers.
- Source files target 200 lines; hard-fail above 300 unless generated or justified in `.thoughts/quality/`. Do not enforce this on `.thoughts/raw/repos/`.

## Do Not

- Do not commit `.env`, wallet keys, seed phrases, CSPR.cloud tokens, provider API keys, or private keys.
- Do not use live-looking mock secret prefixes such as `sk_live`.
- Do not expose provider upstream credentials in client config, receipts, exports, browser state, or user-facing logs.
