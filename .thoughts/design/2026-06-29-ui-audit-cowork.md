# UI Design Audit — Casper GW (landing + Account modal)

Date: 2026-06-29 · Method: the `design-director` `/design-review` lens (premium-ui blocklist +
interaction-pattern rules), applied **statically at the code level**. I read the source from Cowork but
did not render the app — the live screenshot pass (desktop + mobile) is Claude Code + Playwright on your
machine via `/design-review`. Scope read: `src/app/page.tsx`, `src/app/globals.css`,
`src/components/account/{account-dialog,wallet-tab,developer-keys-tab,fund-tab}.tsx`,
`src/components/ui/dialog.tsx`.

## Verdict

Your **design tokens are strong**; the **composition is monotone**. The "parts, parts, parts" feeling is
real, and it's a *rhythm + hierarchy* problem, not a token problem — almost every section and every modal
tab is the same `rounded border-hairline bg-panel/well` box at the same vertical rhythm, so the eye gets
no hierarchy. No re-architecture needed; this is a polish/composition pass.

## What's working (keep it)

- **Proof-Print tokens** (`globals.css`): cohesive bone "receipt paper" / carbon console palette, **one**
  reserved brand accent (`--color-casper #FF473E`) for CTA/proof, light/dark via `data-theme`, tabular
  numerals (`.tnum`), mono eyebrows. This is disciplined and *not* AI-slop in the obvious ways (no
  purple-on-white, no rainbow accents).
- Semantic status tints (`settled`/`signal`) are used correctly in the wallet/fund status blocks.
- The modal is scrollable on mobile (`max-h-[92dvh]`), has copy buttons, and a sensible 3-tab IA.

## Landing (`src/app/page.tsx`) — findings

- **[High] Monotone section rhythm.** Featured / How-it-works / Stats / CTA are each
  `border-t border-hairline py-14` + a mono eyebrow + a 3-col grid of `rounded-lg border border-hairline bg-panel p-5`
  cards. That's three near-identical card grids stacked at identical spacing — the blocklist's "three
  identical cards" + "every section the same vertical rhythm, no density variation." *Fix:* vary density
  and treatment per section so each reads as its own thing.
- **[High] Stats render as the same card as How-it-works.** Three bordered panel cards again. *Fix:* make
  Stats a single **full-bleed band** — large `tnum` figures on a contrasting `well`/inverted strip — not 3
  panel boxes. This one change breaks most of the monotony for little effort.
- **[Med] Type pairing is the default "AI technical" trio.** Space Grotesk (display) + Inter (body) +
  JetBrains (mono). Inter-as-body is the #1 generic tell, and Space Grotesk is the over-converged
  "distinctive" pick. For a *Proof-Print / receipt* identity it's underselling. *Fix:* try a more
  characterful display (a grotesque like Söhne/Geist, or a condensed/editorial face) and/or lean the mono
  into the brand for headings; keep Inter only as a fallback.
- **[Med] Zero motion.** The DESIGN motion budget is unused — no page-load reveal anywhere. *Fix:* one
  orchestrated hero/stagger reveal (transform/opacity only, respect `prefers-reduced-motion`). One moment,
  not everywhere.
- **[Med] "How it works" is 3 identical boxes.** *Fix:* present it as a numbered *sequence* (connecting
  rule/line, or alternating density) so the 01→02→03 reads as a flow, not a card row.
- **[Nit] Eyebrow labels are identical on every section** (mono 11px tracking-widest ink-3). Vary or anchor.
- **[Nit] Verify `ServerCard` hover/focus** gives a clear lift/border so the featured grid feels interactive.

## Account modal (`src/components/account/*`) — your #1 complaint

- **[High] Every element is the same box.** WalletTab = a `well` box + three equal `Stat` panel cards + a
  status box; FundTab = a `well` box + `Metric` panel cards + forms — all same radius/border/bg. Nothing
  leads, so the thing that matters (your keys + their balances) doesn't stand out. *Fix:* give each tab
  **one** primary block and demote the rest; don't make three equal stat cards the headline.
- **[High] Loading is `"..."` text, not skeletons.** `account-dialog` sets `loading` and the tabs show
  literal `"..."` for balances — the blocklist's "blank flash instead of a skeleton." *Fix:* skeleton rows
  for balances/keys while loading.
- **[Med] `max-w-4xl` is too wide for the content.** A tab with three small stat cards in a 4xl dialog
  reads empty/sparse on desktop. *Fix:* drop to `max-w-2xl`/`3xl`, or earn the width with a two-column
  layout (keys list + selected-key detail).
- **[Med] Native `window.confirm` for key delete** (`developer-keys-tab`) is jarring/off-brand. *Fix:* a
  styled confirm (shadcn `AlertDialog`) in Proof-Print.
- **[Med] Missing `DialogDescription`.** Radix warns on it, and there's no context line under "Account" or
  per tab. *Fix:* add a one-line description per tab (what it's for).
- **[Med] Fund tab mixes two paths in one flat stack** — auto wallet-send *and* manual deploy-hash claim.
  *Fix:* a clear primary ("Fund with wallet") with the manual path secondary/collapsed ("Already sent?
  Paste a deploy hash"), or a 2-step.
- **[Nit] Empty states are thin.** "No published tools found" is a bare line; verify the keys-list empty
  state is a real empty state (icon + one line + primary action).
- **[Nit] Tabs are stock shadcn** (`bg-well grid-cols-3`); an accent active-underline or mono labels would
  tie them to Proof-Print.

## Do next (prioritized for Claude Code)

1. **Stats → full-bleed band** (landing High) — biggest win for least effort; breaks the card monotony.
2. **Modal hierarchy + skeletons** (modal High) — fixes "parts" where you feel it most.
3. **Section rhythm/density variation** across the landing (landing High + the How-it-works sequence).
4. **One page-load motion moment** (landing Med).
5. **Modal width + styled confirm + `DialogDescription`** (modal Med).
6. **Type pairing exploration** — try one alternative display/mono and compare side by side.

Then run `/design-review <route>` (Playwright, on your machine) to screenshot desktop + mobile and verify
against `DESIGN.md` and the blocklist. For the rebuilds, use `premium-ui` so sections come from real
author components reskinned to the Proof-Print tokens — don't hand-roll them.
