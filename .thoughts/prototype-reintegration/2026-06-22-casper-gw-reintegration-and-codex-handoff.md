# Prototype Reintegration + Codex Build Handoff: Casper GW

Date: 2026-06-22
Author: Claude Code
Supersedes (architecture/feasibility): the v1/v2 reintegration audits, which left the explorer data-path and facilitator as `BLOCKED`. **Those are now RESOLVED** (CSPR.cloud is the hosted indexer + facilitator — see §0 and §3).
Companion: design review at `.thoughts/design/2026-06-22-claude-code-design-review.md` (+ screenshots) and reference repos at `.thoughts/raw/repos/`.

---

## Verdict

**Planning is ALLOWED.** The prototype is accepted-with-fixes, the Casper integration reality is verified end-to-end, and there are **no research-unknown blockers** — only credential/decision items (API key, test-token package hash, wallet-signing choice) that Abu supplies. Build can begin on the smallest real loop immediately, with the focused designer corrections running in parallel.

---

## 0. Engineering Rules of Engagement — READ FIRST (Codex: this is non-negotiable)

These rules exist because the *reviewer* (me, Claude Code) violated them once in this very project. Do not repeat it.

### The rule

**Never write "blocked", "not possible", "unverified", or invent an implementation detail before you have checked the authoritative source.** "Blocked" is a strong word with one meaning here: *"I read the authoritative docs/source and the thing is genuinely unspecified, OR it needs a credential/decision only Abu can give."* It does **not** mean "I didn't look." The same applies to *how to implement* something: research how it is really done in the official docs and real code before writing code or claiming a constraint. **No hallucinated endpoints, fields, flows, SDK calls, or error codes.**

### My worked mistake (so Codex learns from it)

In the first pass of the design review I marked the public-explorer data path and the x402 facilitator as `BLOCKED` ("unverified whether a public indexer can be built without running a node"). That was wrong — not because the answer was hard, but because **I hadn't read the CSPR.cloud docs I already had access to.** The moment I fetched `docs.cspr.cloud`, the answer was immediate and documented: CSPR.cloud is a hosted indexer **and** hosts the x402 facilitator; no own node/indexer is needed. A whole "must-resolve-before-planning" blocker evaporated in two doc fetches. **Lesson: the gap was in my effort, not in reality. Check first, then conclude.**

### Authoritative sources, in order (check before claiming/inventing anything)

1. **Local context** — `.thoughts/` (this file, the spec, stories, research, design review).
2. **Cloned reference code** — `.thoughts/raw/repos/` (read the actual code, not READMEs): `casper-x402` (THE x402 ground truth), `cspr-trade-mcp` (the sample upstream), `x402scan` (explorer reference), `Cards402`/`clevercon` (funding + policy), `toll`, `x402-wallet-mcp`, `MCPay`; `docs-redux` (Casper docs).
3. **CSPR.cloud docs** — `https://docs.cspr.cloud/<path>.md?displayAgentInstructions=false` (markdown for agents). Installable skill: `https://cspr.cloud/skill.md`. This is the source of truth for all indexed-data + x402-facilitator endpoints, fields, filters, and error codes. **Preserve CSPR.cloud field names exactly; do not invent fields.**
4. **Casper protocol docs** — `docs-redux` (cloned) / `docs.casper.network` for accounts/keys, faucet, deploys, CEP-18, signing.
5. **Casper AI toolkit** — `https://www.casper.network/ai` (CSPR.click skill, Casper MCP server, casper-eip-712, Odra `llms.txt`).
6. **Context7** — for current library/SDK/CLI syntax only (`casper-js-sdk`, Next.js, etc.), never for product decisions.
7. **Targeted web** — only after 1–6 leave a specific named gap.

### Discipline checklist for every implementation task

- Read the relevant CSPR.cloud / Casper doc page (or reference repo file) before coding the integration. Cite it.
- Use documented request/response shapes verbatim. If a field/endpoint isn't in the docs, it doesn't exist — find the real one, don't invent it.
- **Proof honesty:** never render "Paid on Testnet" / a deploy hash / "settled" unless a real Casper Testnet deploy hash exists. Label all fixtures `design fixture`. Endpoint-live ≠ settlement-live.
- When genuinely stuck after checking 1–6, write down *exactly what you checked and what specific fact is missing*, then ask Abu — do not guess and do not silently stub.
- Keep the three credential planes and four receipt layers separate (see §3). Never leak provider upstream secrets to clients/receipts/explorer/logs.

---

## 1. Inputs Checked

- Design review `.thoughts/design/2026-06-22-claude-code-design-review.md` (screen-by-screen, classification, screenshots).
- Accepted product: spec `2026-06-18-agent-commerce-gateway.md`, stories, product-context/thesis wikis, designer brief.
- Reality research: `mcp-gateway-auth-reality`, `casper-x402-explorer-reality`, `casper-x402-onchain-identification`, x402 winner patterns.
- Code-read of 8 reference repos (`.thoughts/raw/repos/`).
- **Verified live (2026-06-22):** CSPR.cloud REST + Streaming + x402 facilitator docs; Casper AI toolkit; `make-software`/`casper-ecosystem`/`casper-network` GitHub orgs.

---

## 2. Architecture Overview (verified — this is how it's really done)

**Stack:** Next.js App Router (matches the existing `src/` skeleton and quality profile). Server-side API routes hold all secrets and all chain/facilitator calls; the browser never sees credentials or keys.

**The team builds only the gateway's own off-chain layer + the join/UI. It does NOT run a Casper node or build a chain indexer.** Everything chain-side is hosted by CSPR.cloud.

```
 Provider upstream API/MCP (e.g. cspr-trade-mcp)
        ▲  (server-side upstream creds)
        │
 ┌──────┴───────────────────────────────────────────────────┐
 │  CASPER GW (Next.js, server routes + datastore)           │
 │  • Gateway datastore (Postgres): gateway context,         │
 │    policy decisions, x402 verify/settle records, receipts │
 │  • Policy engine (fail-closed, pre-payment)               │
 │  • MCP client access auth (scoped bearer → OAuth 2.1)     │
 └───┬───────────────────────────┬───────────────────────────┘
     │ verify/settle             │ reads (proof, balances, actions)
     ▼                           ▼
 CSPR.cloud x402 facilitator   CSPR.cloud REST + Streaming (indexer)
 x402-facilitator.cspr.cloud   api.testnet.cspr.cloud / streaming...
 /supported /verify /settle    deploy · fungible-token-action ·
     │                          account · ft-ownership · transfer · rate
     ▼
 Casper Testnet (CEP-18 transfer_with_authorization; facilitator pays gas)
     │
     ▼  deploy hash  →  deep-link testnet.cspr.live/deploy/<hash>
```

**The real x402 paid-call loop** (from `casper-x402` code, verified):
1. Agent/console hits the resource → `402` with payment requirements (CAIP-2 network `casper:casper-test`, scheme `exact`, CEP-18 asset package hash, amount, payTo).
2. **Gateway policy pre-check (fail-closed) BEFORE signing.**
3. Payer signs an **off-chain EIP-712 `TransferWithAuthorization`** (CSPR.click `signTypedData` in browser, or a local signer; key never server-side).
4. Replay with `PAYMENT-SIGNATURE` header → facilitator `POST /verify` → `POST /settle`. **Both return HTTP 200 even on failure** — branch on body, not status. Facilitator submits the `TransactionV1`, **pays gas**, returns `{success, transaction(deploy hash), network, payer}` (or `{success:false, errorReason, errorMessage}`).
5. **Settlement is synchronous and can take many seconds and still fail post-signature** → show a "settling…" state, not instant green.
6. Persist the four receipt layers; resolve the deploy hash via CSPR.cloud `Get deploy` (status/block) and the CEP-18 `fungible-token-action`; deep-link `testnet.cspr.live`.

---

## 3. Integration Inventory (verified endpoints & shapes — do not invent)

| Concern | Real integration | Endpoint / shape | Class |
|---|---|---|---|
| On-chain proof (deploy by hash) | CSPR.cloud REST | `GET /rest-api/deploy` (get-deploy by hash) → `status` (processed/pending/expired), `error_message`, `block_hash/height`, `cost` | REAL_MVP |
| x402 settlement events | CSPR.cloud REST + stream | `GET /rest-api/fungible-token-action` (CEP-18 transfers); filter by **contract package** + **account**; fields `from/to/amount/contract_package_hash/deploy_hash/block_height` | REAL_MVP |
| Wallet funding readiness (CSPR gas) | CSPR.cloud REST | `GET /rest-api/account` → main-purse `balance` (motes), `main_purse_uref`, `public_key`, `account_hash` | REAL_MVP |
| Wallet payment-asset balance (CEP-18) | CSPR.cloud REST | fungible-token-ownership | REAL_MVP |
| Live explorer feed / funding-arrival | CSPR.cloud Streaming (WS) | `created` streams for deploys/transfers/token-actions; `emitted` contract events | REAL_MVP |
| USD-equivalent volume | CSPR.cloud REST | `GET /rest-api/cspr-rate` | REAL_LATER |
| x402 verify/settle | CSPR.cloud hosted facilitator | `x402-facilitator.cspr.cloud` `/supported` `/verify` `/settle` (or self-host `make-software/casper-x402`) | REAL_MVP |
| CEP-18 test token (the payment asset) | Casper Testnet | `casper-x402/.env.testnet`: `ASSET 'Wrapped CSPR'`, package `3d80df…847c1e`; or deploy own `Cep18X402.wasm` | REAL_MVP (needs decision) |
| Payment signing (EIP-712 auth) | CSPR.click / local signer | `casper-eip-712`; CSPR.click `signTypedData(params, publicKey)` (see `casper-x402/examples/csprclick-x402`) | REAL_MVP |
| Testnet faucet (CSPR gas) | testnet.cspr.live | `https://testnet.cspr.live/tools/faucet` — **once per account** (2nd request → `User error:1`) | REAL_MVP |
| Provider upstream (sample) | cspr-trade-mcp | real tools `get_quote(token_in,token_out,amount,type)`, paginated `get_pairs`, `get_pair_details/price_history`; `node.testnet.casper.network/rpc` | REAL_MVP |
| Chain SDK (balances/decoding) | `casper-ecosystem/casper-js-sdk`, `cep18` | `balance_of`/`allowance`/`transfer`; CEP-18 entry points | REAL_MVP |
| MCP client access auth | scoped bearer (MVP) → OAuth 2.1 | server-issued `cgw_test_…` token; OAuth 2.1 later | REAL_MVP / REAL_LATER |
| Auth key for CSPR.cloud + facilitator | Abu-provided | `CSPR_CLOUD_API_KEY` (register at cspr.cloud), env-only, fail-fast if missing | BLOCKED→Abu |

**Three credential planes (never collapse):** (1) provider upstream creds → server-side vault, never exposed; (2) MCP client access → scoped bearer/OAuth; (3) x402 wallet/payment → EIP-712 authorization. **Four receipt layers (separate sources):** gateway context (datastore) · policy decision (policy engine + `policy_decisions` table) · x402 verify/settle (facilitator responses) · Casper proof (CSPR.cloud deploy + CEP-18 action). The chain proves *payment only* — never claim it proves tool/resource/provider/policy.

---

## 4. Screen-to-Reality Matrix (condensed)

| Surface | Real data source / action | Class |
|---|---|---|
| Public landing + explorer table | gateway datastore (off-chain layers) joined to CSPR.cloud (deploy status + CEP-18 action) | REAL_MVP |
| Receipt detail (4 layers) | datastore (gateway/policy/x402) + CSPR.cloud proof; deep-link cspr.live | REAL_MVP |
| Explorer vitality stats strip | aggregate over receipts (+ cspr-rate for USD) | REAL_MVP (USD = LATER) |
| Sources (OpenAPI/Remote MCP/Manual) | upstream discovery; creds server-side; ≥1 path real, others modeled | REAL_MVP / REAL_LATER |
| My Tools (Draft/Priced/Published) | gateway datastore; per-tool x402 price (network/scheme/asset/payee/timeout) | REAL_MVP |
| Hosted Endpoint + client config | published MCP/x402 endpoint; scoped bearer; Cursor/Claude/curl config | REAL_MVP |
| **Wallets & Policies — funding journey** | **connect/provision → faucet (CSPR gas) + CEP-18 fund → poll CSPR.cloud balance → Ready (gas+asset+allowance)**; spend policy fail-closed | **REAL_MVP (currently the main gap)** |
| Paid Tool Test Console | endpoint-first discovery → 402 reqs → schema inputs → policy pre-check → sign → facilitator verify/settle → receipt; "settling…" state | REAL_MVP |
| Settings (creds/facilitator/network/signing) | facilitator `/supported`; masked creds; signing-mode honesty | REAL_MVP |
| Audit log | append-only events from datastore | REAL_MVP |
| Mainnet | gated/disabled | OUT_OF_SCOPE (later) |
| Console scenario toggles / run fixtures | demo-only, labeled | SIMULATED_DEMO_ONLY |
| Signed Offer/Receipt artifact | GW value-add over on-chain proof | REAL_LATER |

---

## 5. Mocked Surface Register / No-Shipping-Mock Decisions

- Wallet funded-state with no journey → **REAL_MVP** funding flow (faucet + CSPR.cloud balance poll). Must not ship as a static "funded" pill.
- Console "Run paid call → Paid on Testnet + deploy hash" → **REAL_MVP** via facilitator settle; until then label `design fixture`. Never show a fake hash.
- Scenario toggles (Pays/Block/Fail) → **SIMULATED_DEMO_ONLY**, keep the "not a product control" label.
- Sample tool schemas (`get_cspr_quote(pair,side)` etc.) → replace with **real** `cspr-trade-mcp` schemas (`get_quote(token_in,token_out,amount,type)`, `get_pairs`).
- `registryTools` internal var → rename to `discoveredTools`/`endpointTools`.

---

## 6. Spec / Story / Quality Deltas

1. Spec RQ-02A mode-rail (`Simulated/Local/Live`) → replace with Testnet-first/Mainnet-gated + honesty labels (matches shipped prototype).
2. Add a **Wallet Funding & Readiness** requirement (faucet once-per-account; CSPR-gas + CEP-18 dual balance; CSPR.cloud-derived readiness; allowance/approve step; refund state).
3. Delete registry/private-tools semantics from spec/stories (registry = optional later discovery only; MCPay code confirms registry ≠ source of truth).
4. Add a **CSPR.cloud data layer** requirement (all chain reads via CSPR.cloud REST/Streaming; facilitator via `x402-facilitator.cspr.cloud`; no own node/indexer).
5. Quality/designer-brief (see `.thoughts/design/2026-06-22-design-direction-and-structure.md`): the authenticated app uses a **top-header nav (not a sidebar)**, with dense config in **modals/tabs/drawers** (wallet+funding+policy modal, source-add wizard, per-tool pricing drawer, tabbed settings) — matches v1 pre-audit + MCPay/TollPay. Plus wallet-readiness journey, explorer vitality strip, per-result fixture labels. NOTE: visual *design is not yet approved*; the architecture (§2–§4) is independent of the final layout and can proceed regardless.

---

## 7. Phased Build Plan (each phase ends with a real verification gate)

- **Phase 0 — Plumbing spike (prove the loop once).** CSPR.cloud client (get-deploy, account, fungible-token-action) + facilitator client (`/supported`,`/verify`,`/settle`) + datastore schema (4 receipt layers). Wrap one real upstream tool (`cspr-trade-mcp get_quote`), make ONE real Testnet paid call, persist a receipt, resolve its deploy hash via CSPR.cloud. **Gate: a real Testnet deploy hash visible on testnet.cspr.live.**
- **Phase 1 — Provider gateway.** Source import (OpenAPI + Remote MCP), upstream creds server-side/masked, tool discovery, per-tool x402 pricing, publish hosted MCP/x402 endpoint + scoped bearer + client config. **Gate: a client (curl/Cursor) hits the endpoint and gets a 402 with correct requirements.**
- **Phase 2 — Agent wallet control plane + FUNDING (the gap).** Connect/provision wallet, show address, faucet (CSPR gas) + CEP-18 fund, poll CSPR.cloud balance → readiness states, spend policy (fail-closed, `policy_decisions` audit, Cards402 schema). **Gate: an unfunded→funded→ready transition driven by real on-chain balance, and a policy block with no deploy.**
- **Phase 3 — Paid Tool Test Console.** Endpoint-first discovery (hosted + paste URL), schema inputs, policy pre-check, sign (CSPR.click/local), facilitator settle, "settling…" state, receipt. **Gate: end-to-end paid call + policy-block + payment-fail each route to a correct receipt.**
- **Phase 4 — Public explorer + receipt detail.** Join datastore + CSPR.cloud proof; search/filters; vitality stats; deep-link cspr.live; redaction. **Gate: a public, no-auth receipt detail with a real deploy-hash linkout.**
- **Phase 5 — Settings/Audit + density/polish + designer corrections.**

---

## 8. Blockers & Open Questions (narrow — credential/decision, not research)

1. **`CSPR_CLOUD_API_KEY`** — register at `cspr.cloud`; needed for REST/Streaming/facilitator. (Abu.) Env-only, fail-fast if missing.
2. **CEP-18 test-token decision** — reuse `casper-x402` Testnet `Wrapped CSPR` (`3d80df…847c1e`) or deploy own `Cep18X402`. (Abu/team decision — both documented.)
3. **Wallet signing mode for MVP** — CSPR.click connect (recommended; verified `signTypedData` path) vs generated/hosted test signer (labeled non-production). (Abu decision; both real.)
4. **Hosted vs self-host facilitator** — default to CSPR.cloud hosted (`x402-facilitator.cspr.cloud`); self-host `casper-x402` only if needed. (Default chosen; confirm.)
5. Signed receipt artifact — REAL_LATER (optional). Not a blocker.

None of these require research to *understand*; they require a key or a choice.

---

## 9. Planning Gate Decision

**PROCEED.** Build the Phase-0 spike now (real loop) while the designer runs the §14 corrections in parallel. The only things that gate a *real* demo are the API key + token decision (§8.1–8.2), which are Abu actions, not unknowns.

---

## 10. Codex Kickoff Prompt (paste-ready)

> You are implementing Casper GW (Casper Agent Commerce Gateway) in this repo. Read, in order: `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md` (this file — **§0 Rules of Engagement is mandatory**), the design review `.thoughts/design/2026-06-22-claude-code-design-review.md`, the spec/stories in `.thoughts/specs` and `.thoughts/stories`, and the reference code in `.thoughts/raw/repos/` (read the actual code).
>
> Hard rules: (1) **Never claim "blocked"/"unverified"/"not possible" or invent an endpoint, field, flow, or SDK call without first reading the authoritative source** — local `.thoughts/` → cloned repos → CSPR.cloud docs (`https://docs.cspr.cloud/<path>.md?displayAgentInstructions=false`) → Casper docs → `casper.network/ai` → Context7. "Blocked" only means you checked the docs and it genuinely needs an Abu credential/decision. No hallucination. (2) All chain reads go through **CSPR.cloud REST/Streaming** and settlement through the **hosted x402 facilitator** (`x402-facilitator.cspr.cloud`) — do **not** run a node or build an indexer. (3) Keep the three credential planes and four receipt layers separate. (4) Proof honesty: never show a deploy hash / "Paid on Testnet" without a real Testnet settlement; label fixtures. (5) Preserve CSPR.cloud field names exactly.
>
> Start with **Phase 0** (§7): build the CSPR.cloud + facilitator clients and the receipt datastore, wrap `cspr-trade-mcp get_quote`, and make ONE real Testnet paid call that produces a receipt with a deploy hash resolvable on `testnet.cspr.live`. Stop at the Phase-0 gate and report the deploy hash. If `CSPR_CLOUD_API_KEY` or the CEP-18 token package is missing, say exactly what you checked and ask — do not stub silently.

---

## 11. Evidence

CSPR.cloud docs (REST reference, deploy, fungible-token-action, account, x402-facilitator, streaming) fetched 2026-06-22; `casper.network/ai`; `make-software` org (`casper-x402`, `cspr-trade-mcp`, `casper-wallet`, `cspr-design`); `casper-ecosystem` (`casper-js-sdk`, `cep18`, `casper-eip-712`); cloned repo code-read in `.thoughts/raw/repos/`; design review + screenshots. Casper funding/faucet/signing facts from `docs-redux`.
