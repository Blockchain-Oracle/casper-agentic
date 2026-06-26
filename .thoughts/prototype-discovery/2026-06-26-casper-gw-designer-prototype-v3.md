# Prototype Discovery: Casper GW Designer Prototype v3 (2026-06-26)

> Status: DISCOVERY (evidence + proposed deltas). This is a gate document.
> It does **not** rewrite the spec/stories or start implementation.
> Next gate after acceptance: **prototype-reintegration** (mandatory), then plan.
>
> Hard framing from the prototype itself: *"Every mock must be classified by
> prototype reintegration before implementation planning."*

## Prototype Inspected

Designer hand-off dropped at `~/Downloads/Casper agentic repository (2)/`:

| File | Bytes | What it is |
|---|---|---|
| `Casper GW.dc.html` | 214,652 | **Master annotated design board** — single DivCanvas artboard with all 14 screen tiles, responsive frames, and 3 appendices (route map, status vocabulary, mocked-data + open questions). Static (no bindings). The authoritative design source. |
| `Casper GW - App.dc.html` | 85,487 | Standalone authenticated `/app` export with live `{{ }}` bindings + DCLogic (header nav, dashboard, runner, provider, audit, settings, wallets). |
| `Casper GW - Runner.dc.html` | 28,855 | Standalone paid-tool Runner export. |
| `Casper GW - Explorer.dc.html` | 24,491 | Standalone public explorer (list + detail) export. |
| `support.js` | 57,767 | Generic DivCanvas runtime engine only — **no app data**. Resolves `{{ }}` bindings; loads React 18.3.1 + Babel from unpkg. Prototype-only mechanism; must NOT carry into the real Next.js build. |

Format: **DivCanvas** (`.dc.html`, `<x-dc>` templates, handlebars-style bindings). Each `.dc.html` boots by filename; there is no client router. Per-screen state/mock-data live in each file's `<script data-dc-script> class extends DCLogic` (`this.state` / `renderVals()`), not in `support.js`.

Methodology: 9-agent discovery workflow (5 prototype extractors + 4 implementation comparators) plus firsthand read of the master board's design-system tile, landing tile, and all three appendices. Anchored to Abu's 10 verbal directives ([[casper-gw-prototype-v3-directives]]).

Cross-checked against: `AGENTS.md`, `.thoughts/README.md`, current spec `2026-06-22-casper-gw-current-spec.md`, current stories `2026-06-22-casper-gw-current-stories.md`, signing research `2026-06-25-casper-gw-signing-modes-reality.md`, and the live `src/` implementation.

### The reframing finding (read this first)

This is **not a greenfield prototype**. The current codebase already implements and has **proven on Casper Testnet** almost everything the prototype labels "mocked":

| Prototype "mock" | Actual status in current build |
|---|---|
| x402 verify/settle (CSPR.cloud facilitator) | **REAL & proven** — phases 0/3/7, real deploy hashes |
| Casper proof & deploy hashes | **REAL** — `8ed4569f…`, `a27e519e…` on testnet.cspr.live |
| Receipts & audit storage | **REAL** — Postgres/Drizzle four-layer receipts |
| CSPR.cloud external WCSPR feed | **REAL** — phases 10/13/15 |
| MCP / tool discovery & schema | **REAL** — phase 1 (23 tools from mcp.cspr.trade) |
| Spend-policy evaluation | **REAL** — phase 2, fail-closed |
| Wallet balances / readiness | **REAL** — phase 2, CSPR.cloud readiness |
| Provider credentials / client tokens | **REAL** — server-side, scoped bearer |
| CSPR.click wallet connection/session | **PARTIAL** — connect works (24F–S); **browser-approved settlement NOT proven** (provider rejected typed-data with `SIGNATURE_SCHEME_NOT_SUPPORTED`) |

**Conclusion:** the v3 work is primarily a **clean re-skin wired to existing real backend**, plus a focused set of NET-NEW UI pieces, plus the one genuine backend frontier (browser-approved signing). This de-risks the effort and should shape the plan.

## Screen Map

Authoritative IA (from the route-map appendix). One hard boundary: **public proof infrastructure vs. wallet-gated operator app.**

```
PUBLIC · NO WALLET                         PROTECTED · /app · 🔒 WALLET REQUIRED
  /                 (landing, light)          dashboard        (overview)
  /explorer         (explorer, light)         provider         (· sources · my tools · endpoint)
  /receipt/:id      (receipt detail, light)   wallets & policy (· readiness · funding)
  ↗ testnet.cspr.live (raw proof)             runner
                                              audit
                                              settings
```

Master-board tiles (00–13 + responsive + appendices):

| # | Tile | Theme | Route | Notes |
|---|---|---|---|---|
| 00 | System / design-system | dark | — | tokens, signing-mode framing, interaction taxonomy, proof-honesty |
| 01 | Public landing | light | `/` | hero, latest-proof card, proof-loop band, public/app zones, activity stats |
| 02 | Public explorer | light | `/explorer` | dual feed: local 4-layer receipts vs external WCSPR; "PUBLIC · NO SIGN-IN" |
| 03 | Receipt detail (four-layer) | light | `/receipt/:id` | vertical spine, full deploy hash, cspr.live link, redaction note |
| 04 | App gate (wallet-connect) | dark | `/app` (locked) | connect CTA + connection-state machine + mismatch banner |
| 05 | Dashboard / overview | dark | `/app` | gateway-loop strip, readiness/spend stat cards, recent receipts, quick actions |
| 06 | Provider · sources + add-source modal wizard | dark | `/app` provider | 3-step wizard (Type→Connect→Discover); source types: API/OpenAPI/manual/remote-MCP |
| 07 | Provider · my tools + price/publish drawer | dark | `/app` provider | per-tool right drawer (Casper x402 pricing) |
| 08 | Provider · hosted endpoint + client access | dark | `/app` provider | endpoint URL, client config snippet, scoped token, three trust boundaries |
| 09 | Wallet & policy tabbed modal | dark | `/app` wallets | Profile / Readiness&funding / Policy tabs; policy preview PASS/BLOCK; kill switch |
| 10 | Funding stepper drawer | dark | `/app` wallets | 4 steps, 2 tracks (CSPR gas + WCSPR), evidence-based readiness, faucet warning |
| 11 | Paid tool runner | dark | `/app/runner` | own-hosted/paste-URL source, schema inputs, wallet/policy, paid-call timeline |
| 12 | Settings (tabbed) | dark | `/app` settings | Trust boundaries / Network&facilitator / Signing / Client access |
| 13 | Audit log | dark | `/app` audit | chronological distinct-state event table |
| — | Responsive | both | — | Tablet 834 (condensed nav, segmented feeds); Mobile 390 (stacked, bottom tab bar, hamburger) |
| — | Appendices | light | — | route-map/IA · status vocabulary · mocked-data + open-questions |

## User Flows

1. **Public verification (no wallet):** land on `/` → "Open explorer" → `/explorer` → search receipt/deploy/account/public-key/CSPR.name → open `/receipt/:id` → four layers → "Open raw proof on testnet.cspr.live".
2. **Operator entry (gated):** `/` "Connect wallet" → `/app` gate → CSPR.click `signIn()` → connection-state machine (loading → connecting → connected · active key → workspace unlocks). Account-mismatch is a distinct blocking state.
3. **Provider publish loop:** Provider → Sources → "+ Add source" modal wizard (Type → Connect → Discover) → select tools → My tools → price/publish drawer (Casper x402 pricing) → Endpoint tab shows hosted URL + scoped client token + config snippet.
4. **Wallet governance:** Wallets → (select wallet) → tabbed modal (Profile / Readiness&funding / Policy) → set spend policy (max/call, daily headroom, allowlist) → policy preview PASS/BLOCK → Save / Kill switch. Funding via stepper drawer (receive address, faucet, two tracks tracked separately).
5. **Paid call (the core proof loop):** Runner → choose source (own-hosted dropdown OR paste URL) → tool resolves → fill schema inputs (or "No input required") → wallet + policy → Run → **policy precheck (server, before signing)** → wallet approval (CSPR.click signTypedData / TransferWithAuthorization) → x402 verify → settle on Casper → tool executes only after settle → four-layer receipt. Blocked branch: audit receipt created, **no signing prompt, no deploy hash**.
6. **Audit review:** Audit → filter (All/Payment/Policy/Provider) → distinct-state rows → **(GAP)** click row → deploy-detail modal with cspr.live link + failure reason.

## Revealed Product Requirements

- Two-zone product: **public proof infrastructure** (light) and **wallet-gated operator app** (dark), visually and structurally separated.
- Every flow expresses **distinct states, never collapsed** into generic success/failure (full status vocabulary below).
- **Policy-before-payment** is a product invariant: a block creates no transaction and no signing prompt.
- **Proof honesty** is a product invariant: no "settled"/"Paid on Testnet"/deploy hash without a real Testnet deploy; all sample data labeled at point of use; testnet-only; no mainnet; no production custody claim.
- **Three trust boundaries never merged:** provider upstream credential (server-side) · client access token (scoped, cannot pay) · wallet/payment authorization (fresh signed per call).
- Provider onboarding accepts API / OpenAPI / manual route / remote MCP and produces a hosted MCP/x402 endpoint with a scoped client token + ready-to-paste client config (Cursor / Claude Desktop).
- Signing is presented as an **honest three-mode framing**, with the hosted/autonomous mode explicitly gated as "not a Casper primitive yet."

## Revealed Technical Requirements

- **Theming system:** light (`#FAF9F6`/`#14151A`) for public, dark (`#0F1115`/`#15171c`) for app; CSS custom properties already present in the prototype `:root`.
- **Typography:** Hanken Grotesk (UI, 400–800) + IBM Plex Mono (data only). Load via fonts.googleapis.
- **Color-token semantics:** brand `#E5383B`, settled `#35B07A`, x402 `#5B8DEF`, policy `#E6A93C`, neutral grey for external/disabled (light + dark variants).
- **Interaction taxonomy:** add-source = modal wizard · price/publish = per-tool right drawer · wallet&policy = tabbed modal · funding = stepper drawer · settings = tabbed page. Consistent scrim `rgba(7,8,10,.6)` + `backdrop-filter: blur(2px)`.
- **Routing:** real public routes `/`, `/explorer`, `/receipt/:id`; gated `/app/*` sub-routes (dashboard/provider/wallets/wallets/[id]/runner/audit/settings).
- **Address/hash formatting:** consistent leading…trailing truncation; full 64-char hash only on receipt detail.
- **Responsive:** desktop 1440 top-header; tablet 834 condensed nav + segmented controls; mobile 390 stacked + bottom tab bar (Home/Provider/Wallets/Runner/More) + hamburger on public.
- **Do NOT port** the DivCanvas runtime (`support.js`, unpkg React/Babel, `new Function()` eval) — prototype-only.

## Data Model Candidates

(All already largely exist in `src/db/schema.ts`; listed for design parity.)

- **Receipt** — id, status{settled/blocked/verify_failed/settle_failed/upstream_failed/auth_failed/proof_pending}, tool, provider, amount+asset, deployHash, timestamp, durationSecs, payer, payee, network, client, endpoint, price, layers[gateway,policy,x402,proof].
- **ExternalProof (WCSPR token action)** — deployHash, amount, matchState{matched receiptId / no match}, age, source.
- **Tool** — name, inputs/schema, price+asset, state{EDITING/PUBLISHED/UNSUPPORTED/DRAFT/SUPPORTED/UNSUPPORTED_OP}, scheme.
- **Source** — name, type{remote-mcp/API/OpenAPI/manual}, url, connectionStatus, toolsCount, publishedCount, authLocation(server-side).
- **Wallet** — label, publicKey(full+truncated), network, signingMode, csprGas, wcspr, readiness.
- **SpendPolicy** — enabled, allowedNetwork, allowedAsset, maxPerCall, dailyHeadroom, consumedToday, allowedToolsProviders[], killSwitch.
- **Endpoint** — url, status, advertisedPayments[], clientConfigSnippet.
- **ClientAccessToken** — token(masked), scope[discover/call/pay-intent], authority("cannot authorize payment"), activeCount.
- **CredentialBoundary** — upstreamCredential(masked, server-side), clientToken(scoped), walletIdentity(public-only).
- **x402 PaymentRequirement/Authorization** — scheme, asset, amount, type(TransferWithAuthorization), nonce, validAfter/validBefore, verify, settle.
- **AuditEvent** — time, event, actor, result, detail.
- **NetworkConfig** — network, facilitator, paymentAsset(WCSPR CEP-18), mainnet(HIDDEN·LATER).

## API And Event Candidates

Existing routes cover most of this (`src/app/api/**`). New/changed needs:
- `GET /receipt/[id]` page (public) reusing `api/receipts/[id]` + `lib/receipt-detail.ts` (currently only reachable via `/explorer?receipt=`).
- Wallet detail data per `[id]` (existing `api/wallets/[id]/readiness` + `/policy`), consumed by a dynamic page rather than client state.
- Audit feed for a standalone Audit screen (existing receipt/audit data; needs a dedicated read path or reuse of `api/receipts`).
- CSPR.click connection-state events drive the gate (SDK loading / connecting / connected / switched / mismatch / unavailable / signed-out).

## Auth, Permissions, And Security Implications

- `/app/*` requires a connected CSPR.click wallet (gate). `/`, `/explorer`, `/receipt/:id` are fully public.
- Three credential planes stay separate (matches AGENTS.md). Public receipts redact tool I/O, credentials, client tokens, policy internals.
- Client access tokens use `sample_` fixture prefix in the prototype; real ones must never use live-looking prefixes (`sk_live`), per AGENTS.md.
- Wallet profiles store **public identity only** — no seed phrase / private key / provider API key / CSPR.cloud token.
- **Account mismatch** (active CSPR.click account ≠ selected profile) is a first-class blocking state before any paid call.

## State And Edge Cases

Full status vocabulary the UI must render distinctly (do not collapse):
- **Receipt:** settled · blocked · verify failed · settle failed · upstream failed · auth failed · proof pending · external proof
- **Payment:** requirements · waiting approval · cancelled · verifying · settling · settled
- **Proof:** pending · verified deploy · unavailable · no transaction
- **Wallet & policy:** ready · needs gas · needs asset · mismatch · allowed · blocked · disabled
- **Connection (gate):** SDK loading · connect available · connecting · connected·active-key · account switched · account mismatch · CSPR.click unavailable · signed out (≠ disconnected)
- **Four moments every flow covers:** EMPTY · LOADING · ERROR · SUCCESS

## Target-stack Translation (Next.js App Router)

Current app is a single client shell (`gateway-app.tsx`, `use client`) that swaps screens via a `screen` useState over the `Screen` union (`lib/types.ts`); only `/`, `/app`, `/explorer` are real pages.

- **Gating:** add `src/app/app/layout.tsx` reading CSPR.click connection state → render workspace **blurred** with a connect overlay until connected (Abu's directive 7; prototype shows a full-page gate, the blur-over-workspace is the explicit upgrade).
- **Routing:** move `/app` to nested routes: `dashboard`, `provider`, `wallets`, `wallets/[id]`, `runner`, `audit`, `settings`. Add public `src/app/receipt/[id]/page.tsx` reusing explorer receipt rendering.
- **Settings → in-page tabs** (`useState` tab: boundaries/network/signing/client) inside `settings-screen.tsx`; rework `settings-signing-mode.ts` from runtime label fns → static descriptor; drop `browserSigningState`/`onConnectBrowserWallet` props.
- **Wallets → selection-first list page + dynamic `[id]` detail**; modals/drawers as client components (`wallet-detail-modal.tsx` tabbed, `fund-wallet-drawer.tsx` stepper, `wallet-name-modal.tsx`).
- **Runner → one clean column** (source dropdown w/ loading + auto-resolved tool card + schema inputs + raw-JSON advanced toggle + wallet/policy) + right timeline; portal `test-console-sign-modal.tsx` for Approve & sign (mirroring existing `PricingDrawer` portal).
- **Audit → standalone screen/route** + clickable row → `audit-row-detail-modal.tsx` with external `testnet.cspr.live` anchor (`target=_blank rel=noopener`) + failure reason.
- **Shared:** `src/lib/format-address.ts` leading-only truncation helper used everywhere; two-theme tokens; font loading.
- **Nav:** collapse to 6 top-header items; Provider one item with sub-tabs; move Explorer link out of app header into account menu (Explorer is public).

## Mocked Prototype Surfaces

Prototype-honesty ledger (designer's own list). Reintegration must classify each; current real-status noted:

| Mocked surface | Reintegration target |
|---|---|
| CSPR.click wallet connection & session | **Real path exists (connect)**; browser-approved **settlement still unproven** — the genuine frontier. |
| Wallet balances & readiness | **Already real** — wire UI to `api/wallets/[id]/readiness`. |
| Spend-policy evaluation | **Already real** — `api/wallets/[id]/policy`, fail-closed. |
| MCP / tool discovery & schema | **Already real** — `api/provider/sources/[id]/discover`, `console-schema.ts`. |
| x402 verify/settle (CSPR.cloud) | **Already real & proven.** |
| Casper proof & deploy hashes | **Already real & proven.** |
| Receipts & audit storage | **Already real** — DB-backed. |
| CSPR.cloud external WCSPR feed | **Already real** — `api/explorer/actions`. |
| Provider credentials & client tokens | **Already real** — server-side scoped. |

## Required Prototype Reintegration

Per the skill and the prototype's own instruction, **a reintegration pass is mandatory before planning.** It must:
1. Confirm the "already real" surfaces above and produce the exact UI→API wiring map (the easy 80%).
2. Resolve the **signing-mode decision** (see Open Questions) — this gates the Runner + gate + Settings copy and is the central open product question. Feeds directly into the signing-modes plan Abu requested, grounded in `2026-06-25-casper-gw-signing-modes-reality.md`.
3. Decide the NET-NEW UI scope (below) and its real-vs-deferred boundaries.

## Per-Directive Reconciliation (Abu's 10 callouts → prototype evidence → actions)

**1 · Declutter.** Confirmed: the whole board is the decluttered target (single columns/simple grids, hairline borders, generous padding, mono for data only). The current build is the over-clustered "before."

**2 · Settings (remove connector clutter, go tabbed).** Confirmed in design (tile 12 is already 4-tab, trust-boundary-based, with NO provider-capability rows).
- *Remove:* `BrowserSigningProviderCapabilities` block + helpers (`browser-signing-evidence.tsx:32-79`); 3 runtime CSPR-connector rows (`settings-signing-mode.ts:3-32`); "Open CSPR.click provider chooser" button + `onConnectBrowserWallet` wiring (`settings-screen.tsx:58-67`, `gateway-app.tsx:183`); embedded Audit panel (`settings-screen.tsx:70-97`); 7-row signing KeyValueList.
- *Add:* 4-tab strip; Trust-boundaries 3 colored-dot cards (amber upstream / blue client token / red wallet identity, masked); Network&facilitator card (WCSPR CEP-18, Mainnet HIDDEN·LATER); Client-access state card ("cannot authorize payment"); Signing tab static 2-mode list + production-custody-not-claimed + per-call x402 paragraph.
- *Restructure:* Settings becomes **read-only informational**; static signing descriptor.

**3 · Wallets (selection-first + dynamic page).** Partially in prototype (tabbed modal + funding stepper present; single "Operator wallet" only — **no list→[id] route, no create-agent-wallet, no separate name/edit modals**). These are Abu's directive → **reintegration gap to build**.
- *Remove:* five-panel always-on grid (`wallet-screen.tsx:62-196`); inline spend-policy editor (`149-179`); CSPR.click capability evidence (`96-97`); always-mounted add-wallet panel (`94-135`); wallet-activity panel (`181-194`).
- *Add:* `src/app/app/wallets/[id]/page.tsx` + selection-first list; profile/readiness/policy tabbed modal; **fund-wallet stepper drawer ("the one real gap")**; name-wallet + edit-policy modals; compact summary cards; account-mismatch banner; policy preview PASS/BLOCK + kill switch; consistent leading-address truncation. Wallet name e.g. "operator wallet".

**4 · Runner (hosted dropdown + dynamic inputs + sign modal).** Strongly confirmed (own-hosted vs paste-URL; schema inputs; verbatim *"Tools with no inputs show a 'No input required' state. Raw JSON is advanced/debug only."*). Two prototype gaps vs your words: dropdown **LOADING state not drawn**; Approve&sign is a **timeline step, not a modal**.
- *Remove:* split endpoint + separate discovered-tools panel + manual Discover button (`test-console-target-panels.tsx:13-104`); always-on 4-row KeyValueList (`test-console-screen.tsx:115-126`); dual inline run buttons (`test-console-wallet-actions.tsx:46-51`).
- *Add:* hosted-provider **dropdown with loading state**; single **Approve & sign modal** (`test-console-sign-modal.tsx`); raw-JSON advanced toggle; compact selected-tool card + estimated-charge tile; leading-only truncation.
- *Keep:* schema-driven inputs + "No input required" (already correct, `console-schema.ts:20-46`, `:153-155`).

**5 · Audit (the one gap: cspr.live link + failure modal).** Confirmed gap — audit shows `deploy 9c2b…4a` as **plain text**, no clickable cspr.live link, no row-detail modal.
- *Add:* standalone Audit screen/route; clickable row → deploy-detail modal with `testnet.cspr.live` link + **why-it-failed** detail; split Audit out of the fused "Settings and Audit".

**6 · Explorer (public, outside app).** Confirmed — `/explorer` has its own minimal header, "PUBLIC · NO SIGN-IN", no app nav; route-map puts it under PUBLIC·NO WALLET. Current build already correct here; mainly re-skin to light theme + dual-feed layout.

**7 · App gating (blur + connect overlay).** Adjacent — prototype draws a **full-page gate** + a complete connection-state machine; the literal **blur-behind-workspace + connect overlay** is the explicit upgrade to build. Current build renders the workspace immediately (`gateway-app.tsx:61-64`) — **no gate today; biggest behavioral gap.**
- *Add:* `src/app/app/layout.tsx` gate (blur + overlay); account menu + mismatch banner; remove explorer link from app header.

**8 · "Leading address" detail.** Confirmed — truncation is inconsistent today (head+tail `slice(0,10)+slice(-8)` in runner; 6/6 vs 4/4 vs full in wallet). Design uses consistent leading…trailing. *Add `src/lib/format-address.ts` and use everywhere.*

**9 · Core surfaces / delete unneeded.** Confirmed — five surfaces (Provider / Wallet control plane / Runner / Public explorer / Settings&audit); nav = Dashboard·Provider·Wallets·Runner·Audit·Settings (Explorer public). No registry, no private tools, no CDR/Story. Current nav has 7 off-spec items → collapse to 6.

**10 · Signing modes.** The prototype encodes the three modes as **honest framing** and treats the MVP choice as an open question (see Open Questions / signing decision). This is the center of the next research+plan.

## Spec Deltas (proposed — not yet applied)

- Add public landing `/` and public `/receipt/:id` as first-class routes alongside `/explorer`.
- Add explicit **app-gating** requirement (wallet-connect required for `/app`; blur+overlay; connection-state machine incl. account mismatch).
- Add **two-theme** requirement (light public / dark app) + typography + color-token semantics as product-level design invariants.
- Promote **Audit** to its own surface; require clickable cspr.live proof link + failure-detail modal on audit rows.
- Specify **Settings as read-only tabbed** (trust boundaries / network&facilitator / signing / client access) with provider-capability diagnostics removed.
- Specify **Wallets as selection-first** with dynamic per-wallet detail, tabbed modal, funding stepper, policy preview + kill switch, create-agent-wallet.
- Specify **Runner** source dropdown (loading) + dynamic schema inputs + Approve&sign modal + raw-JSON advanced.
- Add **signing-mode** as an explicit spec decision with three honest options and the "no pre-approved Casper session" constraint.

## Story Deltas (proposed)

- New: "As a visitor I can verify any receipt at `/receipt/:id` without a wallet."
- New: "As an operator I must connect a CSPR.click wallet before the `/app` workspace unlocks (blurred until connected)."
- New: "As an operator I select a wallet from a list and manage it on its own page (policy, funding, naming) via modals/drawers."
- New: "As an operator I open an audit row to a cspr.live-linked detail modal explaining success or the exact failure."
- Update: Runner story to include hosted-source dropdown with loading + Approve&sign modal.
- Update: Settings story to read-only tabbed trust boundaries (remove connector capability probe UI).

## Plan Deltas (proposed)

- Treat v3 as **re-skin + wire-to-existing-real-backend** first (low risk), then NET-NEW UI (gate, wallet [id]+funding drawer, audit modal, settings declutter, runner modal), then the **signing-mode decision** as its own research-backed slice.
- Sequence suggestion (subject to reintegration): (a) design-system foundation (themes/fonts/tokens/format-address); (b) gating layout; (c) settings declutter + audit split; (d) wallets select-first + [id] + funding drawer; (e) runner dropdown+modal; (f) public landing + receipt route; (g) signing-mode slice.
- Do not start implementation until reintegration + signing decision are accepted.

## Quality Profile Deltas (proposed)

- Add browser-check coverage for: app gate (blurred/connected), wallet `[id]` route, funding stepper, runner approve&sign modal, audit cspr.live modal, light/dark theme parity, mobile bottom bar.
- Keep the 200/300-line source guard; new modals/drawers/pages should be small focused components (the prototype's modal taxonomy maps naturally to one component each).

## Open Questions

1. **Signing mode for MVP** (the big one): browser-wallet (CSPR.click per-tx approval) / local test-signer / external — and how to honestly represent the **hosted pre-approved/"autonomous"** mode Abu wants, given the prototype's own constraint: *hosted pre-approved agent wallet is not a documented Casper primitive; every paid call needs a fresh signed authorization (no pre-approved sessions).* This is the heart of the signing research+plan Abu requested.
2. Wallets: confirm the single "Operator wallet" tabbed-modal content should be re-hosted on a per-wallet `[id]` page, with a selection-first list + create-agent-wallet entry (prototype shows only one wallet).
3. Gating: implement the literal **blur-behind-workspace + connect overlay**, or a standalone gate page? (Abu asked for blur+overlay.)
4. Runner: confirm a true hosted **dropdown with loading** (operator's hosted providers/tools) and a discrete **Approve & sign modal** (prototype renders these as a resolved pill + timeline step).
5. Audit: should the row-detail modal reuse the four-layer `lib/receipt-detail.ts` rendering, or a leaner failure payload?
6. CEP-18 payment asset: confirm the WCSPR testnet package/payee.
7. First source path for the demo: prototype uses remote-MCP (acme-weather); current proof used `cspr-trade-mcp`.
8. Routing: move `/app` to real nested sub-routes (needed for `/app/wallets/[id]` + addressable audit), or keep state-switching? (Reintegration recommends real routes.)
9. Public catalog/registry: stays deferred ("only after core loop works") — confirm out of MVP (aligns with AGENTS.md).
10. Final product name for the submitted UI.

## Evidence

- Master board: `~/Downloads/Casper agentic repository (2)/Casper GW.dc.html` (tiles 00–13, responsive, appendices). Firsthand-read tiles: 00 (design system, lines 21–104), 01 (landing, 106–178), route-map/status/mock appendices (754–838).
- Standalone exports: `Casper GW - App.dc.html`, `… - Runner.dc.html`, `… - Explorer.dc.html`; runtime `support.js` (engine only, no app data).
- Discovery workflow run `wf_b7201412-3a8` (9 agents, 1.14M tokens): structured extracts + 4 domain comparisons at `/tmp/cgw-discovery/`.
- Current implementation: `src/components/screens/*`, `src/components/gateway-app.tsx`, `src/components/app-shell.tsx`, `src/app/**`, `src/db/schema.ts`.
- Cross-refs: `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`, `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`, `.thoughts/research/2026-06-25-casper-gw-signing-modes-reality.md`, `.thoughts/README.md`, `AGENTS.md`.
