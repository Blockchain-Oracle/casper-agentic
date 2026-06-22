# Claude Code Independent Design Review — Casper GW Current Prototype

Date: 2026-06-22
Reviewer: Claude Code (independent pass, not ratifying prior Codex conclusions)
Prototype reviewed: `/Users/abu/Downloads/Casper docs UI redesign feedback(1)/Casper Gateway.dc.html` (+ `support.js`)
Status: design review only — no implementation, no spec/story edits. Prototype remains **evidence, not accepted truth.** **The design is NOT approved yet.**

> ⚑ Read the **scoped brief first:** `.thoughts/design/2026-06-22-design-direction-and-structure.md`. It tightens this review into adjustment-level direction (top-header nav + modals/tabs + the funding journey) — *not* a redesign. Where that doc and this review's long §13 list disagree on priority, the direction doc wins. In particular, §10's "raise density" here is superseded by "fix the IA structure (top-header + modals/tabs)".

> Method note: I reconstructed the accepted product from `.thoughts/` independently, mapped the new prototype from source, **rendered it live** (served over localhost; React loads from unpkg) and clicked through every public + app surface on desktop and mobile, verified contested concepts directly in source, and **cloned + code-read 8 x402/Casper reference repos** (not just READMEs). The stale `screenshots/modal.png` was ignored where it conflicts with current source, per the brief.

---

## 1. Executive Verdict

**ACCEPT WITH FIXES.** Advance toward implementation planning *after* a focused, well-scoped design pass — do **not** reject for a from-scratch redo, and do **not** treat the prior registry/private-tools/mode-rail fight as still open.

This prototype is materially better than the v1/v2 versions the prior audits critiqued. The designer has, by direct verification, resolved **all twelve** prior blocking issues. The build is honest about proof, correctly separates the three auth boundaries and the four receipt layers, and reads as a real operator product rather than a generated mock. It is above typical AI-mock quality and demo-credible today.

The fixes that remain are narrow and concrete, dominated by **one real product gap** (the wallet funding/deposit/readiness journey — which is exactly the instinct that prompted this review) and **one cross-cutting visual issue** (low information density / large empty canvases on the authenticated screens). Everything else is polish.

### Direct answers to the questions behind this review

- **"It doesn't feel the way normal stuff would feel" — is that real?** Partly, and it's diagnosable. It is **not** a product-correctness problem (the IA, flows, and honesty are right). It is two specific *feel* problems: (a) the operator screens are **under-dense** — three cards anchored to the top of a tall page with ~60% empty canvas below, which reads as "unfinished demo" rather than "operator console"; and (b) the **wallet doesn't model the funding journey**, so it skips the part that makes a wallet feel real. Fix those two and the "off" feeling largely goes away.
- **"Do deposits work the way real deposits work?"** No — and you're right to flag it. There is **no funding flow at all**: zero `faucet`, zero `deposit`, zero receive-address, no connect→fund→confirm→ready. The wallet jumps straight to a `funded` end-state. Real Casper/x402 products make funding a first-class, multi-step readiness journey. Section 6 gives the real model and a concrete redesign. This is the single highest-value change.
- **Did the designer actually do what was asked?** Yes. See Section 4 — the prior-issue scorecard is essentially all green. This review is about leveling *up* from "correct" to "great," not re-fighting settled corrections.

---

## 2. Evidence Checked

Local context (read in full or substantially):
- `AGENTS.md`, `README.md`, current `src/` tree (stale skeleton — see note).
- Product: `.thoughts/wiki/agent-commerce-gateway-product-context.md`, `…/thesis.md`, `…/x402-ai-agent-winner-patterns.md`, `…/cspr-trade-mcp-and-x402.md`, `…/casper-ecosystem-tooling.md`.
- Research: `…/research/2026-06-18-agent-commerce-gateway-reality.md`, `…/mcp-gateway-auth-reality.md`, `…/casper-x402-explorer-reality.md`, `…/casper-x402-onchain-identification.md`, `…/external-x402-agent-winner-patterns.md`.
- Raw: `…/raw/api-mcp-x402-wallet-gateway-2026-06-18.md`, `…/external-x402-agent-winner-landscape-2026-06-18.md`, `…/stellar-agents-winners-2026-06-18.md`, `…/casper-x402-explorer-2026-06-18.md`.
- Specs/stories: `…/specs/2026-06-18-agent-commerce-gateway.md`, `…/stories/2026-06-18-agent-commerce-gateway.md`, `…/design/2026-06-18-designer-brief.md`.
- Prior audits & corrections: `…/prototype-discovery/2026-06-18-…`, `…/prototype-reintegration/2026-06-21-…-audit.md` (v1), `…-v2-audit.md`, `…/design/2026-06-21-…-correction-prompt.md` (v1 + v2).
- The Codex handoff brief + prompt (`…/handoffs/2026-06-22-…-brief.md`, `…/design/2026-06-22-…-prompt.md`).

Prototype: `Casper Gateway.dc.html` (1,210 lines) + `support.js` (1,513 lines, the dc-runtime — React UMD render engine, **not** product logic); comparison `Casper Gateway v1 (pre-audit).dc.html`; stale `screenshots/modal.png` (noted stale, not used as truth).

Live render (saved screenshots in `.thoughts/design/2026-06-22-review-screenshots/`): public landing, public explorer, receipt detail, app dashboard, Sources, My Tools, Hosted Endpoint, Wallets & Policies, Settings, Audit, and the Paid Tool Test Console in 5 states (empty, discovered, tool-selected, run-result, paste-URL) — desktop + mobile.

Reference repos cloned to `.thoughts/raw/repos/` and **code-read** (not README-only): `make-software/casper-x402`, `make-software/cspr-trade-mcp`, `Merit-Systems/x402scan`, `rajkaria/toll` (TollPay), `CTX-com/Cards402`, `clevercon-protocol/clevercon`, `onchainexpat/x402-wallet-mcp`, `microchipgnu/MCPay`. Findings are folded into Sections 6–9 and the appendix.

> Note on `src/`: the existing Next.js skeleton is **stale** relative to this prototype and to AGENTS.md — it still contains `registry-screen.tsx`, `sandbox-screen.tsx`, `import-screen.tsx`, `api/registry/tools/route.ts`, and a README advertising "Simulated / Local / Live Testnet" modes. That code predates the corrections and should not be treated as the target; the prototype is the better source of product truth. (Out of scope to fix here — flagged for implementation planning.)

---

## 3. What the Prototype Gets Right (with evidence)

1. **Public explorer is genuinely public infrastructure.** Separate public top-nav (`Overview` / `Explorer`), no app sidebar, no sign-in, no wallet connection. Subcopy: "no wallet, no account, no sign-in required" (landing) and "Public · no sign-in" (explorer). Satisfies the AGENTS.md public-infra rule. *(landing, explorer screenshots)*
2. **The receipt detail is the strongest screen and nails the core thesis.** Four visually distinct cards — Gateway context · Policy decision · x402 payment · Casper proof — exactly the four-layer separation AGENTS.md mandates. The x402 card separates `verify`/`settle` states, names `CSPR.cloud x402` as facilitator, shows scheme `exact` + asset `CEP-18 TUSDC`; the Casper card shows deploy hash, block, payer/payee, and deep-links `testnet.cspr.live/deploy/…`. The note "Casper proof covers payment only…" refuses to overclaim that the chain proves the tool result. *(receipt-detail screenshot)*
3. **Privacy redaction is explicit and correct everywhere.** Public receipt shows `REQUEST INPUT → redacted — private`, `TOOL RESULT → redacted — private`, `POLICY CONFIG → redacted — wallet owner only`, `CLIENT/APP → MCP client (masked)`, plus a banner enumerating what is redacted (source L113, L183, L864–865). No private data leaks to the public surface.
4. **Three auth boundaries are kept separate and explained.** Hosted Endpoint states: "Client access tokens authenticate MCP clients only. They are **not** provider upstream credentials and **cannot** authorize wallet spending — payment authorization is a separate x402 payload." Settings → Credential boundaries separates provider-upstream (masked vault ref) · client access (scoped test token) · OAuth 2.1 target · wallet payment (x402 payload). The dashboard's "Trust boundaries — THREE SEPARATE AUTH SURFACES" card visualizes it. *(hosted-endpoint, settings, dashboard)*
5. **Proof honesty is disciplined.** Status vocabulary is real-state ("Paid on Testnet / Policy blocked / Payment failed / Proof pending / No Casper transaction") — no "Settled/Verified/Live" fake badges. My Tools states "A live endpoint advertises payment requirements — it does not mean a payment has settled on Casper." Settings states "only Casper Testnet produces real settlement proof. **No simulated or local mode is exposed as a product path**" (source L1186). Global "design fixture · sample data" labels are present and honest.
6. **Publish-status model corrected.** My Tools uses `Draft / Priced / Published` (+ `Not priced` / `Unsupported`) — **no Private/Public tool labels**. The websocket `stream_trades` is correctly `Unsupported` ("Not supported as a paid tool"). *(my-tools)*
7. **Console is endpoint-first and schema-driven.** Target = "My hosted endpoint" vs "Paste MCP/x402 URL" (placeholder `https://mcp.example.com/sse`); Discover tools → select → **inputs render only after selection** (PAIR/SIDE), with "Edit raw JSON (advanced)" demoted; wallet/policy selector; "Run paid call"; timeline enforces **policy pre-check → sign & pay → result → receipt** ("POLICY BEFORE PAYMENT"). Scenario states are explicitly labeled "PROTOTYPE PREVIEW STATE · NOT A PRODUCT CONTROL." *(console-*)*
8. **Wallet policy is real spend control, sourced correctly.** Max per call, daily limit, allowed tools/providers/networks/asset, manual-approval toggle, and a live "Policy would ALLOW this call…" preview. Explicit note: "Sourced from your hosted endpoint and discovered endpoints — **not a registry**" (source L473). *(wallets)*
9. **Testnet-first, Mainnet gated.** Sidebar `Testnet` active / `Mainnet soon`; Settings "Mainnet disabled — gated." `$preview` prop `mainnetVisibility` defaults `gated`. No simulated/local mode rail.
10. **Distinctive, non-generic visual language.** Editorial Helvetica, off-white `#f3f1ec` / signal-red `#ff0012` / near-black `#16130f`, monospace for IDs/hashes, a 3px red top rule. It does **not** read as default shadcn/Tailwind slop.

---

## 4. Prior Blocking Issues → Status Scorecard

All twelve issues from the v1/v2 reintegration audits, verified against the **current** source/render:

| # | Prior blocking issue (v1/v2) | Status now | Evidence |
|---|---|---|---|
| 1 | Simulated/Local/Live mode rail as product modes | ✅ Fixed | Network: Testnet/`Mainnet soon`; Settings disavows simulated/local (L1186) |
| 2 | Explorer trapped in gated /app shell | ✅ Fixed | Public `/explorer`, public nav, no sidebar |
| 3 | "SETTLED while simulated" + fake deploy hash/link | ✅ Fixed | Real-state vocab; `testnet.cspr.live` deep link; fixtures labeled |
| 4 | Pricing not tool-first | ✅ Fixed | My Tools = select tool → price selected tool → publish |
| 5 | "Demo Agent Sandbox" scripted-demo framing | ✅ Fixed | Renamed "Paid Tool Test Console", real runner flow |
| 6 | Registry-side allowlist duplicating wallet policy | ✅ Fixed | Wallet policy "…not a registry" (L473) |
| 7 | Top-level Tool Registry surface | ✅ Fixed | Removed from nav (dashboard·sources·tools·endpoint·wallets·console·settings·audit) |
| 8 | Invented Private/Public tool labels | ✅ Fixed | Draft/Priced/Published; no private/public |
| 9 | Always-on generic JSON input textarea | ✅ Fixed | Schema inputs after selection; raw JSON advanced-only |
| 10 | Wallet policy sourced from `registryTools` | ✅ Fixed (UX) / ⚠️ residual (code) | UI says "not a registry"; internal var still named `registryTools` (L680) — rename |
| 11 | Console "My published tool" too narrow | ✅ Fixed | Endpoint-first: hosted vs paste MCP/x402 URL |
| 12 | Scenario toggles as product controls | ✅ Fixed | Labeled "PROTOTYPE PREVIEW STATE · NOT A PRODUCT CONTROL" |
| — | Stale screenshot (modal.png) | ⚠️ Still stale | Ignore as evidence (as instructed) |

**Residual concept sweep (source-verified, all benign):**
- `simulat` → 3 hits: a "Test 401 handling" affordance `onSimulate401` (L328/L1055, arguably a *good* realism touch) + the Settings disavowal sentence (L1186). No simulated-settlement mode.
- `registr` → 3 hits: credential-safety "never returned to … the registry" (L325), wallet "…not a registry" (L473), and the internal data variable `registryTools` (L680). Only the variable name is a residual — a code-hygiene rename, not a UX surface.
- `private` → 5 hits, **all redaction** labels ("redacted — private"), not tool-privacy. The invented private-tools concept is gone.
- `faucet` / `deposit` → **0 hits** (the funding-gap proof; see Section 6).

---

## 5. Screen-by-Screen Audit (app shell + public)

**Public Landing** — Strong. Editorial hero, search, latest-receipts table, and a "What a receipt proves" card teaching the four layers. *Improve:* it reads more like a marketing page than an explorer home; add a small live network-vitality strip (see Section 8). The "Launch operator app" CTA appears three times (header, right card, footer) — trim to one primary + one secondary.

**Public Explorer** — Strong, the most "real explorer" screen. Search; status filter chips (All / Paid / Policy blocked / Payment failed / Proof pending / No Casper transaction); Provider + Network filters; a dense `RECEIPT · STATUS · PROVIDER · TOOL · AMOUNT · CASPER PROOF · TIME` table with deploy-hash / `none` / `pending` in the proof column; honest "Design fixture · sample receipts · not live chain data." *Improve:* add an aggregate stats strip above the table (total receipts, settled volume, proof-success rate, unique providers); make the proof-hash cells true links to `testnet.cspr.live`.

**Receipt Detail** — Best screen in the build (see Section 3.2). *Improve:* the Casper-proof card (the differentiator) is bottom-left with the least visual weight; give it more prominence. Make the `EXPLORER` row a real hyperlink, not copy-only. Balance the under-filled x402 card.

**Dashboard** — Good operator home: grouped sidebar (Operations / Provider / Operator / Run & Prove / System), a 5/5 setup-progress checklist, six stat tiles (Published tools / Agent wallets / Paid on Testnet / Blocked by policy / Proof pending / Failed-no-tx), recent calls, network & proof status, and the "Trust boundaries" card. *Improve:* one of the strongest screens; mostly density polish.

**Sources** — Good. Source types OpenAPI / Remote MCP / Manual route; upstream auth No-auth / Static header / API key / Bearer; explicit "credentials stored server-side only…never returned to clients, wallets, x402 payloads, receipts, the registry, or browser logs"; "Test 401 handling." *Improve:* density (form fills top ~40%); the Tool-discovery panel sits empty (`IDLE`) until connected — consider a richer pre-state.

**My Tools** — Strong (see Section 3.6). Discovered/Selected/Unsupported counts, per-tool status chips, "Price this tool" with x402 requirement (network/scheme/asset/payee/timeout), endpoint-readiness honesty note. *Improve:* minor.

**Hosted Endpoint** — Strong (see Section 3.4). Live status chips, client-config tabs (Cursor / Claude Desktop / curl) with real `mcpServers` JSON and a safe `cgw_test_scoped_mcp_…` token. *Improve:* minor.

**Wallets & Policies** — Mixed: policy excellent, **funding missing** (full treatment in Section 6).

**Settings** — Best honesty/auth screen (see Section 3.4/3.5). Credential boundaries, network gating, facilitator config (`CSPR.cloud x402`, `api.cspr.cloud/x402`), wallet signing mode with `PRODUCTION CUSTODY: unresolved — do not claim` and `POLICY TIMING: policy before payment signing`. *Improve:* minor.

**Audit** — Good. Append-only lifecycle log with OK/BLOCK/FAIL/INFO/WARN severity, referencing receipts, deploy hashes, policy thresholds (`0.10 > 0.08`), allowance failures, credential changes. *Improve:* add filters (type/severity/time) + export (nice-later).

**Mobile** — Public surfaces reflow well (header collapses, cards stack). The **authenticated app shell does not**: the sidebar stacks on top of content (no hamburger/drawer), forcing a long scroll past nav to reach the screen; stat tiles stack very tall. Acceptable for a desktop-demoed operator tool, but a `should-improve`.

---

## 6. Wallet / Funding / Deposit Audit  ← the highest-value change

### What's there
Two wallets (`agent-trader-01` = `Funded`, `research-readonly` = `Funding pending`), a "Selected wallet" card (account hash, network, signing mode `Hosted encrypted signer`, balance `12.50 TUSDC`, custody note "demo/MVP signing mode — no production custody claim"), and a "+ Connect wallet" button. The data models funded/unfunded **states** (source L663–664: `status:"funded"`, `status:"funding pending"`, `funded:true/false`).

### What's missing (verified by absence: 0 `faucet`, 0 `deposit` in source)
There is **no funding journey**. Specifically, none of:
- a copyable **receive/deposit address** (public key) to fund into;
- a **Testnet faucet** action / link;
- a **connect → fund → confirm → ready** sequence (the `research-readonly` wallet is stuck at "Funding pending" with nothing to act on; "+ Connect wallet" is a non-functional fixture, source L452);
- a **dual-asset readiness** view — it shows only `TUSDC`, but a Casper account needs **CSPR (motes) for gas** *and* the **CEP-18 payment asset**;
- an **allowance / spend-headroom** read alongside balance ("ready to pay" ≠ "has balance").

This is the part that makes Abu's "deposits don't work the way real deposits work" instinct correct. The wallet teleports to the funded end-state and skips the journey that makes a wallet feel real.

### The real model (grounded in Casper docs + reference code)
From `docs-redux` (official Casper docs) and the cloned reference repos:
- **Hard Casper rule:** an account *does not exist on-chain until its main purse is funded* (`accounts-and-keys.md` L124–128). So a realistic wallet has a distinct **"created — not funded — not on-chain yet"** state before it can pay.
- **Real ready-sequence (Testnet):** create/connect keypair → **fund main purse from the Testnet faucet** (`testnet.cspr.live/tools/faucet`) → account now exists on-chain → can transact (`prerequisites.md` L259–265).
- **Faucet is once-per-account:** a second request fails the deploy with `User error: 1`; if exhausted you must create a *new* account (`testnet-faucet.md` L22–28). A credible "Fund" button must handle already-funded / faucet-exhausted, not offer infinite "request more."
- **Readiness = query `main_purse` / balance**, not "wallet connected" (`accounts-and-keys.md` L294). Surface balance + allowance together.
- **Funded + budget/allowance = ready** (reference pattern): CleverCon deposits into a vault *before* work and refunds the remainder; Cards402 / x402-mcp-stellar-template enforce per-agent daily spend limits + approval + time windows. Readiness is balance **and** policy headroom, shown together.
- **Custody never exposes the raw key:** solana-foundation/pay uses a local-signer approval (Touch ID / Keyring), onchainexpat/x402-wallet-mcp uses Privy HSM/TEE, CSPR.trade MCP "never handles private keys." Keep the prototype's `Hosted encrypted signer` honesty and add an explicit "you approve a signature, the facilitator pays gas" framing (per `casper-x402`: the agent signs an EIP-712 CEP-18 authorization; the **facilitator** submits the `transfer_with_authorization` deploy and pays gas).

### Recommended redesign (designer-facing)
Make the wallet a **readiness journey**, not a static funded card. A wallet card should always show one explicit state:

`New → Connected (address shown) → Funding (faucet/deposit pending) → Ready (balance + allowance) → [Needs gas] / [Faucet used] / [Spend-capped]`

For the selected wallet, show:
- **Receive address** (public key, copyable) + the safety line real Casper UIs use: "Only use your public key. Never share your private key or recovery phrase. Transactions are irreversible."
- **Fund on Testnet** action → Testnet faucet (once-per-account; handle exhausted → "create new account"); model "pending → confirmed" with the main-purse check.
- **Dual balance**: `CSPR (gas): … · TUSDC (payments): …` with a readiness verdict ("Ready to pay" / "Needs gas" / "Unfunded"). This is concretely buildable — read live from CSPR.cloud (`Get account` → main-purse `balance`; fungible-token ownership → CEP-18 balance), and detect funding arrival via the deploy / token-action stream. No node required.
- **Allowance / daily headroom** from the spend policy, beside balance, so "will this call pass policy?" is answerable at a glance.
- Keep it labeled **design fixture** where mocked — do **not** invent a fake "deposit succeeded" animation as a product path; model the *real* faucet/transfer flow with honest pending/confirmed states.

This is the change most likely to flip the build from "correct" to "feels real," and it's the one Abu specifically asked about.

> Concrete code grounding (see appendix): **Cards402** ships almost exactly this as a 6-state funding stepper (`waiting → claimed → wallet-created → awaiting_deposit → funded → active`) where `awaiting_deposit` shows the copyable address + a faucet/deposit action, and `funded` is flipped only after a backend job **polls the chain and sees a real balance** (not a self-reported flag). **clevercon** adds the deposit→lock→release→**auto-refund** vault model and a "funded-but-no-allowance → Approve" intermediate. **x402-wallet-mcp** computes readiness from a **live balance read** and returns a precise `{balance, required, shortfall, top-up address}` shortfall at spend time. These are the patterns to lift.

---

## 7. Paid Tool Test Console Audit

Behaves like a real MCP/x402 runner and fixes every prior console issue (Section 4 #5/#9/#11/#12). Endpoint-first (hosted vs paste `https://mcp.example.com/sse`); Discover tools; schema inputs only after selection (PAIR/SIDE) with raw-JSON advanced; wallet/policy selection; "Run paid call"; policy-before-payment timeline that resolves to "Paid on Testnet … confirmed Casper deploy hash" + "Inspect receipt →." Scenario states correctly labeled prototype-only. This matches the real loop in TollPay/casper-x402 (402 → sign → verify → settle → execute → receipt).

**Improve:**
- **Density / empty canvas:** the three cards fill only the top ~30% even when fully run; the result/receipt should expand into a results panel (or center+compact the layout) so it doesn't read as unfinished. This is the most visible instance of the cross-cutting density issue.
- **Per-result fixture label:** the "Run paid call" success panel shows "Paid on Testnet … confirmed deploy hash" but is a fixture (source `consoleDesignState`, receipt output simulated at L697). It currently relies only on the *global* sidebar "design fixture" label — a judge screenshotting just the result could read it as real settlement. Add a small inline "sample / design fixture" tag on the result + receipt-preview itself.
- **Wallet readiness in the selector:** the wallet dropdown says "agent-trader-01 · funded" — also show spend headroom ("· 2.00 daily left") so the policy pre-check outcome is predictable before running.
- **Settling pending state:** real Casper settlement is synchronous and can run *many seconds* and still fail post-signature (`casper-x402` polls every 2s, 60s timeout). The timeline should show an explicit "settling…" state, not jump to green; and the result must be able to land on "Payment failed / Proof pending," not only "Paid."
- **Sample-tool schema realism (concrete):** the demo tools are *fictional* vs the real upstream the prototype names (`make-software/cspr-trade-mcp`). Real schema is `get_quote(token_in, token_out, amount, type=exact_in|exact_out)` — **not** `get_cspr_quote(pair, side)`; `get_market_depth(pair, depth)` doesn't exist (real: `get_pair_details`, `get_pair_price_history` OHLCV); `list_pairs` no-input doesn't exist (real `get_pairs` is paginated); there are no streaming tools. For a credible demo, model the discovered tools on the *real* schemas (the no-input and unsupported-stream design states can stay as illustrative, but label them, not "discovered from CSPR.trade").

---

## 8. Public Explorer / Receipt Audit

The explorer + receipt detail are the product's signature and are done well (Sections 3.1/3.2/5). Grounded against `x402scan` (the reference public x402 explorer) and the Casper on-chain research:

- **Add a network-vitality stats strip** (x402scan-style) above the table: total receipts, settled volume, proof-success rate, unique providers/tools, latest deploy. Real explorers lead with vitality; its absence is a big part of the "doesn't feel like infrastructure" gap.
- **Make proof links real:** deploy-hash cells (explorer) and the receipt `EXPLORER` row should hyperlink to `testnet.cspr.live/deploy/<hash>` — this is the honest, verifiable handoff to chain (and `x402scan` confirms a Casper-native explorer doesn't exist yet, so this *is* the differentiator).
- **Keep the hybrid framing explicit:** the chain proves payment only; gateway/facilitator records carry tool/resource/provider/policy. The receipt already says this — preserve it; it's exactly right per the on-chain-identification research (chain data exposes `transfer_with_authorization` args, not resource/tool/provider).
- **Consider provider/server grouping** (x402scan groups by server) and surfacing **failed/invalid** discovery states with reasons (a realism cue real explorers show).
### Casper data + settlement layer (verified — no own indexer needed)

> Correcting an earlier over-cautious "BLOCKED": I verified against the official CSPR.cloud docs + the Casper AI toolkit (`casper.network/ai`) + the `make-software` GitHub org. **CSPR.cloud is a hosted, official, indexed Casper data API** (REST + WebSocket Streaming + Node proxy; Testnet `api.testnet.cspr.cloud`; API-key auth; installable agent skill at `cspr.cloud/skill.md`). It already exposes exactly what the explorer + wallet-readiness need, so **the team does NOT need to run a Casper node or build its own indexer**:
> - **CEP-18 fungible-token actions** = the x402 settlements: `from/to`, `amount`, `contract_package_hash`, `deploy_hash`, `timestamp`, `block_height`, **filterable by contract package and by account** (`Get contract package fungible token actions`, `Get account fungible token actions`) — REST + live stream.
> - **Get deploy** by hash → `status` (processed/pending/expired), `error_message`, `block_hash/height`, `cost` — resolves a settlement hash to confirmed proof.
> - **Get account** → `balance` (main-purse motes) + `main_purse_uref`; **fungible-token ownership** → CEP-18 balances — the funding-readiness read.
> - **Transfers**, **CSPR/USD rate** (USD-equivalent volume), and `created`/`emitted` **streams** for deploys, transfers, token actions, and contract events (live explorer feed + funding-arrival detection).
> - **CSPR.cloud also hosts the x402 facilitator** (`x402-facilitator.cspr.cloud`: `/supported`, `/verify`, `/settle`) — so the prototype's "CSPR.cloud x402" facilitator is real and hosted too.
>
> **Architecture implication:** the explorer = a thin app joining the gateway's OWN off-chain records (gateway context · policy · x402 verify/settle) with CSPR.cloud-sourced on-chain proof (deploy status + CEP-18 transfer). Build the gateway datastore + join/UI; do not build an indexer. The only thing CSPR.cloud does *not* provide is a cryptographically **signed** receipt artifact (the facilitator returns the settlement result + on-chain tx, not a signed Offer/Receipt) — that is an OPTIONAL GW value-add, not a blocker, because the deploy hash is the verifiable proof.

---

## 9. Auth / Privacy / Proof-Boundary Audit

- **Three auth boundaries:** correctly separated and explained on Hosted Endpoint + Settings + Dashboard (Section 3.4). Token uses safe `cgw_test_…` prefix (no `sk_live`). ✅
- **Four receipt layers:** visually + semantically separated on the receipt detail (Section 3.2). ✅
- **Privacy:** public receipt redacts inputs/outputs/credentials/MCP tokens/policy internals, with an explicit banner (Section 3.3). ✅
- **Proof honesty:** real-state status vocab; no fake hashes/badges; fixtures labeled; explicit "Casper proof covers payment only." ✅
- **Custody honesty:** `Hosted encrypted signer` + "no production custody claim" + `PRODUCTION CUSTODY: unresolved — do not claim`. ✅
- **One watch item:** the console run-result fixture (Section 7) is the only place a viewer could *momentarily* over-read settlement; per-result labeling closes it.

---

## 10. Visual Design Quality Audit

**Strengths:** distinctive editorial system (not generic); strong type hierarchy on the public side; semantic status-chip color system (green paid / amber pending / red failed / neutral none / dark blocked); monospace for hashes/IDs; consistent card grammar; honest fixture labels.

**The cross-cutting weakness — information density on the authenticated app.** Almost every operator screen anchors 2–3 cards to the top and leaves ~40–60% empty canvas below (most extreme on Sources and the Console). Operator/infra tools earn trust through *density and rhythm* (think Stripe Dashboard, Vercel, a real explorer). Recommendations:
- Constrain max content width and **center**, or introduce a **second content row** so screens don't bottom out into emptiness.
- Raise default density: tighter vertical rhythm, more data per card, supporting metadata rows, small sparklines/among-tiles trends on the dashboard.
- Give the **Casper-proof** and **explorer-vitality** moments more visual weight — they're the differentiators and currently under-emphasized.
- Public hero typography is great; let some of that confidence into the app headers (they're comparatively flat).

**Minor:** redundant "Launch app" CTAs on landing; low-contrast tan eyebrows; under-filled cards (x402 payment card on receipt; Tool-discovery idle panel on Sources).

---

## 11. Real-Integration Classification

Labels: `REAL_MVP` (build for MVP), `REAL_LATER`, `SIMULATED_DEMO_ONLY` (prototype fixture), `OUT_OF_SCOPE`, `BLOCKED` (needs verification/decision before it can be real).

| Prototype behavior | Class | Note |
|---|---|---|
| Public explorer search / table / receipt detail | REAL_MVP | Index gateway/facilitator events; deep-link chain |
| Four-layer receipt model | REAL_MVP | Core differentiator |
| x402 verify/settle via CSPR.cloud x402 facilitator | REAL_MVP | `casper-x402` is ground truth |
| Casper proof: deploy hash + `testnet.cspr.live` link | REAL_MVP | From facilitator `/settle` response |
| Provider source: OpenAPI import + tool discovery | REAL_MVP | At least one path for MVP |
| Provider source: Remote MCP / Manual route | REAL_LATER | Modeled; one path first |
| Upstream auth (no-auth/static/API-key/bearer), masked server-side | REAL_MVP | |
| Hosted endpoint + client config; scoped bearer | REAL_MVP | OAuth 2.1 = REAL_LATER |
| My Tools pricing/publish (Draft/Priced/Published) | REAL_MVP | |
| Wallet connect | REAL_MVP | Prototype button is fixture → needs real flow |
| **Wallet funding/deposit/faucet/readiness** | REAL_MVP | **Currently missing — must be designed (Section 6)** |
| Wallet balance + allowance (CSPR gas + CEP-18) | REAL_MVP | Read via `casper-js-sdk` / `main_purse` |
| Spend policy + policy-before-pay | REAL_MVP | |
| Hosted-encrypted-signer custody | SIMULATED_DEMO_ONLY | Labeled; production custody unresolved |
| Console discover→select→schema-input→run | REAL_MVP | |
| Console "Run paid call" success panel | SIMULATED_DEMO_ONLY | Fixture; add inline label (Section 7) |
| Console scenario toggles (Pays/Block/Fail) | SIMULATED_DEMO_ONLY | Correctly labeled |
| Audit log | REAL_MVP | |
| Settings (credential boundaries/facilitator/network/signing) | REAL_MVP | |
| Mainnet | OUT_OF_SCOPE | Gated/later |
| `registryTools` internal variable | — | Code-naming residual → rename |
| Public explorer real-data path (deploys + CEP-18 actions + balances) | REAL_MVP | **Verified:** CSPR.cloud hosted indexer (REST+Streaming, Testnet, API key) — no own node/indexer needed |
| x402 verify/settle facilitator | REAL_MVP | **Verified hosted:** `x402-facilitator.cspr.cloud` (`/supported`,`/verify`,`/settle`) |
| x402 signed Offer/Receipt artifact | REAL_LATER | Optional GW value-add — facilitator returns settlement result + on-chain tx, not a signed receipt; deploy hash is the proof |

---

## 12. Spec / Story / Designer-Brief Deltas (proposed — not applied)

1. **Reconcile the mode-rail spec vs governance conflict.** Spec RQ-02A still lists `Simulated / Local / Live Testnet` as a persistent environment mode; AGENTS.md + this prototype removed that as product framing (Testnet-first, Mainnet gated; simulated/local are honesty labels only). Update the spec to match the shipped direction.
2. **Add an explicit Wallet Funding/Readiness requirement.** The spec/stories under-specify funding. Add: connect → receive address → Testnet faucet (once-per-account, handle exhausted) → pending/confirmed via main-purse → ready (dual balance CSPR+CEP-18 + allowance) → custody/signing framing. This is currently the biggest spec gap.
3. **Settle the registry question in writing.** Spec RQ-38..RQ-40A / stories 11/14 still encode a public/private tool registry that AGENTS.md + the v2 audit rejected for MVP. Downgrade registry to optional later-discovery and delete private/public-tool semantics from the spec so they can't re-enter.
4. **Receipt-layer count:** product-context wiki says 3 layers (policy folded into gateway); spec + designer-brief + this prototype use 4 (policy separate). The 4-layer model is the shipped one — align the wiki.
5. **Designer-brief:** add density/rhythm targets for the operator app (it reads under-dense) and a "wallet readiness journey" pattern; add an "explorer vitality strip" pattern.

---

## 13. Prioritized Fix List

### Must fix before implementation planning
1. **Design the wallet funding/deposit/readiness journey** (Section 6) — the one real product gap.
2. ~~Resolve the two `BLOCKED` reality gates~~ — **RESOLVED (2026-06-22):** the explorer's real-data path and the facilitator are both **hosted by CSPR.cloud** (indexed deploys + CEP-18 actions + balances via REST/Streaming on Testnet; `x402-facilitator.cspr.cloud` for verify/settle). No own node/indexer needed. The only remaining (non-blocking) decision is whether to add a GW-issued *signed* receipt on top of the on-chain proof — defer to REAL_LATER.
3. **Add a per-result fixture label** to the console run-result/receipt-preview (Section 7) so no surface can be misread as real settlement.

### Should improve before build
4. **Raise operator-app density** / fix the empty-canvas layout across Sources, Console, and others (Section 10).
5. **Add the explorer network-vitality stats strip** + make proof links real `testnet.cspr.live` hyperlinks (Section 8).
6. **Dual-asset wallet balance** (CSPR gas + CEP-18) + allowance/headroom in the wallet and the console wallet selector.
7. **Mobile app-shell nav** → hamburger/drawer instead of stacked sidebar (Section 5/mobile).
8. **Rename `registryTools`** → `discoveredTools`/`endpointTools` to purge the registry mental model from the code (Section 4 #10).

### Nice later
9. Give the Casper-proof card more visual weight on the receipt; balance under-filled cards.
10. Trim redundant "Launch app" CTAs on the landing.
11. Audit-log filters + export.
12. Provider/server grouping + failed-discovery states in the explorer (x402scan parity).

---

## 14. Designer Correction Prompt (paste-ready, if you want another pass)

> The current Casper Gateway prototype is accepted in direction and resolves all prior corrections — this is a level-up pass, not a redo. Keep the IA, the public/explorer/receipt architecture, the auth/proof separation, the honesty labels, and the visual language. Make these focused changes:
>
> 1. **Wallet funding & readiness (top priority).** Replace the static "funded" wallet with a readiness *journey*. Each wallet shows one explicit state: New → Connected (show copyable receive/public-key address + the safety line "Only use your public key; never share your private key/recovery phrase; transactions are irreversible") → Funding (Testnet faucet, once-per-account — handle "faucet used / create new account"; show pending→confirmed) → Ready. For the selected wallet show **dual balance** (`CSPR (gas)` + `TUSDC (payments)`) with a readiness verdict (Ready to pay / Needs gas / Unfunded) and the **allowance / daily headroom** beside balance. Frame signing honestly: "you approve a payment authorization; the facilitator submits and pays gas." Keep everything labeled a design fixture where mocked — do not fake a "deposit succeeded" success as a product path; model the real faucet/transfer with honest pending/confirmed states.
> 2. **Density.** The operator screens (especially Sources and the Test Console) bottom out into large empty canvases. Constrain/center content width or add a second content row; raise data density and vertical rhythm so screens read like an operator console, not a demo. Give the Casper-proof card and an explorer vitality strip more weight.
> 3. **Explorer vitality.** Add a stats strip above the receipt table (total receipts, settled volume, proof-success rate, unique providers, latest deploy). Make every deploy-hash and the receipt EXPLORER row a real link to `testnet.cspr.live/deploy/<hash>`.
> 4. **Console honesty + realism.** Add a small inline "design fixture / sample" tag on the Run-paid-call result and receipt preview (don't rely only on the global sidebar label). Show wallet spend-headroom in the wallet selector. Add an explicit "settling…" pending state (real Casper settlement takes seconds and can fail after signing). And model the discovered demo tools on the *real* `cspr-trade-mcp` schemas — `get_quote(token_in, token_out, amount, type)`, paginated `get_pairs` — rather than the invented `get_cspr_quote(pair, side)` / `get_market_depth` / `list_pairs`.
> 5. **Mobile app shell.** Replace the stacked sidebar with a hamburger/drawer; compact the dashboard tiles.
> 6. **Polish.** Rename any internal "registry" data to "discovered/endpoint tools." Trim the landing to one primary + one secondary app CTA. Balance the under-filled x402 receipt card and the idle Tool-discovery panel.
>
> Do not add: a tool registry surface, private/public tool labels, a simulated/local product mode, a separate "send policy," or any fake Casper proof. Keep Testnet-first / Mainnet-gated.

---

## 15. Appendix — Evidence Index

- **Screenshots:** `.thoughts/design/2026-06-22-review-screenshots/` (01 landing · 02 explorer · 03 receipt-detail · 04 dashboard · 05 wallets · 06–09 + 17 console states · 10 sources · 11 my-tools · 12 hosted-endpoint · 13 settings · 14 audit · 15–16 mobile).
- **Reference repos (cloned + code-read):** `.thoughts/raw/repos/{casper-x402, cspr-trade-mcp, x402scan, toll, Cards402, clevercon, x402-wallet-mcp, MCPay}`.

### Reference code-read findings (file-level grounding)

Eight repos were code-read (not README-only). The throughline: **the prototype's public explorer, four-layer receipt, and operator-facing wallet funding/readiness do not exist in any of these real products — they are genuine, defensible value-add, not fiction.** Highlights that ground Sections 6–9:

- **`make-software/casper-x402` (the official Casper x402 — ground truth).** Real two-call facilitator contract: `POST /verify {paymentPayload, paymentRequirements} → {isValid, payer, invalidReason?}`; `POST /settle → {success, transaction(deploy hash), network(CAIP-2 casper:casper-test), payer}` (both **return HTTP 200 even on failure** — design failure UI off body fields). The payer signs an **off-chain EIP-712 `TransferWithAuthorization`**; the **facilitator** submits the `transfer_with_authorization` `TransactionV1` and **pays gas** (`go/x402/mechanisms/casper/exact/facilitator/scheme.go`). `PAYMENT-RESPONSE` is **unsigned** base64(JSON settle) — so a "signed receipt" would be GW's own value-add, not standard x402. The entire CSPR.click web app is **one screen** with no balance/funding/receipt/explorer (`examples/csprclick-x402/src/SignTypedData.tsx`). **Funding is fully out-of-band; settlement is synchronous and can take many seconds and still fail post-signature** (`go/docs/architecture.mmd`, `user-guide.md`). *Adopt:* the real error taxonomy (`amount_mismatch`/`expired`/`invalid_signature`/`payto_mismatch`/`network_mismatch`) as the receipt's verify/policy vocabulary; make `SettleResponse.transaction` the hero of the Casper-proof card with a `cspr.live` linkout (the single thing the official impl is missing). *Caution:* x402 enforces **no on-chain spend cap** — any budget/policy is a **gateway-layer** control GW implements itself; don't imply the CEP-18 contract enforces it.
- **`make-software/cspr-trade-mcp` (the actual sample source the prototype models).** **Realism gap:** the prototype's demo tools are *fictional* vs the real server — real is `get_quote(token_in, token_out, amount, type=exact_in|exact_out)` (not `get_cspr_quote(pair, side)`); `get_market_depth(pair, depth)` **doesn't exist** (real: `get_pair_details`, `get_pair_price_history` OHLCV); `list_pairs` no-input **doesn't exist** (real `get_pairs` is **paginated**); there are **no streaming tools** at all. The real MCP is **free/unauthenticated** (wrapping it behind x402 is GW's legitimate value-add). *Adopt:* the real `build → sign-local → submit` write flow and the **two-server custody split** (public server never touches keys; separate `--signer` process keyed from PEM/mnemonic), and **separate native-CSPR (gas) vs CEP-18 balance reads** for wallet readiness (`packages/mcp/.../account.ts`, `signer.ts`).
- **`Merit-Systems/x402scan` (best-in-class public explorer).** Confirms the explorer recommendations: a **network-vitality stats strip** of 4 sparkline cards (Transactions/Volume/Buyers/Sellers) with time-range + cumulative toggle is the landing hero (`apps/scan/.../stats/charts.tsx`); **server/provider grouping** (one origin → many tools), a ready-made **transaction-table column set**, a **discovery state machine** that prints valid-vs-invalid-with-reason (`lib/discovery/probe.ts`, `FailedResourceRow`), and **per-section Empty+Loading discipline**. It has **no external block-explorer deep-link** — GW deep-linking deploy hashes to `cspr.live` is a real improvement, not a copy. Custody = Coinbase CDP **managed** (public address + balance only, **no keys in the explorer**) → don't show raw Casper keys/seed in the public explorer.
- **`rajkaria/toll` (TollPay).** Real run loop to mirror in the console: *discover → call unpaid → render the 402 requirements verbatim → client-side budget pre-check (refuse to sign if over) → sign locally → retry with signature header → show settle result + tx hash → link explorer.* Ordered server policy check `allowlist → blocklist → maxPerCall → maxDailyPerCaller → maxDailyGlobal`; a **tamper-evident sha256 audit hash-chain**; three cleanly separated credential planes; a **balance/readiness checker** ("funded / not activated / no trustline" + "$ buys N calls"). *Caution:* its dashboard "playground" doesn't actually sign — don't model the console on a proxy that skips payment.
- **`CTX-com/Cards402` + `clevercon-protocol/clevercon` (the funding model — highest value for §6).** Cards402 models funding as an explicit **6-state stepper**: `waiting → claimed → wallet-created → awaiting_deposit → funded → active` (`web/.../CreateAgentDrawer.tsx`); `awaiting_deposit` shows the **copyable deposit address + "send ≥ X to activate + reserves" + a trustline step**; `funded` is **not self-reported** — a backend job **polls the chain** and flips to funded only when a real balance appears, advancing live over SSE (`backend/.../jobs.js`). clevercon adds the **deposit→lock→release→auto-refund** vault model with a visible "refunded to wallet" state, a "**No trustline → Add USDC Trustline**" intermediate, and a task-time pre-flight `getAvailable() < budget → 402 {available, required, shortfall}`. Cards402's **policy engine is the canonical schema**: `single_tx cap · daily limit (rolling sum) · require_approval_above (→ human approval w/ TTL) · allowed_hours (UTC) · allowed_days mask · suspended kill-switch`, evaluated **first-match, fail-closed**, every decision written to a **separate `policy_decisions` audit table**. Both are **strictly non-custodial** (store only the public key; build unsigned tx for the wallet to sign; agent key via one-time **claim code**, never in chat).
- **`onchainexpat/x402-wallet-mcp`.** **Two readiness gates** the wallet screen should mirror: (1) *wallet-exists* (else `setup_required`), (2) *funded* computed from a **live on-chain balance read, never cached** — `balance==0` is a first-class empty state returning **deposit address + QR + onramp** together. A **pre-flight balance gate** at spend time returns a precise `{balance, required, shortfall, top-up address}` instead of an opaque sign failure. Keys in HSM/TEE, never raw to the agent; spend limits enforced **before** signing.
- **`microchipgnu/MCPay`.** Direct code evidence for the **registry verdict**: the registry/index is **not** the source of truth — authoritative pricing/payout config lives in a **separate store**; the registry is a best-effort searchable catalogue (discovery + moderation + quality score) only. Also a clean **four-layer-receipt-as-`_meta`** template (gateway context → verify → settle `{transaction, network, payer}` → optional proof) and a **public auth-free explorer** that deep-links settlements to a block explorer (GW → `cspr.live`), plus a console `ExecutionStatus` state machine — all confirming the prototype's direction.
