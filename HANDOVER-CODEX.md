# Casper GW — Handover for Codex

You (Codex) are taking over **Casper GW**, Abu's submission for the Casper Agentic Buildathon. The
previous agent (Claude) built a lot of the engine but left several **consumer-facing UX issues
unaddressed or half-done**, and Abu is (rightly) frustrated. This file is your single source of truth:
read it, audit the repo against it, finish the open items, and verify each in a real browser before
claiming done.

**Repo:** `/Users/abu/dev/hackathon/casper-agentic` · **Branch:** `feat/casper-gw-mcpay-rebuild`
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 + shadcn/ui · Drizzle + Postgres · pnpm@10.33.0
**Run:** `docker compose up -d` → `pnpm db:migrate` → `pnpm dev`. Quality gates: `pnpm typecheck && pnpm lint && pnpm build && pnpm test`.

---

## 0. Orient yourself FIRST (read these, in order)

1. **The plan:** `/Users/abu/.claude/plans/now-i-m-trying-to-delegated-lampson.md` — the MCPay-parity build plan (ITEMs 0–7). This is the spec.
2. **`AGENTS.md`** (repo root) — hard rules. Most important: **READ the reference source before building any surface** (`.thoughts/raw/repos/MCPay/apps/app` and `.thoughts/raw/repos/cronos402/app`). Abu's #1 recurring complaint is building from interpretation instead of reading MCPay's actual code. Do not repeat it.
3. **Memory:** `/Users/abu/.claude/projects/-Users-abu-dev-hackathon-casper-agentic/memory/` — esp. `casper-gw-mcpay-parity-complete.md`, `casper-gw-gateway-wallet-funding.md`, `casper-gw-signing-modes-facts.md`.
4. **CSPR.click research output (USE THIS — it has the exact fix):** `/private/tmp/claude-501/-Users-abu-dev-hackathon-casper-agentic/70577de7-de32-473a-9de1-d3f4b9b07d29/tasks/wqhea3ywq.output` (JSON: `.plan` + `.findings`). The canonical reference is `.thoughts/raw/repos/csprclick-examples/csprclick-react/src/ClickContext.tsx`.
5. **CSPR.click skill:** `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`.

---

## 1. What the product IS (don't redesign it)

MCPay-on-Casper: a public x402 payment gateway. A provider registers an MCP server or OpenAPI spec and
prices its tools in WCSPR; an agent mints a `casper_` API key and **pays per tool call**; the gateway
signs+settles the x402 payment with its own funded Testnet wallet and produces a real Casper deploy
hash; every payment is publicly verifiable on `/explorer` → cspr.live. **WCSPR is the only settle-able
asset** (native CSPR wraps 1:1). Identity = "Proof-Print" design (Casper red `#FF473E`, dark console +
bone receipt-paper, proof-stamp). Every route is public; sign-in/keys are modals.

**Honest Casper constraint that bounds everything:** browser/CSPR.click x402 *signing* does NOT settle
on Casper (the facilitator rejects the typed-data scheme). So the gateway signs every payment; the
agent never signs. CSPR.click wallet-connect is **identity only** (read the public key for
attribution) — it is NOT a payment path. Do not wire `signTypedData` into any pay flow.

---

## 2. What is DONE + verified (committed)

These work and were proven on Casper Testnet (real deploy hashes). Don't rebuild; just don't break them.

- **ITEM 0 — Hosted MCP server** `src/app/api/mcp/[sourceId]/route.ts`: a real streamable-HTTP MCP
  server. `tools/list` public; `tools/call` requires a `casper_` key → `runGatewayPaidCall` → settles
  WCSPR on Casper → returns the upstream tool result + `_meta["x402/payment-response"]` +
  `x-casper-gw-receipt-id`. Proven: keyed `tools/call` → deploy `e90a074b…`. (commit `84114e8`)
- **ITEM 1 — Funded keys** `src/server/{api-keys,claim-deposit}.ts`, `key_credits` table: deposit WCSPR
  → claim by deploy hash → spend-down enforced in `verifyApiKey`. Proven: claimed 7.5 WCSPR. (`eadd2e8`)
- **ITEM 2 — Connect modal** `src/components/connect/connect-dialog.tsx` + `src/lib/connect-clients.ts`:
  one-click Cursor/Claude Code/Claude Desktop/VS Code/Codex/ChatGPT (verified deeplink/config formats). (`4522e68`)
- **ITEM 3 — Explorer/detail** WCSPR glyph + deploy-hash→cspr.live + truncate+copy. (`828b3b8`)
- **ITEM 4 — Schema form + re-index** boolean/array/object inputs; `rediscoverSource`. (`56d05c2`)
- **ITEM 5 — Register monetize UX** bulk WCSPR pricing + priced count. (`a698917`)
- **ITEM 6 (partial) — Fund UI + gateway balance** `src/server/gateway-balance.ts`, fund affordance in
  the keys dialog, `/api/gateway/balance` (real CSPR.cloud read). (`3ab5188`)
- **OpenAPI + MCP on one settle engine** (`7cb1b8c`); landing logo showcase (`b3cbec3`).
- **Mobile modal fix (UNCOMMITTED, good):** `src/components/ui/dialog.tsx` now has `max-h-[90dvh]
  overflow-y-auto` so modals are scrollable on phones (was clipped → "can't click Create key"). Verified
  on a 390px viewport. **Commit this.**

---

## 3. NOT done / BROKEN — Abu's pain points (THIS IS YOUR WORK)

Audit each against MCPay's actual source first. Verify each in a real browser (Abu uses Firefox + a
Casper wallet extension).

### P1 — CSPR.click "Connect wallet" is broken (HIGH; half-fixed, needs finishing)
Symptoms Abu sees: console `Error: Cannot get active account`; the modal "connects then closes
immediately"; a **"CSPR Products" top bar / branding bleeds** into the header; CSPR bleed in the footer.
**Root cause (confirmed by research):** the previous button **polled `getActiveAccount` before the
runtime emitted `csprclick:loaded`** (the SDK's hard rule is *never call any method before
`csprclick:loaded`*), and there was **no React provider + no event subscription** to latch the
`csprclick:signed_in` account — so a successful connect looked like it "closed with nothing".
**The fix is mostly written but NOT wired** (see §4). To finish:
- Wire `CsprClickProvider` into `src/app/layout.tsx` and re-add `<ConnectWalletButton/>` to the nav
  (the previous agent had *removed* the old wiring — see dirty state §4).
- Ensure the DOM containers exist: `<div id="csprclick-ui" />` (matches `uiContainer`) and the app under
  `<div id="app">` (matches `rootAppElement` `#app`, see `src/lib/csprclick-browser-config.ts:97`).
  Without these, the connect modal has nowhere to mount → "opens then vanishes".
- `showTopBar:false` (already set in `src/lib/csprclick-browser.ts:41`) suppresses the branded bar; keep
  it. If a residual badge appears, null it in the loaded handler: `win.csprclick.appSettings.badge_left = null;`
  (pattern from `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/App.tsx`).
- **appId:** `csprclick-template` (the default) only works on `localhost`. Abu is on `http://localhost:3000`,
  so it should connect locally. For any deployed origin you MUST register a real appId at
  `console.cspr.build` (allow-list the exact origin) and set `NEXT_PUBLIC_CSPR_CLICK_APP_ID` — this is the
  real fix for "connects then closes" off-localhost.
- The full provider/button code + line-by-line root cause is in the research output (§0.4). The canonical
  reference to match is `csprclick-examples/csprclick-react/src/ClickContext.tsx`.

### P2 — Featured-server logos missing (MEDIUM; not started)
On the landing "Featured servers" and `/servers`, server cards show a generic icon, no logo/picture.
Abu: "MCPay has a logo/picture for the featured service." **Read MCPay's `server-card` / `servers-grid`
/ `server-details-card` source** (`.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/`) to see
exactly how they render the server image/logo, then match it. A pragmatic Casper approach: derive a
favicon from the server's endpoint domain (e.g. `https://icons.duckduckgo.com/ip3/<host>.ico` or
`https://www.google.com/s2/favicons?domain=<host>&sz=64`) with a graceful fallback to the current icon.
Files: `src/components/servers/server-card.tsx`, the featured grid on `src/app/page.tsx`, and the
server-detail header `src/app/servers/[id]/page.tsx`.

### P3 — API-key UX is unclear; doesn't match what was discussed (HIGH)
Abu: "How do I find the API key? Who's funding it? I'm supposed to see my balance — we discussed this."
The functionality EXISTS (create/list/revoke in `src/components/keys/api-keys-dialog.tsx`; balance +
fund affordance from ITEM 6) but the flow isn't legible and doesn't match the MCPay model you both
agreed on: **connect wallet → Account modal with Wallet / Developer keys / Fund tabs → see keys + their
WCSPR balance → fund a key**. **Read MCPay's `user-modal.tsx` + `account-modal.tsx` + `api-key-modal.tsx`**
(`.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/`) and build the proper **Account modal**
(the plan's ITEM 6 "standalone Account modal" — only the Fund piece landed inside the keys dialog).
Make balance/credited/spent obvious per key. Note: keys are currently gateway-wide (not wallet-gated);
decide with the model in mind whether to tie keys to the connected wallet's public key.

### P4 — Footer / "CSPR" bleed (LOW; mostly fixed by P1)
The "CSPL/CSPR shit" in the footer is the CSPR.click injected UI; fixing P1 (showTopBar:false + correct
mount) removes it. Also sanity-check the landing footer + the `client-logos.tsx` "Built on … CSPR.cloud"
strip — confirm that text is intended and not duplicated/bleeding.

### P5 — Mobile responsiveness beyond the modal (MEDIUM)
The Dialog fix (§2) handles modals. Do a full mobile pass on every surface (landing, /servers,
/servers/[id], /explorer, /receipt, /register) at 390px. The nav currently hides secondary links on
mobile (no hamburger) — consider a proper mobile menu so Servers/Explorer/Register are reachable.

---

## 4. Current UNCOMMITTED / dirty state (READ before you touch anything)

`git status` right now (branch `feat/casper-gw-mcpay-rebuild`, HEAD `f30768d`):

- `M src/components/ui/dialog.tsx` — **mobile modal fix, GOOD → commit it.**
- `M src/app/layout.tsx` — previous agent **removed** `<div id="app">` + `<div id="csprclick-ui">` + the
  provider mount. **You must re-add** them + wrap children in `<CsprClickProvider>` (see P1).
- `M src/components/site/site-nav.tsx` — previous agent **removed** the wallet button import + usage.
  **Re-add** `<ConnectWalletButton/>` (now from `@/components/csprclick/connect-wallet-button`).
- `D src/components/wallet/wallet-connect-button.tsx` — the OLD broken (polling) button, correctly deleted.
- `?? src/components/csprclick/` — **NEW, the CORRECT fix, written by the research workflow but NOT yet
  wired or verified:** `csprclick-provider.tsx` (event-driven provider: waits for `csprclick:loaded`,
  subscribes to `signed_in`/`switched_account`/`account_changed`/`signed_out`, exposes `useCsprClick()`)
  and `connect-wallet-button.tsx` (uses the provider). **Review these against the canonical reference,
  then wire them in (§P1) and verify connect in a real browser.**
- `M src/lib/csprclick-browser-config.ts` — small type addition (`csprclick:account_changed` event /
  `detail`) to support the provider. Verify it compiles.
- `?? mobile-modal-fixed.png` — a screenshot artifact, delete it.

**So the immediate next action** is: review the two `csprclick/` files, wire the provider into
`layout.tsx` (+ the two container divs) and the button into `site-nav.tsx`, run
`pnpm typecheck && pnpm lint && pnpm build`, then have Abu test connect in Firefox with his Casper
wallet. Then commit P1, P2, P3, etc. separately.

---

## 5. Run / verify / gotchas

- **Postgres:** `docker compose up -d` then `pnpm db:migrate` (the `key_credits` migration is `drizzle/0005_*`).
- **Dev server / PORT COLLISION:** Abu also runs a separate project (`deepbook-enoki-login`) that grabs
  port 3000. If `localhost:3000` shows "DeepBookie", that's the wrong app — free 3000 or run
  `PORT=3100 pnpm dev`. Confirm you're on Casper GW by the title "Casper GW — proof for every agent payment".
- **Never `pnpm build` while `pnpm dev` runs** (corrupts `.next`); kill dev, `rm -rf .next`, then build.
- **Gateway wallet is LOW on WCSPR (~5, needs 7.5/call)** → live settles return `blocked` until topped
  up: `CASPER_WCSPR_WRAP_AMOUNT=75000000000 pnpm wrap:wcspr` (it has ~4800 CSPR gas). `/api/gateway/balance`
  reports readiness honestly (this is not a bug).
- **Real settle smoke:** `pnpm smoke:live` → expect a real `testnet.cspr.live/deploy/<hash>`.
- **Verify a paid call through the MCP server:**
  `curl -X POST localhost:3000/api/mcp/<sourceId> -H "x-api-key: casper_…" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_quote","arguments":{"amount":"10","token_in":"CSPR","token_out":"WCSPR","type":"exact_in"}}}'`
- **`.env`** needs: `DATABASE_URL`, `CSPR_CLOUD_API_KEY`, `CSPR_X402_FACILITATOR_URL`, the Casper signer
  PEM path, `CASPER_PAYEE_ACCOUNT_HASH`. Do not commit secrets.

---

## 6. PROMPT FOR CODEX (paste this to start)

> You are taking over Casper GW (Casper Agentic Buildathon), repo `/Users/abu/dev/hackathon/casper-agentic`,
> branch `feat/casper-gw-mcpay-rebuild`. **Read `HANDOVER-CODEX.md` at the repo root in full first**, then
> `AGENTS.md` and the plan at `/Users/abu/.claude/plans/now-i-m-trying-to-delegated-lampson.md`.
>
> Hard rule: before building/fixing any UI surface, OPEN AND READ MCPay's actual source for that exact
> surface in `.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/` (and cronos402) — do not build
> from memory or interpretation. State which files you read.
>
> The backend engine (hosted MCP server, funded keys, settle path, OpenAPI/MCP, explorer) is done and
> proven — don't rebuild it. Your job is the unaddressed consumer-facing items in HANDOVER §3, in order:
> 1. **Finish the CSPR.click "Connect wallet" fix** (HANDOVER §P1 + §4): review `src/components/csprclick/*`
>    (already written, event-driven, correct), wire `CsprClickProvider` into `src/app/layout.tsx` with the
>    `#app` + `#csprclick-ui` containers, re-add `<ConnectWalletButton/>` to `src/components/site/site-nav.tsx`,
>    confirm `showTopBar:false` kills the "CSPR Products" bar, and make the connect actually work on
>    localhost:3000. Verify in Firefox with a Casper wallet (you can't verify wallet connect headless —
>    ask Abu to click through, or use his browser).
> 2. **Featured-server logos** (§P2) — match MCPay's server-card image; favicon-by-domain is fine.
> 3. **Account modal / API-key clarity** (§P3) — build the MCPay-style Account modal (Wallet / Developer
>    keys / Fund tabs) so a user clearly sees their keys + per-key WCSPR balance + can fund. Read MCPay's
>    user-modal.tsx / account-modal.tsx / api-key-modal.tsx first.
> 4. **Footer/CSPR bleed** (§P4) and a **full mobile pass** (§P5).
>
> First, commit the good uncommitted mobile-modal fix (`src/components/ui/dialog.tsx`) on its own. Run
> `pnpm typecheck && pnpm lint && pnpm build && pnpm test` after each item; commit each item separately
> with a clear message. Be honest about what you verified vs. what needs Abu's browser. Do not claim
> something works without checking it.

---

## 7. Honest status summary for Abu

The **engine is real and works** (agents connect + pay + settle on Casper, funded keys, public proof).
What's been frustrating is the **consumer-facing polish**: wallet-connect was wired wrong (now diagnosed
+ a correct fix is written, needs wiring + a browser test), server logos aren't there, and the API-key
account flow isn't as clear as MCPay's. Those are §3 P1–P5 above — concrete, scoped, and reference-backed.
Nothing here requires re-architecting; it's finishing the UX to MCPay parity and verifying it in a real
browser.
