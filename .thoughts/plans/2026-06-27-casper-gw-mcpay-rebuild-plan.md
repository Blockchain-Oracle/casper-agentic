# Casper GW — MCPay-on-Casper Rebuild Plan

Date: 2026-06-27
Status: **PROPOSED — awaiting Abu's approval. No code until approved.**
Supersedes the agent-wallet/three-trigger model in `.thoughts/.../2026-06-26-casper-gw-v3-reskin-and-three-signing-modes.md`.

Grounded in: research workflow `wf_3406ebbb-90c` (explorer / deletion / tooling / design / critic streams), MCPay + Cronos402 + x402scan reference study, Casper brand research, and first-hand reading of the real settlement engine (`live-paid-call.ts`, `x402-payment.ts`, `wallet-signer.ts`, `db/schema.ts`).

---

## 0. North star (what we are actually building)

**Casper GW = MCPay, on Casper, with real x402 settlement.** Abu's own words: "our project is not any different from MCPay; I'm the one that complicated it."

A provider registers an MCP/API source → prices its tools → publishes a paid endpoint. A caller pays per tool call via an **API key**; the **gateway signs the x402 payment with its own funded Testnet wallet** and settles on Casper, producing a **real deploy hash**. A public **explorer** shows each paid call as `tool · amount · deploy-hash → cspr.live`. That's the whole product. Everything else is bloat.

Identity: **"Proof-Print"** — a precision instrument console (dark) and a receipt-paper public surface (light), one pop of **Casper Red `#FF473E`**, and a **proof stamp** that prints the deploy hash when a call settles.

---

## 1. The real engine we KEEP (it works — confirmed by reading code)

The proven settle chain (`runLivePaidToolCall`, `live-paid-call.ts`):

1. Facilitator advertises `casper-test` `exact` support (precondition, `live-paid-call.ts:33`).
2. Build x402 payment payload — `createCasperPaymentPayload(config, url, signer)` → `@make-software/casper-x402` `ExactCasperScheme` + `@x402/fetch` `x402Client` (`x402-payment.ts:36-63`).
3. `facilitator.verify(...)` → `facilitator.settle(...)` → **`settleResponse.transaction` = the real Casper deploy hash** (`live-paid-call.ts:115-152`).
4. `resolveCasperProof(...)` indexes the deploy via CSPR.cloud → FT action proof.
5. Persist attempt + x402 record + Casper proof.

**Key finding — the signer needs no custody.** `createSigner(config)` / `signerFromPem(readSignerPem(config), algo)` (`x402-payment.ts:78-98`) builds a working signer **straight from the env PEM** (`CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM_PATH`). `createCasperPaymentPayload` already defaults to it. So the gateway can settle as a single managed wallet with **zero** `agentWallets`/`walletKeys`/`spendPolicies`.

**Keep these modules** (the engine): `x402-payment.ts`, `x402-facilitator.ts`, `casper-proof.ts`, `casper-account.ts`, `cspr-cloud.ts`, `cspr-cloud-streaming.ts`, `mcp-client.ts`, `mcp-json-rpc.ts`, `provider-store.ts`, `provider-model.ts`, `hosted-endpoint.ts` / `hosted-discovery.ts` / `hosted-mcp-dispatch.ts` (publish-an-endpoint path), `endpoint-access.ts` (API keys), `receipt-store.ts` + `receipt-history.ts` (refactored, §3), `explorer-search.ts` + external-feed modules (explorer), `env.ts`, `wcspr-wrap.ts` (funding).

**Keep these tables:** `provider_sources`, `provider_tools`, `tool_prices`, `endpoint_access_keys` (drop its `walletId` FK), `paid_call_attempts`, `x402_records`, `casper_proofs`, `external_action_feed_*`.

---

## 2. The bloat we REMOVE (corrected — safe, not self-breaking)

The critic caught that a naive "delete custody first" breaks the build (kept files import the deleted signer/tables). So the order is **refactor-then-delete** (§6). What goes:

| Remove | Files | Why |
|---|---|---|
| Operator-token paste-gate | `operator-access.ts` usage in routes; `import-screen.tsx` token field | The "access token required" pain. Replaced by: it's your gateway (no gate on `/app`) + API keys for callers. |
| Agent-wallet custody | `wallet-store.ts`, `wallet-key-store.ts`, `wallet-key-crypto.ts`, `wallet-signer.ts`, `wallet-readiness.ts`, `wallet-signing-readiness.ts`, `/app/app/wallets/**`, `wallet/**` components, `use-wallet-control.ts`, `wallet-*-model/view.ts`, `/api/wallets/**` | Abu: remove the wallet complexity. Engine signs from the env gateway wallet instead. |
| Spend policy | `spend-policy-store.ts`, `*-paid-call-policy.ts`, `policy.ts`, `policy-preview.ts`, policy UI | Abu: "the policy thing is a pain, remove it." Replaced by a thin **funding-readiness guard** (§4). |
| Audit page | `/app/app/audit/page.tsx`, `audit-screen.tsx` | Abu: nobody wants an audit ID. The public explorer IS the trail. |
| Settings page | `/app/app/settings/page.tsx`, `settings-screen.tsx` | Empty/static. Network label + API keys live in a small account menu. |
| Browser-signed agent-wallet path | `/api/paid-calls/agent-wallet`, `hosted-server-signed-call.ts`, `hosted-paid-call*.ts` (custody variants) | Custody-coupled; not the demo path. |
| Fixtures-as-product | `lib/fixtures.ts` fallbacks in `receipt-store`/`audit`/`dashboard` | Kills "sample fixture" data. Real DB only. |

**Drop tables (after refactor):** `agent_wallets`, `wallet_keys`, `spend_policies`, `policy_decisions`, `audit_events`. Generate a Drizzle migration; remove the `endpoint_access_keys.walletId` FK + `agentWallets` import.

**Browser "connect wallet & pay": DEFER (be honest).** CSPR.click providers reject Casper x402 typed-data (`SIGNATURE_SCHEME_NOT_SUPPORTED`, Phase 24O) — it does **not** settle today. We lead with the API-key path that really settles, and mark wallet-connect as not-yet-available rather than faking it.

---

## 3. Receipt simplification (3 layers, all real)

Today's receipt has 4 layers; layer 2 (policy decision) and the audit timeline read from `policy_decisions`/`audit_events`, which we're dropping. So before dropping, refactor `receipt-store.ts` + receipt-detail builders to **3 real layers**:

1. **Gateway** — tool, provider, amount, client (from `paid_call_attempts`).
2. **x402 verify/settle** — facilitator verify + settle response (from `x402_records`).
3. **Casper proof** — deploy hash, FT action, `cspr.live` link (from `casper_proofs`).

No fabricated/empty layer (the mock behavior Abu rejects). The proof-stamp (§5) is the visual terminus of layer 3.

---

## 4. The API-key payment model (real, proven, honest)

`endpoint_access_keys` already exists — it **is** the API-key table (hashed token, scoped to a source, label, revoked flag). MCPay's managed model, half-built.

**Flow:** caller presents `casper_…` key → gateway authorizes (hash match, not revoked) → runs the settle chain (§1) signing with **its own env Testnet wallet** → real deploy → receipt → key holder gets the result.

**Honesty framing (AGENTS.md):** the key authorizes a *caller*; it does **not** give the caller custody. The gateway pays from one funded **Testnet** wallet (managed, not per-user). We label it exactly that — "Gateway settlement wallet (Testnet)" — never "your wallet," never a production-custody claim. This is the same posture as MCPay's managed wallet.

**Funding & readiness (the one real gap, now owned):** the gateway wallet needs **CSPR** (gas) + **WCSPR** (payment asset; wrap via `pnpm wrap:wcspr`). A small **readiness check** (reuse the CSPR.cloud balance reads already in `live-paid-call.ts:93-104`) gates the run button and shows a one-line "Gateway wallet: funded / low" status. env required: `CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM_PATH`, `CASPER_PAYEE_ACCOUNT_HASH`, `CSPR_CLOUD_API_KEY`, `CSPR_X402_FACILITATOR_URL`.

---

## 5. Design system — "Proof-Print" (corrected to repo truth)

Full token/type/component/animation spec in the design research bundle. Corrections the critic forced:

- **Dark variant = `[data-theme=dark]`**, NOT `.dark` (next-themes uses `attribute="data-theme"` here). Tailwind v4: `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`.
- **`tw-animate-css`**, NOT the deprecated `tailwindcss-animate`.
- **One red, `#FF473E`, reserved** — only the proof stamp, the single primary CTA per screen, and "settled" emphasis. Delete the load-bearing blue (`--x402 #5b8def`, `--primary`) from `receipt.css`/`explorer.css`/`base.css`; recode the proof layers as a graphite→red ink ramp (no rainbow, no blue → not MCPay/x402.org).
- **Failures = ink + ochre `#C0871F/#E2A93C` ("VOID/DECLINED")**, never red. Protects red = positive proof. Status always carries a text label; greens/ochre WCAG-checked on both poles.
- **Focus ring ≠ CTA fill** — a red ring on a red button is invisible; focus uses a distinct (offset/ink) treatment.
- Surfaces map to the one global toggle: **light = bone receipt-paper** (native to public `/explorer`+`/receipt`), **dark = carbon console** (native to `/app`); both render in both poles.
- Type: **Space Grotesk** (display) · **Inter** (UI, tabular figures for amounts) · **JetBrains Mono** (hashes/addresses/x402 headers — the "proof voice").
- Signature **proof stamp**: red halftone seal carrying the deploy hash, stamps on settle (<700ms press animation, reduced-motion = fade+hash reveal); repeats as favicon, the global loader (replaces spinners), explorer row marker, and receipt timeline terminus.

Stack add (Context7-verified current): **Tailwind v4 (CSS-first, `@tailwindcss/postcss`, no `tailwind.config.js`)** + **shadcn (`shadcn@latest`, not deprecated `shadcn-ui`; not canary)** + **lucide-react** + **sonner** + **motion** (`motion/react`, not `framer-motion`). Migration guard: control import order / `@layer base` so Tailwind Preflight doesn't wipe existing CSS; migrate per-surface, never build while `dev` runs (stale `.next`).

---

## 6. New information architecture — NO `/app`, fully public (MCPay-proven)

Deep-dive of MCPay confirmed: **MCPay has zero authenticated pages.** Every route is public; sign-in, tool-testing, and API-key management are all **modals**. No `/app`, no runner page, no audit, no settings, no wallets page. Casper GW adopts the same model — this deletes the entire `/app` shell and the runner/audit/settings routes outright.

```
EVERY ROUTE PUBLIC (no auth wall anywhere):
  /                landing — intro + featured tools + CTA
  /explorer        x402 settlement ledger: tool · amount · deploy-hash → cspr.live
  /tools           catalogue of all registered x402 tools (browse everything)
  /tools/[id]      tool detail — pricing, docs, RECENT RECEIPTS, and an inline
                   "Run / Pay" MODAL (this replaces the whole /app/runner page)
  /receipt/[id]    public proof sheet (3-layer + proof stamp) → cspr.live
  /register        paste MCP/API URL → discover tools → price → publish
```

Nav (top, no sidebar): `Explorer · Tools · Register` + theme toggle + an account/keys button.

**Modals replace pages:**
- **Run/Pay a tool** → modal on `/tools/[id]` (was `/app/runner`).
- **API keys** (create / copy / revoke) → modal tab (was `/app/settings`).
- **Gateway wallet status** (funded/low, Testnet) → a small read-only chip/modal, not a managed-wallet page (was `/app/wallets`).

**Auth:** for the demo this is **Abu's single gateway**, so there is no login wall at all — the API key itself is the spend boundary for paid calls, and Register / key-creation are open operator surfaces. (Multi-tenant sign-in-via-modal, MCPay-style, is a clean later add if ever needed — see §8.) No `better-auth`, no Google/Apple, no operator-token gate.

This removes, beyond §2: the entire `/app/**` tree, `app-chrome` sidebar, `workspace-provider` wallet wiring, and `/app/runner` (`test-console-*`) as a page — the test console becomes the `/tools/[id]` run modal.

---

## 7. Phased build order (each phase keeps typecheck/build green + is verifiable)

**P1 — Design foundation.** Add Tailwind v4 + shadcn + fonts + Proof-Print tokens (`data-theme`, `tw-animate-css`, `#FF473E`, no blue). New top-nav shell. Remove operator-token gate from `/app`. *Verify:* build green, both themes render, no blue remains.

**P2 — Refactor receipts to 3 layers.** Rewrite `receipt-store.ts` + receipt-detail to stop reading/writing `policy_decisions`/`audit_events`; kill fixture fallbacks. *Verify:* receipts render real 3-layer detail from DB; typecheck green.

**P3 — Gateway-signer settle path.** New thin settle entrypoint using `createSigner(config)` (env wallet), funding-readiness guard, no wallet/policy. Re-point `/api/paid-calls/run` (drop operator gate; later gate by API key). *Verify:* a real paid call lands a **real Casper deploy hash** end-to-end (the proof that it's not mocked).

**P4 — Register + source-detail + inline test console.** MCPay register flow (paste URL → discover → price → publish) on real `provider_*` tables; one-page source detail with inline schema-driven test console that runs P3. *Verify:* register a source, run a tool, see the receipt.

**P5 — API keys.** Wire `endpoint_access_keys` create/list/revoke UI (account modal) + key-auth on the run route. *Verify:* a `casper_…` key authorizes a real settling call.

**P6 — Explorer + receipt reskin.** Minimal `tool · amount · hash` table + proof-stamp + receipt-paper surface; real data; `cspr.live` link-out; keep a simple hash/account search. *Verify:* public, no-auth, real rows, shareable receipt URLs.

**P7 — Delete + clean.** Now-unused custody/policy/audit/settings files removed; drop the 5 tables via migration; dead-code sweep; `pnpm verify`. *Verify:* `guard:files`, typecheck, lint, build all green; grep shows no dangling imports.

**P8 — Audit & vision pass.** Anti-slop vision review + end-to-end real-call validation with Abu.

---

## 8. Open decisions for Abu (small, real)

1. **Sign-in / tenancy:** no login wall at all (recommended — it's your gateway; API key is the spend boundary), or add MCPay-style modal sign-in now for multi-tenant register/keys?
2. **Explorer shape:** ONE unified `/explorer` with `Tools | Payments` tabs (recommended — "an explorer that shows all the tools AND points to cspr.live", matches Abu's words, fewest surfaces), or separate `/tools` catalogue + `/explorer` ledger like MCPay?
3. **Browser "connect wallet & pay":** defer entirely (recommended — can't settle on Casper yet), or keep a labeled "experimental" stub?
4. **Explorer external feed:** strip to only Casper GW receipts for now (recommended), or keep the CSPR.cloud WCSPR token-action search as a secondary view?
5. **Default theme:** dark console or light receipt-paper for first-time visitors (toggle always wins after)?

---

## 9. Honesty ledger (what is real vs not, stated plainly)

- **Real:** x402 verify/settle on Casper Testnet via CSPR.cloud facilitator; real deploy hashes; real CSPR.cloud proof indexing; real provider/tool/price/key tables; real MCP discovery.
- **Managed, not custody:** the gateway signs from one funded Testnet env wallet. Labeled as such. Not production custody.
- **Deferred:** browser/CSPR.click signing (blocked upstream); per-user wallets; spend policy (shelved, not deleted from git).
- **No mocks ship** in product surfaces. Fixtures removed.
