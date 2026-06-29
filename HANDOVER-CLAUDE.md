# Casper GW — Handover for Claude Code

> Supersedes `HANDOVER-CODEX.md` for the Claude Code path. Current as of **2026-06-29**, branch
> `feat/casper-gw-mcpay-rebuild`, HEAD `94ed838` ("finish wallet account and server UX").
> The old Codex handoff's P1–P5 are now **largely landed** — do not work from them. The real open work
> is in §4, derived from today's audit. Read it, audit the repo against it, finish the open items, and
> verify each in a real browser before claiming done.

**Stack:** Next.js 16 (App Router) · React 19 · TS · Tailwind v4 + shadcn/ui · Drizzle + Postgres · pnpm@10.33.0
**Run:** `docker compose up -d` → `pnpm db:migrate` → `pnpm dev`. Gates: `pnpm verify` (guards + test + typecheck + lint).

---

## 0. Orient FIRST (read in order)

1. **This file.**
2. **`AGENTS.md`** — hard rules (`CLAUDE.md` just delegates to it). Most important rule: **read the
   reference source before building any surface** (`.thoughts/raw/repos/MCPay/apps/app` + `cronos402`).
   Abu's #1 recurring complaint is building from interpretation instead of reading MCPay's actual code.
3. **`.thoughts/README.md`** (context front door) and **`.thoughts/verification/2026-06-29-mcpay-ux-ownership-audit.md`**
   — the latter is the **current truth** of what's done and what's still open (its "Remaining Gaps" = §4 here).
4. **On your machine (Claude Code can read these; the Cowork session that wrote this file could not):**
   the plan `/Users/abu/.claude/plans/now-i-m-trying-to-delegated-lampson.md` and memory under
   `/Users/abu/.claude/projects/-Users-abu-dev-hackathon-casper-agentic/memory/`.
5. **Reference source (open before building each surface, state which files you read):**
   `.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/` (`account-modal.tsx`, `user-modal.tsx`,
   `connect-panel.tsx`, `tool-execution-modal.tsx`), `cronos402/app/...`, and for wallet
   `.thoughts/raw/repos/csprclick-examples/csprclick-react/src/ClickContext.tsx` +
   `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`.

---

## 1. FIRST ACTION — stabilize the uncommitted WIP before anything new

`git status` shows a large uncommitted working set: the **2026-06-29 MCPay UX ownership patch**. Notable
touched/new areas: `src/components/account/*` (Account modal — Wallet/Developer-keys/Fund tabs),
`src/components/connect/connect-key-dropdown.tsx`, `src/components/tools/server-tools.tsx`,
`src/app/manage/[id]/` (new), `src/server/destructive-action-guard.ts`, plus several `src/server/*`,
`src/app/api/*`, and test files. `HANDOVER-CODEX.md` and `.claude/` are untracked too.

Do this first:
- **Diff and read the working set** so you understand what the previous pass changed (don't trample it).
- **Run `pnpm verify`** yourself. (Today's audit reports `typecheck` + `lint` pass — verify, don't trust.)
- **Commit in logical chunks** with clear messages. Do not start new features on top of an uncommitted pile.

---

## 2. What the product IS (don't redesign it)

MCPay-on-Casper: a public x402 payment gateway. A provider registers an MCP/OpenAPI server and prices
its tools in WCSPR; an agent mints a `casper_` API key and **pays per tool call**; the gateway
signs + settles each x402 payment with its own funded Testnet wallet and produces a real Casper deploy
hash, publicly verifiable on `/explorer` → cspr.live. **WCSPR is the only settle-able asset.** Identity =
"Proof-Print" (Casper red `#FF473E`, dark console + bone receipt-paper).

**Honest constraint that bounds everything:** browser/CSPR.click x402 *signing* does NOT settle on
Casper — the facilitator rejects the typed-data scheme (`SIGNATURE_SCHEME_NOT_SUPPORTED`). So the
gateway signs every payment; the agent never signs. **CSPR.click connect = identity only** (read the
public key for attribution), not a payment path. No browser-approved settlement/deploy proof has been
claimed. Do not wire `signTypedData` into any pay flow.

**Do Not (from AGENTS.md):** reintroduce agent wallets, spend policy, the `/app` auth shell, a 4th
receipt layer, `Simulated`/`Local` user-facing modes, fake proof, production-custody or Mainnet claims.

---

## 3. DONE + verified — don't rebuild (attributed)

Engine (real, Testnet-proven — real deploy hashes; reproduce with `pnpm smoke:live`):
- Hosted MCP server `src/app/api/mcp/[sourceId]/route.ts`; funded keys + claim/spend-down; gateway-signer
  settle path; OpenAPI + MCP on one settle engine; public `/explorer` + `/receipt/[id]`.

Landed UX since the Codex handoff (commits `3b12254`, `cc731ed`, `94ed838` + the uncommitted 2026-06-29 patch):
- **Mobile dialog fix** committed (`cc731ed`).
- **CSPR.click connect wired** (`3b12254`): `CsprClickProvider` in `layout.tsx` with `#app` + `#csprclick-ui`
  containers; `<ConnectWalletButton/>` in `site-nav.tsx`; `showTopBar:false`. Identity only.
- **Server logos** via `src/components/servers/server-logo.tsx`.
- **Account modal** (`src/components/account/*`): Wallet / Developer-keys / Fund tabs.
- **API keys are first-class** (dropdowns, not "create every time"); consumer keys cleaned; paid runner
  shows amount/network/payTo/key-balance/signer-readiness; destructive ops gated by `x-casper-gw-admin-token`.

Honesty: the 2026-06-29 audit was a static "conditional pass" (`typecheck`+`lint` only). No running-app or
browser verification was done in that pass — treat browser behavior as unverified until you check it.

---

## 4. OPEN WORK (current truth — from the 2026-06-29 audit "Remaining Gaps")

Read the reference source for each surface FIRST. Verify each in a real browser. Order:

**P1 — Real owner management (HIGH).** The DB has no owner columns and there's no wallet-signed owner
session, so manage/delete is only `admin-token`-gated, **not** truly owner-secure — do not present it as
secure until this lands. Needs: `owner_public_key` + `owner_account_hash` columns on provider sources and
consumer keys; a wallet-signed nonce/session flow; owner checks on source manage/delete, key
list/create/revoke/fund, tool price/publish/select, and rediscovery.
*Read first:* MCPay `account-modal.tsx` + `user-modal.tsx`. *Done =* a connected wallet can manage only
its own sources/keys via a wallet-signed session; schema migrated (`drizzle/`); `pnpm verify` green;
checked in Firefox.

**P2 — Direct WCSPR funding from the wallet (MED).** Today the Fund tab opens CSPR.click + copies the
deposit address + reveals a manual claim form. Needs: browser-exposed CSPR.click `send`; a verified
CEP-18 WCSPR transfer builder for the configured payee; a recipient public-key / supported account-hash
path; and a mapping from the CSPR.click send result to a key-credit claim.
*Read first:* the CSPR.click skill + `ClickContext.tsx`, and the repo's CEP-18 helpers. *Done =* a
connected wallet funds a key in one flow with a verifiable on-chain claim.

**P3 — Connect flow MCPay-style tabs (MED).** The connect flow still lacks separate **Client / Config /
Code** tabs. *Read first:* MCPay `connect-panel.tsx`. *Done =* connect matches MCPay's three-tab shape
(one-click client deeplinks + config + code snippets), built with shadcn.

**P4 — Recursive schema inputs (MED).** The Run/Pay schema form still needs recursive **object** and
**array** controls for nested tool params. *Read first:* MCPay + cronos402 `tool-execution-modal.tsx`.
*Done =* nested/array params render and submit correctly for a real tool.

---

## 5. Run / verify / gotchas

```bash
docker compose up -d                 # Postgres (start OrbStack/Docker first)
pnpm db:migrate                      # drizzle
pnpm dev                             # http://localhost:3000
pnpm verify                          # guards + test + typecheck + lint  (run before claiming done)
pnpm smoke:live                      # real Casper Testnet deploy hash
CASPER_WCSPR_WRAP_AMOUNT=75000000000 pnpm wrap:wcspr   # top up gateway WCSPR when low
```

- **Port collision:** Abu also runs `deepbook-enoki-login` which grabs `:3000`. If `localhost:3000` shows
  "DeepBookie", free 3000 or run `PORT=3100 pnpm dev`. Confirm the title "Casper GW".
- **Never `pnpm build` while `pnpm dev` runs** (corrupts `.next`): kill dev, `rm -rf .next`, then build.
- **Gateway wallet must hold WCSPR** (~7.5/call) or live settles return `blocked` (not a bug) → `wrap:wcspr`.
- **Wallet connect can't be verified headless** — ask Abu to click through in Firefox with his Casper
  wallet, or drive his browser. Be explicit about what you verified vs. what still needs his browser.
- **Secrets in `.env`** (`DATABASE_URL`, `CSPR_CLOUD_API_KEY`, signer PEM, payee, `CASPER_GW_ADMIN_TOKEN`).
  Never commit them.

---

## 6. How to work (the loop)

- **Reference-first.** Before building/fixing a surface, open and read MCPay's/cronos402's actual source
  for that exact surface, in the same turn, and say which files you read. Interpretation ≠ the source.
- **Don't hand-roll UI.** Build sections with the `premium-ui` skill (author components, reskinned to
  tokens). If the `design-director` plugin is installed, run `/blueprint` for the P3 connect-tabs IA and
  `/design-review` (Playwright) to verify.
- **Keep files <300 lines** (`pnpm guard:files`). **No mock/placeholder docs** — document only real,
  verified behavior.
- **One item at a time:** read refs → implement → `pnpm verify` → browser-check → commit separately.

---

## 7. Kickoff prompt for Claude Code (paste this to start)

> You are taking over **Casper GW** (Casper Agentic Buildathon), repo `/Users/abu/dev/hackathon/casper-agentic`,
> branch `feat/casper-gw-mcpay-rebuild`. **Read `HANDOVER-CLAUDE.md` at the repo root in full first**, then
> `AGENTS.md`, `.thoughts/README.md`, and the current-truth audit
> `.thoughts/verification/2026-06-29-mcpay-ux-ownership-audit.md`. Also read the plan at
> `/Users/abu/.claude/plans/now-i-m-trying-to-delegated-lampson.md` and the project memory under
> `/Users/abu/.claude/projects/-Users-abu-dev-hackathon-casper-agentic/memory/`.
>
> Hard rule: before building/fixing any UI surface, OPEN AND READ MCPay's actual source for that exact
> surface in `.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/` (and cronos402). State which
> files you read. Do not build from memory.
>
> The engine (hosted MCP server, funded keys, settle path, OpenAPI/MCP, explorer) and the recent wallet/
> account/server UX are done — don't rebuild them. **First**, stabilize the uncommitted 2026-06-29 working
> set: diff it, run `pnpm verify`, and commit it in logical chunks. **Then** do the open work from
> `HANDOVER-CLAUDE.md` §4 in order: (P1) real owner management — owner columns + wallet-signed session +
> owner checks; (P2) direct WCSPR funding from the wallet; (P3) MCPay-style Client/Config/Code connect
> tabs; (P4) recursive object/array schema inputs.
>
> Run `pnpm verify` after each item and commit each separately. Verify UI in a real browser (Firefox +
> Casper wallet) — you can't verify wallet connect headless, so ask Abu to click through. Be honest about
> what you verified vs. what needs his browser. Do not claim something works without checking it, and do
> not reintroduce anything in the AGENTS.md "Do Not" list.
