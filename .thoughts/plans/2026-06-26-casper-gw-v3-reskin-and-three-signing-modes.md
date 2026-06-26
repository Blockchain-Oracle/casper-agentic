# Plan: Casper GW v3 — Clean UI + Agent Wallet + Three Payment Triggers

> Status: PROPOSED (awaiting Abu approval to execute). Supersedes the earlier draft's
> "three signing modes" framing. Reflects the model Abu ACCEPTED on 2026-06-26.
> Traces to: discovery `2026-06-26-casper-gw-designer-prototype-v3.md`, reintegration
> `2026-06-26-casper-gw-v3-and-signing-modes.md`, signing research `2026-06-26-...-deep-research.md`,
> decision workflow `wf_98fab2bf-c3a`. Honesty boundaries per AGENTS.md.

## The Accepted Model (the single settled picture)

**The agent wallet** = a Casper-Gateway-held wallet with **spend limits + an allowlist of tools** (governance plane, Cards402-inspired). Keys are held by Casper Gateway, **encrypted, Testnet-only, explicitly not production custody** (Abu accepted this hosted-custody gate on 2026-06-26).

**One signing engine, three triggers** — all settle the same fresh per-call EIP-712 `TransferWithAuthorization` through the CSPR.cloud facilitator (facilitator pays gas):

1. **"Pay with my agent wallet"** (website button) — Casper Gateway signs with the held key, under that wallet's limits/allowlist.
2. **"Connect & sign"** (website) — user connects a Casper wallet via CSPR.click (**Casper wallets only — no Google/Apple, already removed**) and approves in a popup; key stays with the user. *Best-effort:* currently blocked on a typed-data-capable provider (Casper Wallet ext rejects typed-data); ships if a compatible provider works, otherwise shown honestly as unavailable.
3. **Autonomous agent + scoped API key** — an agent (Cursor/Claude Code/script) calls the hosted endpoint with only an API key bound to one agent wallet; Gateway checks policy, signs server-side, settles, returns the result. The agent never sees a 402, never signs. **No separate CLI/MCP wallet to build.**

Triggers 1 and 3 are the **same engine** (Gateway-held key signs); only the trigger differs (button vs API key). Trigger 2 is the existing browser path.

## Inputs

- Reintegration verdict: planning ALLOWED; backend already real/proven for the judged path (Phases 0–24 with real Testnet deploys).
- Decision: autonomous path = "Approach A" (Gateway signs via API key), accepted.
- Abu decisions: hosted custody Testnet-only accepted; the 10 declutter/IA directives ([[casper-gw-prototype-v3-directives]]); deadline not a constraint; real verified behavior only, no mock docs ([[explain-in-detail-before-accept]], [[deadline-not-a-constraint-quality-bar]]).

## Assumptions

- v3 is a **re-skin + new UI + a focused net-new backend slice (hosted custody)** — not a backend rewrite. The verify/settle/proof/receipt/policy/discovery pipeline stays.
- `/app` migrates from a single client-state screen switch to **nested App Router routes** (needed for `/app/wallets/[id]`, addressable audit, public `/receipt/[id]`).
- **Key-storage posture (genuine open decision, recommend now):** per-wallet key encrypted at rest with an env-derived symmetric key, decrypted in-memory only at signing, never logged/exposed. Testnet-only; a KMS swap is a later upgrade. **Abu to confirm at Phase 6.**
- **Funding/readiness (genuine open decision):** a Gateway-held agent wallet needs initial Testnet CSPR (gas note) + WCSPR (payment asset). Reuse the funding stepper journey; the operator funds the wallet's address. **Abu to confirm the funding UX at Phase 5/6.**
- Live on-chain spends happen only with explicit Abu approval, one at a time.

## Prototype Reintegration Gate

Accepted (`2026-06-26-casper-gw-v3-and-signing-modes.md`): every surface classified, no unlabeled shipping mocks. Mainnet, production custody, public registry, allowance/account-abstraction pre-approval = OUT_OF_SCOPE. Hosted custody is REAL_MVP, Testnet-only, labeled.

---

## Phase 1 — Design-system foundation + routing skeleton

### Goal
The v3 visual system and the route structure everything hangs on.

### Work
- Theme tokens: light public (`#FAF9F6`/`#14151A`), dark app (`#0F1115`/`#15171c`); status colors (settled `#35B07A`, x402 `#5B8DEF`, policy `#E6A93C`, brand `#E5383B`); fonts Hanken Grotesk (UI) + IBM Plex Mono (data only).
- `src/lib/format-address.ts` — one leading…trailing truncation helper; replace ad-hoc truncations.
- Migrate `/app` to nested routes (`dashboard/provider/wallets/wallets/[id]/runner/audit/settings`); add public `src/app/receipt/[id]/page.tsx`; re-skin `src/app/page.tsx` landing shell.

### Real Integration Path / Mock Policy
Pure UI/routing over existing real data. No mocks.

### Checks / Acceptance / Stop
`pnpm lint/typecheck/build`, `guard:files`; all routes render in the new theme. Stop when routes resolve + build green.

---

## Phase 2 — App gating (blur + connect overlay)

### Goal
`/app` is wallet-gated; public surfaces stay open.

### Work
`src/app/app/layout.tsx` reads CSPR.click connection state → workspace **blurred** with a connect overlay until connected; drops on connect. Connection-state machine (loading/connecting/connected/switched/**mismatch**/unavailable/signed-out). Account menu + mismatch banner; collapse nav to 6 items; move Explorer link out of app header. Connect modal offers **Casper wallets only** (done in config).

### Real Integration Path / Mock Policy
Real CSPR.click runtime; no login/spend performed by the build. No mocks.

### Checks / Acceptance / Stop
`test:browser:csprclick`: blurred when signed out, unlocked when connected, mismatch blocks. Stop when gating works both ways and explorer stays public.

---

## Phase 3 — Public surfaces (landing + explorer re-skin + receipt detail)

### Goal
Public proof infrastructure in the v3 light theme.

### Work
Landing `/` (hero, latest-proof, proof-loop, public/app zones, activity stats); Explorer `/explorer` (light dual-feed: local 4-layer receipts | external WCSPR, search pills, filters, pagination); Receipt `/receipt/[id]` (four-layer spine + cspr.live link + redaction note, reuse `lib/receipt-detail.ts`).

### Real Integration Path / Mock Policy
`api/receipts`, `api/receipts/[id]`, `api/explorer/search`, `api/explorer/actions` — real. Landing stats: real DB aggregates **or** visibly `SAMPLE·FIXTURE` labeled. No deploy/"settled" without a real deploy.

### Checks / Acceptance / Stop
Browser smoke desktop+mobile, public (no auth/sidebar); deep-link `/receipt/[id]`. Stop when public verify works end-to-end without sign-in.

---

## Phase 4 — Settings declutter + Audit standalone

### Goal
Clean read-only tabbed Settings; Audit as its own surface with the missing cspr.live proof link.

### Work
Settings → 4 in-page tabs (Trust boundaries / Network & facilitator / Signing / Client access); **remove** provider-capability probe + connect button + embedded audit (`browser-signing-evidence.tsx`, runtime rows in `settings-signing-mode.ts`); rework signing-mode to a static descriptor. Audit `audit-screen.tsx` + route: distinct-state table; **clickable row → deploy-detail modal** with `testnet.cspr.live` link + failure reason (reuse `receipt-detail`).

### Real Integration Path / Mock Policy
Config/readiness real; audit events from receipts DB. No mocks; fixtures labeled; no `sk_live` prefixes.

### Checks / Acceptance / Stop
Unit + browser smoke; `guard:product`. Stop when Settings shows only necessary tabbed info and audit rows open cspr.live + failure detail.

---

## Phase 5 — Agent wallet governance UI (limits + allowlist)

### Goal
The agent wallet as designed: select-first list → dynamic detail page; limits + allowlist + funding + naming in clean overlays.

### Work
`src/app/app/wallets/page.tsx` selection-first list + **create agent wallet**; `src/app/app/wallets/[id]/page.tsx` detail (identity / ready-to-pay / spend-policy summary). `wallet-detail-modal.tsx` tabbed (Profile / Readiness & funding / Policy) with **limits + allowlist editing** (multi-tool allowlist; optional tool blacklist), **policy preview PASS/BLOCK**, **kill switch**. `fund-wallet-drawer.tsx` 4-step stepper (2 tracks: gas/asset, faucet link). `wallet-name-modal.tsx`. Remove the inline 5-panel cram + CSPR.click capability evidence. Per-wallet signing/custody label.

### Real Integration Path / Mock Policy
`api/wallets`, `.../[id]/readiness`, `.../[id]/policy` — real (Phase 2 backend). Policy preview computed from real policy; kill switch = policy disable. Readiness evidence-based. UI currently sends one allowed tool → extend to the array the schema already supports. No mocks.

### Checks / Acceptance / Stop
Unit (policy preview, allowlist array, kill switch), browser smoke (list→[id], modals, stepper). Stop when select→[id]→edit-limits/allowlist→fund works over real APIs.

---

## Phase 6 — Hosted-custody signing engine (the backend foundation for triggers 1 & 3)

### Goal
Casper Gateway can hold an agent wallet's key and sign a paid call under policy — the shared engine behind "Pay with my agent wallet" and the autonomous agent path.

### Work (net-new, reuse-heavy)
1. **Schema:** add an encrypted key column (or KMS ref) to `agentWallets`; add `walletId` FK to `endpointAccessKeys` (mirrors `spendPolicies.walletId`); surface `walletId` from `requireEndpointAccess`.
2. **At-rest crypto:** add encrypt/decrypt utilities (env-derived key; decrypt in-memory only; never log). *(none exist in src today)*.
3. **Per-wallet signer:** refactor `createSigner`/`readSignerPem` (`x402-payment.ts`) off the single global env PEM to accept a decrypted per-wallet key.
4. **`hosted` signingMode** value (`wallet-store.ts`) gating the held-key path.
5. **Funding/readiness** for a Gateway-held wallet (the operator funds the wallet's address; reuse the Phase 5 stepper) so calls don't fail at the facilitator.

### Real Integration Path / Mock Policy
Reuses the proven `createCasperPaymentPayload` + verify/settle/proof pipeline. **No mocks. Honest Testnet-only custody label; productionCustody = not_claimed.** Do not build until Abu confirms the key-storage posture (he accepted hosted custody; confirm env-encrypted vs KMS here).

### Checks / Acceptance / Stop
Unit: encrypt round-trip; key never leaks; policy-before-sign ordering; fresh nonce per call. Stop when a Gateway-held wallet can produce a valid signed x402 payload under policy (no live spend yet).

---

## Phase 7 — Web payments in the Runner (triggers 1 & 2)

### Goal
The Runner's two web pay options + clean runner UX.

### Work
Runner UX: hosted-provider **dropdown with loading**, tool select, **dynamic schema inputs** ("No input required" state; raw-JSON behind an advanced toggle), wallet/policy selectors, estimated-charge tile, paid-call timeline. **Approve & sign modal**. Two pay buttons: **"Pay with my agent wallet"** (calls Phase 6 engine → Gateway signs) and **"Connect & sign"** (existing CSPR.click browser path). Collapse the split endpoint/discovered panels + dual inline run buttons.

### Real Integration Path / Mock Policy
"Pay with my agent wallet" uses the Phase 6 hosted engine; "Connect & sign" uses the existing `browser-payment-*` path. No "settled"/deploy claim before settlement. "Connect & sign" stays fail-closed on incompatible providers (honest).

### Checks / Acceptance / Stop
Unit + browser smoke; **live smoke (one Abu-approved spend): prove a real "Pay with my agent wallet" Testnet settlement** → deploy hash on testnet.cspr.live. Stop at that real deploy (or documented honest blocker for "Connect & sign" if no typed-data provider).

---

## Phase 8 — Autonomous agent path (trigger 3 — the headline)

### Goal
An agent pays a 402 by itself through Casper Gateway, under the wallet's limits/allowlist.

### Work
Add a **server-signs branch** to `/api/mcp/[sourceId]` (`route.ts`): when the scoped token is bound to a `hosted` wallet and no payment header is present, run policy → sign server-side against `requestUrl#toolName` → feed into the existing verify/settle path (instead of returning 402). Document the agent setup (point any MCP/HTTP client at the endpoint + scoped key). Honest Testnet-only custody docs.

### Real Integration Path / Mock Policy
Reuses Phase 6 engine + the proven hosted verify/settle/proof pipeline. No mocks.

### Checks / Acceptance / Stop
Unit (token→wallet binding; policy-before-sign; resource binding); security review (key never in receipts/logs/exports; credential planes separate); **live smoke (one Abu-approved spend): an agent with only an API key completes a real Testnet x402 paid call** under policy. Stop at that real deploy.

---

## Phase 9 — Verification + submission packaging

### Goal
Prove it all, honestly, and make it submittable.

### Work
Run `verification-audit` + focused security/x402/CSPR.click reviewers; `pnpm run ci`, `test:browser`, `test:browser:csprclick`, all guards. Confirm: real deploy evidence for triggers 1 & 3 (trigger 2 documented honestly), no unlabeled mocks, no Mainnet/production-custody claims, no leaked credentials. Write a verification artifact per slice. **Submission:** make the GitHub repo public/open-source with README usage docs; record a public demo video (the proof loop + the agent wallet + autonomous agent paying).

### Stop Condition
`pnpm run ci` green; all three triggers demonstrated or honestly bounded; submission deliverables ready.

## Verification Checkpoint

Per AGENTS.md Quality Gates: lint/typecheck/build, browser desktop+mobile, public explorer + gated app + receipt proof layers + Testnet labeling, file-size/product/secret/workflow guards. No success claim without command evidence.

## Handoff Notes

- Sequence: UI-first (1–5, low risk over real backend, zero on-chain spends) → hosted-custody engine (6) → web payments (7) → autonomous agent (8) → verify+ship (9). Phases 7 & 8 each need one Abu-approved Testnet spend.
- Genuine open decisions to confirm in-flight: key-storage posture (Phase 6), funding UX for Gateway-held wallets (Phase 5/6).
- Keep the existing integration `test-signer` path working as a backstop while hosted custody matures.
- Commit per phase on `feat/casper-gw-phase-0`; fast-forward `main` when a phase is stable.
