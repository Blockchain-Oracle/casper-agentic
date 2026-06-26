# Prototype Reintegration: Casper GW v3 UI + Three Signing Modes (2026-06-26)

## Verdict

**Planning is ALLOWED for the full scope.** This is unusual for a high-fidelity prototype: the backend is **already real and Testnet-proven** for almost every surface the prototype "mocks," so reintegration is mostly *wire the clean new UI to existing real APIs* + a focused set of net-new pieces. No required product behavior is left as an unlabeled shipping mock. Two items are tracked explicitly: (1) **browser-approved settlement proof** is a verification milestone gated on a typed-data-capable CSPR.click provider (not a planning blocker), and (2) the **hosted-mode custody model** is a `REAL_MVP` decision deferred to the plan (Abu: "decide during planning").

## Inputs Checked

- Prototype discovery: `.thoughts/prototype-discovery/2026-06-26-casper-gw-designer-prototype-v3.md` (14 tiles, mock ledger, per-directive reconciliation, "backend-already-real" map).
- Signing research: `.thoughts/research/2026-06-26-casper-gw-signing-modes-deep-research.md` + `2026-06-25-casper-gw-signing-modes-reality.md`.
- Spec/stories: `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`, `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`.
- Current repo: `src/server/**`, `src/components/**`, `src/app/**`, `src/db/schema.ts`, `.env.example`; README phase log (0–24S).
- Abu decisions (2026-06-26): build **all three** signing modes; hosted custody **decided in planning**; deadline is **not** a constraint; the 10 declutter/IA directives ([[casper-gw-prototype-v3-directives]]); no mock/placeholder behavior or docs.

## Screen-to-Reality Matrix

| Surface (prototype tile) | Data shown | Real source (exists today?) | Real action / side effect | Label |
|---|---|---|---|---|
| 01 Public landing `/` | hero, latest-proof card, activity stats (1,284 etc.) | receipts DB aggregates (`api/receipts`); proof from real deploys | read-only; CTAs to `/explorer` + connect | **REAL_MVP** (stats from DB; until aggregates wired, keep `SAMPLE·FIXTURE` label) |
| 02 Public explorer `/explorer` | local 4-layer receipts + external WCSPR feed | `api/explorer/search`, `api/explorer/actions`, `api/receipts` — **all real** (phases 4,5,8–15) | search/paginate; no auth | **REAL_MVP** (re-skin existing real explorer to light/dual-feed) |
| 03 Receipt detail `/receipt/:id` | four layers, deploy hash, cspr.live link | `api/receipts/[id]` + `lib/receipt-detail.ts` — **real** | open raw proof on testnet.cspr.live | **REAL_MVP** (new public route; reuse existing rendering) |
| 04 App gate `/app` | connect CTA + connection-state machine + mismatch | CSPR.click runtime (`csprclick-browser.ts`) — connect is real (24F–S) | `signIn()`; unlock workspace on connect | **REAL_MVP** (blur+overlay is net-new UI over real connection state) |
| 05 Dashboard | gateway-loop, readiness/spend stats, recent receipts | wallet readiness (`api/wallets/[id]/readiness`), receipts, policy — **real** | read-only + quick actions | **REAL_MVP** |
| 06 Provider · sources + add-source wizard | sources, discovered tools | `api/provider/sources`, `.../discover` — **real** (phase 1) | connect source, discover tools | **REAL_MVP** (modal-wizard UI over real discovery) |
| 07 Provider · my tools + price/publish drawer | tools, x402 pricing | `api/provider/tools/[id]/price`,`/publish` — **real** | price + publish | **REAL_MVP** |
| 08 Provider · hosted endpoint + client access | endpoint URL, scoped token, config snippet, 3 boundaries | `api/mcp/[sourceId]` + access-keys — **real** (phases 6,7,12,14) | generate/revoke client token | **REAL_MVP** |
| 09 Wallet & policy tabbed modal | profile/readiness/policy, preview, kill switch | `api/wallets`, `.../readiness`, `.../policy` — **real** (phase 2); preview/kill-switch UI net-new | edit policy, set spend, name wallet | **REAL_MVP** (policy preview computed from real policy; kill switch = disable flag) |
| 10 Funding stepper drawer | receive address, 2 tracks, faucet | readiness balances real; Testnet faucet external | copy address, recheck balances | **REAL_MVP** (evidence-based readiness; faucet is external link) |
| 11 Paid tool runner | source dropdown, schema inputs, paid-call timeline | discovery + paid-call backend — **real**; dropdown-loading + sign-modal net-new UI | run paid call (3 modes) | **REAL_MVP** (see signing matrix below) |
| 12 Settings (tabbed) | trust boundaries, network, signing, client access | config + readiness — **real**; remove connector-probe clutter | read-only informational | **REAL_MVP** |
| 13 Audit | distinct-state event table + cspr.live link + failure modal | receipts/audit events — **real**; row→cspr.live modal net-new | open deploy detail / failure reason | **REAL_MVP** |

## Integration Inventory

| Integration | Status today | Reintegration decision |
|---|---|---|
| CSPR.cloud REST/Streaming (balances, accounts, token actions) | **Real** (phases 2,4,5,9–15) | `REAL_MVP` |
| CSPR.cloud x402 facilitator `/verify`,`/settle`,`/supported` | **Real & proven** (deploys exist) | `REAL_MVP` |
| Casper proof / deploy hashes | **Real** (5566d6…, 8ed456…, a27e51…) | `REAL_MVP` |
| Receipts + audit (Postgres/Drizzle, four layers) | **Real** | `REAL_MVP` |
| MCP/tool discovery + schema | **Real** (phase 1) | `REAL_MVP` |
| Spend-policy evaluation (fail-closed, before signing) | **Real** (phase 2) | `REAL_MVP` |
| Provider upstream creds / scoped client tokens (server-side) | **Real**, separated | `REAL_MVP` |
| **Signing — local/CLI (`test-signer`)** | **Real & proven**, gated to one PEM | `REAL_MVP` (generalize + new CLI/MCP surface) |
| **Signing — browser-approved (`browser-wallet`)** | Coded, **proof blocked** on provider typed-data | `REAL_MVP` (proof = verification milestone) |
| **Signing — hosted pre-approved (`external`)** | **Not built**; custody undecided | `REAL_MVP` (custody decided in plan; Testnet-only) |
| Casper account-abstraction / allowance-based pre-approval | Not shipped (roadmap) / not settleable by facilitator | `OUT_OF_SCOPE` |
| Public registry / catalog | Deferred ("after core loop") | `OUT_OF_SCOPE` |
| Mainnet · production custody | — | `OUT_OF_SCOPE` |

### Signing-mode reintegration (the three modes share ONE backend)

All three produce the identical `{signature(65B), publicKey, authorization{from,to,value,validAfter,validBefore,nonce}}` and settle through the same CSPR.cloud facilitator. Reintegration differs only by **key source + approval**:

| Mode | Real integration path | No-mock label | Honesty boundary |
|---|---|---|---|
| **Browser-approved** | Existing intent→`signTypedData`→verify/settle/proof flow; requires a CSPR.click provider/account advertising `sign-typed-data-eip712` | `REAL_MVP` | Until a real browser deploy hash exists, UI must NOT claim browser-approved settlement; fail-closed on incompatible providers (already implemented) |
| **Local / CLI** | `casper-x402` `ExactCasperScheme` + a local key (PEM/in-SDK generated); new CLI/MCP wallet surface; client-side spend caps before signing | `REAL_MVP` | Dedicated small Testnet wallet; key custody local; no production-custody claim |
| **Hosted pre-approved** | Server-invokable signer (custody model TBD in plan) signing each fresh authorization under off-chain spend policy | `REAL_MVP` | Testnet-only; `productionCustody = not_claimed`; spend policy enforced before each auto-sign; clearly labeled |

## Mocked Prototype Surface Register

The prototype's appendix lists 9 "mocked" surfaces. Reintegration classification:

| Prototype mock | Reality | Label |
|---|---|---|
| CSPR.click connection & session | connect real; browser **settlement** unproven | `REAL_MVP` (settlement = verify milestone) |
| Wallet balances & readiness | real (CSPR.cloud) | `REAL_MVP` |
| Spend-policy evaluation | real, fail-closed | `REAL_MVP` |
| MCP/tool discovery & schema | real | `REAL_MVP` |
| x402 verify/settle | real & proven | `REAL_MVP` |
| Casper proof & deploy hashes | real & proven | `REAL_MVP` |
| Receipts & audit storage | real (DB) | `REAL_MVP` |
| External WCSPR feed | real | `REAL_MVP` |
| Provider creds & client tokens (`sample_` prefix) | real, server-side | `REAL_MVP` (fixtures stay clearly labeled; never `sk_live`-style) |
| Landing activity stat numbers (1,284 etc.) | DB aggregates available | `REAL_MVP` or `SIMULATED_DEMO_ONLY` (labeled `SAMPLE·FIXTURE`) until wired |
| Runner "Scenario" demo toggle + estimated-charge | demo scaffolding | `SIMULATED_DEMO_ONLY` (drop or clearly label; no proof depends on it) |

## No-Shipping-Mock Decisions

- **Nothing on the judged proof path ships as a mock.** Receipts, policy, x402 verify/settle, Casper proof, explorer feeds, discovery = `REAL_MVP` (already real).
- **Browser-approved settlement must be honest:** no "settled"/deploy-hash/"Paid on Testnet" for the browser path until a real browser-originated deploy exists. Fail-closed behavior stays.
- **Hosted mode is real but Testnet-only**, `productionCustody = not_claimed`, custody model chosen in the plan; spend policy off-chain before each auto-sign.
- **Sample landing stats** must be either real DB aggregates or visibly `SAMPLE·FIXTURE` — never presented as live proof.
- **Demo-only Scenario toggle**: `SIMULATED_DEMO_ONLY` and labeled, or dropped.
- **No registry, no Mainnet, no production custody, no `sk_live` prefixes** (AGENTS.md).

## Spec Deltas

(Carried from discovery; to apply on plan acceptance.) Add: public `/` landing + `/receipt/:id`; app-gating (blur+overlay, connection-state machine, account mismatch); two-theme + typography invariants; Audit as own surface with cspr.live link + failure modal; Settings as read-only tabbed (remove connector probe); Wallets selection-first + dynamic `[id]` + funding stepper + policy preview + kill switch + create-agent-wallet; Runner source dropdown(loading)+dynamic inputs+Approve&sign modal+raw-JSON advanced; **three signing modes as explicit spec with the fresh-signature-per-call + no-pre-approved-Casper-session constraint and hosted Testnet-only/no-production-custody boundary**.

## Story Deltas

Carried from discovery (public receipt verify; wallet-gated entry; wallet detail page; audit cspr.live modal; runner dropdown+modal; settings read-only tabbed) **plus**: "As an operator I choose a signing mode (browser / local-CLI / hosted) per wallet"; "As an agent I pay x402 via a local CLI/MCP wallet under spend caps"; "As an operator I authorize a hosted agent wallet that signs under my spend policy on Testnet (no production custody claim)."

## Quality Profile Deltas

Browser-check coverage for: app gate (blurred/connected/mismatch), wallet `[id]` + funding stepper, runner dropdown-loading + approve&sign modal, audit cspr.live + failure modal, light/dark parity, mobile bottom bar. Signing-mode tests: local-CLI per-call cap enforcement; hosted policy-before-auto-sign; browser fail-closed on incompatible provider. Keep 200/300 source guard; new modals/drawers/pages as small components.

## Plan Prerequisites

- **Credentials/funding (Abu-provided, when each phase needs them):** `CSPR_CLOUD_API_KEY`; a CSPR.click provider/account that advertises `sign-typed-data-eip712` (for browser proof); a funded Testnet wallet per mode; CEP-18/WCSPR package + payee (already configured).
- **Decision in plan:** hosted custody model (server-held encrypted key vs account associated sub-key vs other), spend-policy schema for autonomous signing, and the CLI/MCP wallet surface shape for local mode.
- Real routing migration `/app` → nested routes (needed for `/app/wallets/[id]` + addressable audit + `/receipt/[id]`).

## Blockers And Open Questions

- **B1 (verification, not planning):** browser-approved proof needs a typed-data-capable provider; which provider/key-scheme works is undetermined and never demonstrated. Plan it as a milestone with a live-smoke checkpoint; do not claim until proven.
- **B2 (decide in plan):** hosted custody/trust model + spend-policy enforcement boundary (off-chain).
- **Q:** local mode = CLI wrapper, MCP wallet server, or both surfaces? Where does its key live?
- **Q:** landing stats — wire real aggregates now or ship labeled sample?
- Confirmed `OUT_OF_SCOPE`: allowance/account-abstraction pre-approval, public registry, Mainnet, production custody.

## Planning Gate Decision

**ALLOWED — full plan.** Reintegration is complete; every surface is classified with no unlabeled shipping mocks. The plan must: (a) trace each phase to `REAL_MVP`/`SIMULATED_DEMO_ONLY`/`OUT_OF_SCOPE`; (b) treat browser-settlement proof and hosted custody as explicit, tracked items; (c) preserve all AGENTS.md honesty boundaries.

## Evidence

- Discovery `2026-06-26-casper-gw-designer-prototype-v3.md`; signing research `2026-06-26-...-deep-research.md` + `2026-06-25-...-reality.md`.
- Repo signing facts: `src/server/{x402-payment.ts,live-paid-call.ts,wallet-store.ts,wallet-signing-readiness.ts,browser-payment-*.ts,hosted-paid-call.ts}`; `casper-x402` `signer.ts`/`exact/client/scheme.ts`; CSPR.cloud x402 live docs.
- README phase log (0–24S); proven deploys 5566d6…, 8ed456…, a27e51…
