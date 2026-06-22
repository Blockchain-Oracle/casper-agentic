# Casper GW — Design Direction & Structure (scoped)

Date: 2026-06-22
Status: **the design is NOT approved yet.** This is *adjustment-level* direction — not a redesign and not a long wishlist. Keep what works; fix structure and the funding flow. This supersedes the long "should improve" list in the design review §13 (treat that as background, this as the brief).

---

## 1. What the product actually is (the "twist")

One line: **a Casper-native agent commerce gateway** = the MCPay-style *connect-an-API/MCP → price → publish → route paid calls* gateway, **+** a Cards402-style *agent-wallet control plane* (fund + spend-policy), **+** a public Casper x402 explorer with a 4-layer receipt — all settled on Casper via CSPR.cloud x402.

The "more" that makes it defensible (none of the references have it): the **public, verifiable, policy-gated proof loop** — every paid call produces a receipt that separates gateway context · policy decision · x402 verify/settle · Casper proof, viewable by anyone with no sign-in. MCPay/TollPay stop at "it got paid"; we prove *what* was paid, *why it was allowed*, and *that it settled on Casper*. That receipt + honesty discipline is the product, not the wrapper.

---

## 2. Layout: top-header, not sidebar (grounded, not opinion)

Move the authenticated app from the **sidebar** (current prototype) to a **sticky top-header nav** — the pattern used by Casper GW's own v1 pre-audit AND by the real MCP tools:

- `v1 pre-audit` → top header (Operations · Sources · Pricing · Endpoint · Wallet · … across the top).
- `MCPay` → `<nav class="sticky top-0">` top navbar; account/wallet in a **tabbed modal** off the header (`navbar.tsx`, `account-modal.tsx`, tabs developer/wallets).
- `TollPay` → `<header class="sticky top-0">` `SiteNav` + `NavLinks`.

Top-header reads as real infra software; a bespoke sidebar over flat card-pages is what makes it feel AI-generated. Keep the public side as-is (it already uses a clean top header).

**Suggested header:** logo · primary nav (Dashboard · Sources · My Tools · Endpoint · Wallets · Test Console) · right side: Network pill (Testnet) · account menu (→ Settings, Audit, View public explorer). Secondary/rare surfaces live in the account menu, not as permanent nav.

---

## 3. Where modal / where tab / where page

The rule: a **page** is a workspace you live in; a **tab** splits one workspace's facets; a **modal/drawer** is a focused task you complete and close. Stop putting tasks on permanent half-empty pages.

| Surface | Structure | Why |
|---|---|---|
| Dashboard, Explorer, Test Console, Receipt detail | **Page** | Workspaces / destinations |
| **Wallet + funding + policy** | **Modal with tabs** (Wallets · Funding · Policies) off the header — MCPay's account-modal pattern | Dense, task-focused; funding is a guided flow, not a page |
| **Fund wallet** (connect → address → faucet → confirming → ready) | **Drawer/stepper inside the wallet modal** | It's a journey; progressive disclosure |
| **Add source** (type → URL → upstream auth → discover) | **Modal wizard** | A one-time task, not a standing form |
| **Price & publish a tool** | **Drawer on the selected tool** (My Tools = list → click → drawer) | Per-tool task; keeps the list clean |
| **Settings** | **One page, tabbed** (Credentials · Network · Facilitator · Signing) | 4 facets of one thing, not 4 flat cards |
| Hosted endpoint config | **Page** with copy blocks (fine as-is) | Reference surface |
| Audit | **Page** + filters | Log destination |

Net effect: the Console and Sources stop bottoming out into empty canvas (tasks move into modals), and nothing feels crammed (each page has one job). This fixes the "doesn't feel right" without adding visual noise.

---

## 4. The only must-fixes (tightened)

1. **Top-header nav** replacing the sidebar (this single change does most of the "feels professional" work).
2. **Wallet funding journey** as a guided modal/stepper — connect → receive address → Testnet faucet → confirming (poll CSPR.cloud balance) → ready (CSPR gas + CEP-18 + allowance). Cards402's 6-state stepper is the model (see §6).
3. **Modals/tabs/drawers** for wallet, source-add, tool-pricing, settings (per §3) — replaces the "raise density" note.
4. **Explorer vitality strip** + real `testnet.cspr.live` deploy-hash links.
5. **Honesty labels** kept: per-result "design fixture" tag on the console; never a fake deploy hash.

Everything else in the review is "nice later." Do not redesign the visual language (the editorial type / red-black palette is good) — restructure the IA.

---

## 5. Don't reintroduce

Registry surface, private/public tool labels, simulated/local product mode, fake proof, a separate "send policy." (All correctly removed in the current version — keep them out.)

---

## 6. Wallet = the Cards402 model (for the build agents)

The agent wallet IS the Cards402 pattern, and the handoff carries the code-level detail: non-custodial (store only the public key; build unsigned tx for the wallet to sign; agent key via one-time claim code, never in chat); a **funded-state derived from a live on-chain balance poll** (not a stored flag); a fail-closed spend-policy engine (single-tx cap · daily limit · approval-threshold-with-TTL · allowed hours/days · kill-switch) logged to a separate `policy_decisions` audit layer; plus clevercon's deposit→lock→release→**refund** for per-session budgets. Full mapping in `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md` §3–§4 and the review §6.

---

## Evidence
v1 pre-audit render (`.thoughts/design/2026-06-22-review-screenshots/v1-pre-audit-desktop.png`); `MCPay/apps/app/src/components/custom-ui/navbar.tsx` + `account-modal.tsx`; `toll/apps/dashboard/src/components/shared/SiteNav.tsx`; current prototype screenshots (same folder).
