# Designer Product Flow Brief: Casper GW

Date: 2026-06-25
Status: Fresh designer-facing product documentation. This supersedes older designer prompts where they prescribe component structure or treat the current UI as design truth.

## Purpose

This document gives a designer enough product, domain, route, data, and state context to design Casper GW end to end.

It is not a visual-design prescription. Do not use the current implementation UI as the visual source of truth. The current UI is an implementation scaffold and is known to be too clustered. The designer owns layout, interaction model, hierarchy, component choice, responsive behavior, and visual direction.

The job of this brief is to explain what the product is, who uses it, which flows must connect, which states must exist, and which boundaries must never be broken.

## Product Summary

Casper GW is a Casper-native agent commerce gateway.

It lets providers expose API/MCP tools as paid x402 tools, lets operators connect and govern Casper wallets for agent spending, lets agents or operators run paid tool calls, and lets anyone inspect public Casper payment proof through an explorer.

The product is not just a wallet, not just an MCP proxy, and not a generic block explorer. The core loop is:

Provider source -> discovered tool -> priced/published endpoint -> governed wallet -> paid x402 call -> four-layer receipt -> public Casper proof.

## Product Pillars

1. Provider gateway

Providers bring an API, OpenAPI spec, manual route, or remote MCP server. Casper GW discovers tools, lets the provider choose which tools to expose, stores upstream credentials server-side, configures per-tool x402 pricing, and publishes a hosted MCP/x402 endpoint.

2. Agent wallet control plane

Operators connect or create Casper wallet profiles, inspect funding readiness, connect browser wallets through CSPR.click, and configure spend policy. Policy runs before signing/payment. A policy block creates no Casper transaction.

3. Paid tool runner

Operators or agents choose a hosted endpoint or paste an MCP/x402 endpoint URL, discover tools, choose a tool, provide schema-specific inputs only when needed, select wallet/policy, pay through x402, and receive a receipt.

4. Public explorer

The explorer is public infrastructure. It must be usable without sign-in, wallet connection, or the authenticated app shell. It shows Casper GW receipts when available and external Casper/WCSPR proof when the data comes only from CSPR.cloud.

5. Four-layer receipt

Every meaningful attempt should be explained through separate layers:

- Gateway context: provider, tool, endpoint/resource, client, price, request reference.
- Policy decision: allowed, blocked, not reached, reason, safe summary of matched rules.
- x402 verify/settle: payment requirements, facilitator result, verify state, settle state.
- Casper proof: deploy hash, network, payer, payee, amount, asset, status, raw Casper explorer link.

## Actors

Provider: Owns an API, OpenAPI spec, manual route, or MCP server and wants to monetize tools without exposing upstream credentials.

Agent operator: Owns or manages the wallet profile, funding, policies, endpoint access, and paid-call permissions.

Agent client: Cursor, Claude Desktop, an MCP client, or a custom agent that calls paid tools through the hosted endpoint.

Public viewer or judge: Opens the public explorer or receipt detail to verify what happened without creating an account.

## Access Model

### Public Surfaces

These are open and must not require wallet connection:

- `/`
- `/explorer`
- Public receipt/proof detail shown from explorer state, search result, or a dedicated public receipt URL if the designer proposes one.
- Raw outbound links to Casper explorers such as `testnet.cspr.live`.

Public surfaces may show local Casper GW receipts, external Casper deploy/account/token-action proof, status, search, filters, related links, copy actions, and proof metadata. They must not expose provider secrets, MCP client tokens, raw private inputs, private tool outputs, wallet private keys, or internal policy config.

### Protected App Surface

`/app` is protected by wallet connection. If the user is not connected, they should not be able to view the app workspace.

The protected state is not just a cosmetic overlay. The app content depends on the connected operator account. The designer should account for:

- SDK loading.
- CSPR.click unavailable or misconfigured.
- Connect wallet action.
- Wallet-selector/account-selection flow owned by CSPR.click.
- Signed-in state with active public key.
- Account switched.
- Signed out.
- Disconnected from wallet.
- Account mismatch between the active CSPR.click account and the selected wallet profile.
- Permission or wallet-provider failure.

CSPR.click connection is event-driven: `signIn()` opens the wallet-selector flow and returns immediately; the app learns success/failure through events such as signed-in, account-switched, signed-out, and disconnected. `signOut()` and `disconnect()` are different outcomes and should not be treated as the same user state.

## Route And Surface Inventory

### Public Landing

Purpose: Explain Casper GW quickly and route users to the public explorer or the protected operator app.

Required information:

- What Casper GW does in one clear product statement.
- The proof loop: source, tool, wallet policy, x402 payment, receipt, Casper proof.
- A path to open the explorer.
- A path to connect wallet and enter the app.
- A small preview of recent proof activity if data is available.
- Honest fixture/sample labeling if any data is not live.

Do not make the landing page the main product experience. The product value is in the flows and proof surfaces.

### Public Explorer

Purpose: Public proof and activity lookup.

Required capabilities:

- Search by Casper GW receipt id.
- Search by Casper deploy hash.
- Search by account hash or public key.
- Search by supported Casper account identifier such as CSPR.name when available.
- Browse public Casper GW receipt history with filters where data exists.
- Browse external WCSPR token actions from CSPR.cloud for the configured payment asset.
- Paginate local receipt history and external CSPR.cloud feed/history.
- Show cache/rate-limit/source metadata as operational metadata, not as proof.
- Link real deploy hashes to raw Casper explorer pages.

Important distinction:

- Casper GW receipts have gateway, policy, x402, and Casper proof layers.
- External CSPR.cloud deploy/account/token-action proof has only Casper proof. Gateway, policy, and x402 context are unavailable unless the event matches a Casper GW receipt.

The explorer should feel public and useful beyond only logged-in users. It is not an authenticated dashboard and not a private app page.

### Public Receipt Or Proof Detail

Purpose: Explain exactly what a viewer can verify.

Required information:

- Receipt id or external proof id.
- Status: settled, policy-blocked, verify-failed, settle-failed, upstream-failed, auth-failed, proof-pending, no-transaction, external-proof.
- Provider/tool/client/endpoint context when available.
- Policy result when available.
- x402 verify and settle results when available.
- Casper deploy/token-action proof when available.
- Raw Casper explorer link when a real deploy hash exists.
- Clear redaction notices for private input/output and secret-bearing fields.
- Statement that Casper proof covers payment settlement only; it does not prove private tool input/output, provider workspace, or policy internals.

Secondary actions the designer should account for:

- Copy receipt id.
- Copy deploy hash or account hash.
- Open raw Casper explorer link.
- Open related wallet/account search.
- Open related provider/tool receipt history when that relationship exists.
- Return to explorer search/history.

The designer can decide whether these actions live in menus, inline buttons, panels, or another interaction pattern.

### Protected App Gate

Purpose: Block `/app` until wallet connection succeeds.

Required states:

- CSPR.click loading.
- Connect wallet available.
- Connecting.
- Connected public key.
- Account mismatch.
- CSPR.click unavailable.
- Wallet provider unsupported or user cancelled.
- Signed out/disconnected.

The gate should explain that wallet connection establishes operator access to the app. It must not ask for seed phrases, private keys, provider API keys, CSPR.cloud tokens, or endpoint client tokens.

### Protected App Workspace

Purpose: Operator and provider work area after connection.

Logical app sections:

- Dashboard or overview.
- Sources.
- My tools.
- Hosted endpoint or endpoint access.
- Wallets and policies.
- Paid tool runner.
- Settings.
- Audit.

These are logical sections, not mandatory visual navigation decisions. The designer should choose the clearest page and component model.

## End-To-End Flows

### Flow 1: Provider Publishes A Paid Tool

1. Connected operator enters `/app`.
2. Provider creates a source.
3. Provider chooses source type: remote MCP, OpenAPI, or manual route.
4. Provider enters source URL/details.
5. Provider configures upstream auth if needed.
6. Source discovery runs.
7. Tool candidates appear with name, description, support status, input schema, output hint, and upstream target.
8. Provider selects one or more tools.
9. Provider prices each selected tool for Casper x402: network, scheme, asset, amount, payee, timeout.
10. Provider publishes the hosted endpoint.
11. Endpoint page shows URL, visible tools, payment requirements, and client connection details.
12. Provider creates scoped client access if needed.

States to design:

- No sources yet.
- Source form in progress.
- Source connection failure.
- Auth failure.
- Discovery loading.
- Discovery empty.
- Discovery succeeded.
- Unsupported operation.
- Tool draft, selected, priced, published, unpublished, unsupported.
- Invalid pricing.
- Published endpoint ready.

Credential boundary:

Provider upstream credentials are server-side only. They may be masked in the app, but never appear in endpoint configs, public receipts, explorer pages, client snippets, browser state, or logs.

### Flow 2: Operator Connects Wallet And Establishes Readiness

1. Operator connects through CSPR.click.
2. App receives active public key.
3. Operator creates/imports a wallet profile from the active browser wallet or selects an existing profile.
4. Wallet profile stores public identity only: public key/account hash, network, signing mode.
5. Readiness checks run.
6. App shows CSPR gas balance, payment-asset balance, readiness verdict, and reason.
7. If not ready, operator follows a funding path.
8. Operator defines or updates spend policy.

States to design:

- No wallet profile.
- Active CSPR.click account available but not saved as profile.
- Wallet profile saved.
- Account mismatch.
- Needs CSPR gas.
- Needs WCSPR/payment asset.
- Funding pending.
- Ready.
- Readiness source unavailable.
- Signing unavailable.

Wallet rules:

- Never ask for a seed phrase or raw private key.
- Do not imply production custody.
- Do not treat "connected wallet" as "ready to pay."
- Readiness needs live evidence, not a static funded label.
- Funding and payment asset readiness are separate from policy approval.

### Flow 3: Operator Configures Spend Policy

1. Operator selects a wallet profile.
2. Operator sets allowed network and asset.
3. Operator sets max per call.
4. Operator sets daily/session headroom where supported.
5. Operator chooses allowed tools/endpoints/providers.
6. Operator can disable/kill spending if supported.
7. Policy preview shows whether a proposed call would pass.

States to design:

- No policy.
- Policy valid.
- Policy disabled.
- Exceeds max per call.
- Wrong asset/network.
- Tool not allowed.
- Budget/headroom exhausted.
- Policy evaluation unavailable.

Policy boundary:

Policy is for paid agent tool calls. Do not design a separate generic token-send product unless Abu explicitly accepts it later.

### Flow 4: Paid Tool Runner

1. Operator chooses an endpoint source:
   - own hosted endpoint, or
   - pasted MCP/x402 endpoint URL.
2. Tool discovery runs before tool input appears.
3. Operator selects a tool.
4. UI renders input fields from the selected tool schema if inputs are required.
5. If no inputs are required, UI shows a no-input-required state.
6. Raw JSON may exist only as an advanced/debug option.
7. Operator selects wallet profile and policy.
8. Server policy/payment-intent preflight runs.
9. If blocked, receipt/audit record is created and no wallet signing prompt appears.
10. If allowed, CSPR.click approval/signing flow runs.
11. Signed payment payload is submitted.
12. CSPR.cloud facilitator verifies and settles.
13. Protected tool call executes only after required payment state succeeds.
14. Receipt is created and linked.

States to design:

- Empty endpoint.
- Endpoint URL invalid.
- Discovery loading.
- Discovery failed.
- No tools.
- Tool selected.
- Required inputs incomplete.
- No input required.
- Wallet not connected.
- Wallet/profile mismatch.
- Policy checking.
- Policy blocked.
- Waiting for wallet approval.
- User cancelled signing.
- SDK unavailable.
- Verify failed.
- Settling.
- Settle failed.
- Proof pending.
- Upstream tool failed.
- Success with receipt.

Proof honesty:

Do not show "settled", "Paid on Testnet", or a deploy-hash link unless a real settle success and real Casper proof exist.

### Flow 5: Hosted Endpoint Client Uses The Gateway

1. MCP client authenticates to Casper GW hosted endpoint with scoped client access.
2. Client lists visible tools.
3. Client calls a priced tool.
4. Endpoint returns x402 payment requirement if unpaid.
5. Client pays/signs through the wallet/payment path.
6. Gateway verifies/settles payment.
7. Gateway calls upstream tool only after payment/policy conditions pass.
8. Gateway returns tool result and persists receipt.

Design implications:

- Endpoint client auth is not wallet/payment authorization.
- Client access token is scoped access only.
- The endpoint can expose authorized discovery metadata after scoped auth.
- The endpoint must not leak upstream provider credentials.
- Payment failures, auth failures, policy blocks, and upstream failures should be distinguishable in audit/receipt surfaces.

### Flow 6: Public Viewer Inspects Proof

1. Viewer opens `/explorer`.
2. Viewer searches or browses.
3. Viewer opens a receipt/proof detail.
4. Viewer sees what is known and what is unavailable.
5. Viewer can open raw Casper explorer links for real deploy hashes.
6. Viewer can navigate to related account/deploy/provider/tool history when available.

States to design:

- Empty search.
- Searching.
- Local receipt match.
- Local deploy match.
- Local account match.
- External deploy proof.
- External account proof.
- External WCSPR feed.
- Not found.
- Upstream unavailable.
- Rate limited with cached proof available.
- Rate limited without cached proof.

## Core Data Concepts For The Designer

Provider source: A provider-owned upstream API/OpenAPI/manual route/MCP source.

Provider tool: A discovered operation/tool from a source. Has publication state and input schema.

Tool price: x402 payment settings for a published tool.

Hosted endpoint: Casper GW's MCP/x402 endpoint for a provider source.

Endpoint client access: Scoped bearer token/client access for MCP clients. It is not payment authority.

Agent wallet profile: Public wallet identity and signing mode used for agent spending.

Wallet readiness: Live status derived from gas balance, payment-asset balance, network, and signing availability.

Spend policy: Rules that decide whether a paid call may proceed before signing/payment.

Paid-call attempt: One attempted paid tool call, successful or failed.

Policy decision: The allow/block/not-reached result for an attempt.

x402 record: Payment requirements, payment payload, verify result, settle result, and facilitator context.

Casper proof: Deploy hash, token action, network, payer, payee, amount, status, and raw explorer URL.

Receipt: Public-safe assembled view of gateway context, policy decision, x402 context, and Casper proof.

Audit event: Internal operator-facing event for source, pricing, publish, auth, policy, payment, proof, settings, and upstream changes.

External proof/feed item: CSPR.cloud-sourced Casper data that may not correspond to a Casper GW receipt.

## Status Vocabulary

Use status language that separates product states:

- Source: empty, connecting, connected, discovery failed, unsupported operation.
- Tool: draft, selected, priced, published, unpublished, unsupported.
- Endpoint: not configured, configured, client access created, authorized discovery available, payment required, payment verified, settlement failed.
- Wallet: disconnected, connected, profile saved, mismatch, needs gas, needs payment asset, ready, signing unavailable.
- Policy: not configured, allowed, blocked, disabled, evaluation failed.
- Payment: requirements received, waiting for approval, cancelled, verifying, settling, settled, verify failed, settle failed.
- Proof: pending, verified deploy, external proof, unavailable, no transaction.
- Receipt: settled, blocked, verify failed, settle failed, upstream failed, auth failed, proof pending, external proof.

Avoid collapsing these into a single generic success/failure state.

## Boundaries The Design Must Preserve

Do not use the current implementation UI as the source of visual truth.

Do not design a top-level registry or private-tool marketplace as MVP scope.

Do not use private/public tool labels.

Do not use "sandbox" as the product surface. The accepted product concept is a paid tool runner or console.

Do not expose Simulated or Local as normal product modes.

Do not show fake deploy hashes or fake settled proof.

Do not make explorer gated by wallet connection or app auth.

Do not merge provider upstream credentials, endpoint client access, and wallet/payment authorization.

Do not expose provider upstream credentials, raw client tokens, private keys, seed phrases, private request inputs, private outputs, CSPR.cloud tokens, or internal policy config.

Do not claim Mainnet or production custody in this design pass.

Do not design generic token-send policy unless it is explicitly accepted later.

## What The Designer Owns

The designer should decide:

- Information architecture.
- Route hierarchy beyond the hard public/protected boundary.
- Page vs panel vs dialog vs inline task patterns.
- Navigation model.
- Density and hierarchy.
- Responsive behavior.
- Empty/loading/error/success state presentation.
- How proof layers and related links are revealed.
- How long hashes, account identifiers, tool schemas, JSON, and logs are made readable.
- How CSPR.click connection states are communicated.
- How the paid-call timeline is represented.

The designer should not be constrained by the current UI layout, existing card structure, or previous prototype screenshots.

## Required Designer Deliverables

Ask the designer to produce:

- Route map and information architecture.
- Public explorer flow.
- Protected app gate flow.
- Provider source/tool/pricing/publish flow.
- Endpoint client access flow.
- Wallet profile/readiness/policy flow.
- Paid tool runner flow.
- Receipt/proof detail flow.
- Settings and audit flow.
- Empty/loading/error/success state coverage.
- Redaction and proof-boundary notes.
- List of mocked data and mocked integrations used in the prototype.
- Open questions or product conflicts discovered during design.

## Mocking Rules For A Prototype

A high-fidelity prototype may use mocked data for design speed.

Mocked payment/proof data must be labeled as sample/fixture at the point of use.

Mocked integrations are design evidence only. They do not become implementation decisions until prototype discovery and prototype reintegration classify every mock.

Any prototype returned from this brief must later be reviewed for:

- mocked data sources,
- mocked auth state,
- mocked wallet actions,
- mocked payment path,
- mocked MCP/tool calls,
- mocked storage,
- mocked CSPR.cloud/facilitator responses,
- mocked Casper proof,
- fake links or fake hashes.

## Research Sources Used

Local project sources:

- `.thoughts/README.md`
- `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/raw/api-mcp-x402-wallet-gateway-2026-06-18.md`
- `.thoughts/raw/casper-x402-explorer-2026-06-18.md`
- `.thoughts/wiki/x402-ai-agent-winner-patterns.md`
- `.thoughts/wiki/cspr-trade-mcp-and-x402.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24h-browser-wallet-profile-import.md`

Current wallet docs checked:

- Installed CSPR.click skill: `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`
- Context7 `/websites/cspr_click`
- Context7 `/make-software/csprclick-examples`

Implementation source checked only for product/data surface, not visual design:

- `src/db/schema.ts`
- `src/lib/types.ts`
- `src/lib/wallet-control-types.ts`
- route inventory under `src/app/api/`

Missing local reference note:

- `.thoughts/raw/source-index.md` lists cloned reference repos under `.thoughts/raw/repos/`, but this worktree does not currently contain `.thoughts/raw/repos/`. This brief therefore uses the local reports that summarized those repo reads, not the repo files themselves.
