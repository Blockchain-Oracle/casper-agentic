# Verification: Casper GW v3 Revamp — Implementation Progress (2026-06-26)

Plan executed: `.thoughts/plans/2026-06-26-casper-gw-v3-reskin-and-three-signing-modes.md`
(harness copy: `~/.claude/plans/before-you-even-continue-fuzzy-parasol.md`).

This artifact records the verified state honestly: what is built **and verified**, what is
built **but not live-proven**, and what is **pending** (live Testnet spends + visual review).

## Verified green (commands, this session)

- `pnpm typecheck` ✓
- `pnpm lint` ✓
- `pnpm build` ✓ — all routes generate (see route inventory below)
- `pnpm test` ✓ — **279 unit tests pass** (66→67 files; +format-address, +wallet-key-crypto, +policy-preview)
- `pnpm guard:files` ✓ (no warnings) · `pnpm guard:secrets` ✓
- NOT run / known-stale: `pnpm test:browser` + `test:browser:csprclick` — the Playwright suites assert the **old** `/app` UI and will need updating now that routing + gating + screens changed. Tracked as a Phase 9 follow-up; not yet done.

Route inventory after build: public `/`, `/explorer`, `/receipt/[id]`; gated `/app` → `/app/{dashboard,provider,wallets,wallets/[id],runner,audit,settings}`.

## Done & verified

**Phase 1 — design system + routing**
- `src/lib/format-address.ts` (+ test) — one `01a2…ef` truncation helper.
- v3 theme tokens in `base.css` (light public / dark app via `[data-surface="app"]`, x402/settled/policy/brand colors); fonts via `next/font` (Hanken Grotesk + IBM Plex Mono).
- Shared `src/components/ui/modal.tsx` (+ `ModalTabs`) and `src/components/receipt/receipt-detail-view.tsx` (explorer rewired to it).
- Public `src/app/receipt/[id]/page.tsx` (real resolution, honest 404, cspr.live link).
- Routing migration: `WorkspaceProvider` context holds the 3 domain hooks unchanged; nested `/app/*` route pages; `/app`→dashboard redirect; Provider consolidated into one tabbed surface. Deleted dead `gateway-app.tsx`, `app-shell.tsx`.

**Phase 2 — app gating**
- `src/app/app/layout.tsx` + `app-chrome.tsx` + `app-gate.tsx`: dark theme, top-header 6-item nav, CSPR.click mount nodes, Explorer link in the header cluster, and a blur + connect overlay until a Casper wallet connects.

**Phase 4 — settings declutter + audit**
- `settings-screen.tsx` rewritten to 4 read-only tabs (Trust boundaries / Network & facilitator / Signing / Client access); provider-capability clutter removed.
- `audit-screen.tsx`: rows open a modal with the four-layer detail + a **cspr.live deploy link + "why it failed"** explanation (the one audit gap Abu flagged).

**Phase 5 — agent wallet UI**
- `wallets/page.tsx` → selection-first `WalletList`; dynamic `wallets/[id]/page.tsx` → `WalletDetail` with identity/readiness/policy, an **edit-policy modal**, a **PASS/BLOCK policy preview** (`src/lib/policy-preview.ts` + test), and a **kill switch**. Create via the connected CSPR.click wallet. Deleted old monolithic `wallet-screen.tsx`.

**Phase 6 — hosted-custody signing engine (core)**
- `src/server/wallet-key-crypto.ts` (+ test): AES-256-GCM, env master key `CASPER_GW_WALLET_ENCRYPTION_KEY`, single decrypt path, tamper-fails-closed (6 tests).
- `wallet_keys` table (separate from `agent_wallets`) + Drizzle migration `drizzle/0003_strange_selene.sql`.
- `wallet-key-store.ts` (encrypt-on-save / decrypt-in-memory) and `wallet-signer.ts` (`buildSignerForWallet`: hosted = own decrypted key, test-signer = env PEM).
- `x402-payment.ts`: exported `ClientCasperSigner` + `signerFromPem`; `createCasperPaymentPayload` accepts an optional per-wallet signer (backward compatible).
- `live-paid-call.ts`: replaced the single-PEM gate with a mode-aware invariant ("signer account hash must equal the selected wallet"), so hosted wallets sign with their own key and the proven test-signer path is preserved. Live-paid-call unit tests updated to the new signer path.
- `.env.example` + `guard-secrets.mjs` updated for the new encryption key; Google/Apple social-login providers removed from CSPR.click config.

## Live Testnet proofs (real deploy hashes)

Signer wallet `bcf0df…dc12`, funded; 20 WCSPR wrapped via `pnpm wrap:wcspr`
(tx [70acfefc…](https://testnet.cspr.live/transaction/70acfefc1a9b803ab0a2be03106172ce1655c1913488840e1b477b00580f99c9)).

- **Trigger 3 — autonomous agent + API key** (`pnpm smoke:server-signed`): a bearer-token-only
  call (no payment signature) → Gateway server-signs with the bound wallet → settled.
  Deploy [`ed099423…737df513`](https://testnet.cspr.live/deploy/ed099423396c78ca6c0c5c241f43bbbeb838622960f193ea106fe6b0737df513), receipt `settled`, HTTP 200.
- **Trigger 1 — pay with my agent wallet** (`pnpm smoke:agent-wallet`): operator-gated REST call,
  UI-selected wallet → Gateway server-signs → settled.
  Deploy [`bb0698b5…37037d0`](https://testnet.cspr.live/deploy/bb0698b557e924aab11f16988cc0b1f208a7c1a8fbacc018d6581a5f577037d0), receipt `settled`, HTTP 200.
- Both reuse `runHostedServerSignedToolCall` (policy-before-sign), proving the shared engine
  end-to-end on-chain. The policy-block (no signature, no x402 record) invariant is unit-covered
  in `hosted-server-signed-call.test.ts`; a live negative smoke is still TODO.
- **Trigger 2 — connect & sign** (browser CSPR.click) is unchanged from the prior Testnet-proven
  caller-signs path; generalizing it for pasted URLs is pending.

## Done since (Phase 7 core + Phase 9 docs)

- **Phase 7 core** — `signPaymentPayload` extracted; `POST /api/paid-calls/agent-wallet` (Trigger 1, operator-gated, reuses the server-signs engine) + 4 route tests; runner wired: **"Pay with my agent wallet"** (hosted tools) + **"Connect & sign (CSPR.click)"**, env-signer button removed. Live-proven (deploy `bb0698b5…`).
- **Phase 9 docs** — README rewritten to the verified behavior (three triggers + both deploy hashes + reproduce commands); this verification artifact.

## Also done

- **Phase 8 UI** — Provider → Endpoint now has a hosted-wallet selector that mints a **wallet-bound (autonomous, server-signed) agent token** (`createClientAccess(walletId)` → access-keys route). The autonomous path is usable end-to-end from the app.
- **Phase 3 (partial)** — landing `/` gained a "one signing engine, three triggers" band communicating the core model; v3 tokens already themed both public surfaces.

## Pending (polish + packaging)

- **Phase 7 polish** — approve&sign confirmation modal, hosted-provider dropdown loading state, raw-JSON advanced input, Trigger-2 generalization for pasted x402 URLs (off `config.mcpUrl`).
- **Phase 8 extra** — a live negative policy-block smoke (invariant is unit-covered in `hosted-server-signed-call.test.ts`).
- **Phase 3 rest** — explorer/landing pixel re-skin to prototype fidelity (benefits from a visual pass).
- **Phase 5 polish** — funding *stepper* drawer (faucet link + readiness refresh exist), generate-in-SDK hosted-wallet create, multi-tool allowlist.
- **Phase 9 rest** — update the stale Playwright suites to the new UI; `pnpm run ci` end-to-end; public repo push + demo video (Abu).

## Honesty boundaries held

- No "settled"/deploy hash is shown without a real deploy (receipt rendering inherits this from `buildReceiptDetail`).
- Hosted custody is labeled Testnet-only, "production custody not claimed"; keys are encrypted at rest and the decrypt path never logs/returns key material outside signing.
- No Mainnet, no registry, no `sk_live`-style prefixes; credential planes kept separate.
- Dead code removed (`gateway-app`, `app-shell`, old `wallet-screen`); a few now-unused legacy bits (`csprclick-provider-capabilities`, parts of `browser-signing-evidence`, the `external` signingMode) remain and are slated for the cleanup sweep.
