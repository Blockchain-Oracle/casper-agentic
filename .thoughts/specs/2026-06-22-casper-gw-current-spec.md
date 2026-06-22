# Spec: Casper GW Current Product Specification

Date: 2026-06-22
Status: Supersedes `2026-06-18-agent-commerce-gateway.md` for current product decisions. This is a specification, not an implementation plan.

## Objective

Define the current requirements for Casper GW, a Casper-native agent commerce gateway where providers publish paid API/MCP tools, operators control funded Casper agent wallets and spend policy, agents run paid tool calls through x402, and every attempt produces a receipt that separates gateway context, policy decision, x402 state, and Casper proof.

## Background And Current Reality

The earlier spec captured the initial product idea, but it now contains stale requirements: top-level registry, public/private tools, Simulated/Local/Live mode rail, and demo sandbox language. The 2026-06-22 reintegration and Claude Code design review corrected those points.

Current reality:

- CSPR.cloud provides the hosted Casper indexed-data path and hosted x402 facilitator path for MVP. Casper GW should not plan to run a Casper node or build a chain indexer.
- The first real proof loop should be Casper Testnet-first. Mainnet is out of scope until explicitly approved.
- The product must not claim `Paid on Testnet`, `settled`, or show a deploy hash unless a real Casper Testnet deploy hash exists.
- Registry/discovery is optional later behavior, not an MVP source of truth.
- The public explorer is public infrastructure, not a gated dashboard screen.
- Wallet funding/readiness is a first-class MVP requirement, not just a balance label.
- The visual design is not fully approved. The current design direction requires top-header app navigation and focused modals/tabs/drawers.

## Users

- Provider: developer/team that owns an API, OpenAPI spec, manual route, or MCP server and wants to publish paid tools.
- Agent Operator: person configuring wallet funding, spend policy, endpoint access, and agent permissions.
- Agent Client: Cursor, Claude Desktop, custom MCP client, or scripted agent that calls paid tools.
- Viewer/Judge: person inspecting the public explorer, receipt proof, and hackathon value proposition.

## Goals

- Prove one complete real paid-tool loop on Casper Testnet.
- Let a provider connect a source, discover tools, price selected tools, and publish a hosted MCP/x402 endpoint.
- Keep provider upstream credentials, MCP client access auth, and x402 wallet/payment authorization separate.
- Let an operator connect/provision/fund a Casper agent wallet and enforce spend policy before payment.
- Provide an endpoint-first paid tool console that discovers tools, renders schema-specific inputs, runs policy, pays through x402, and links to receipts.
- Provide a public explorer that shows receipt/proof data without sign-in or wallet connection.
- Preserve proof honesty and redaction across every receipt state.

## Non-goals

- Production custody architecture.
- Mainnet payments.
- Generic Casper block explorer replacement.
- Chain-wide x402 detection without gateway/facilitator context.
- Top-level tool registry or marketplace as MVP scope.
- Private/public tool visibility model.
- Generic token-send policy product.
- Simulated or local settlement as user-facing product modes.
- Full OAuth 2.1 provider implementation in the first slice.
- Broad OpenAPI edge-case coverage before one complete paid loop works.
- Copying prototype HTML/CSS directly into the app without target-stack translation.

## Requirements

### Product Boundaries

- RQ-01: The MVP must be organized around five connected surfaces: Provider Gateway, Agent Wallet Control Plane, Paid Tool Test Console, Public Explorer/Receipt Layer, and Settings/Audit.
- RQ-02: The MVP must make the full loop visible: source -> selected/priced tool -> hosted endpoint -> funded wallet/policy -> paid call -> receipt -> public proof.
- RQ-03: The product must be Casper Testnet-first and must not expose Simulated/Local as normal product modes.
- RQ-04: Mainnet must be hidden or explicitly gated/later.
- RQ-05: Endpoint live/published status must never be confused with settlement/proof status.
- RQ-06: Any fixture data must be labeled as fixture/sample data at the point of use.

### Provider Gateway

- RQ-07: A provider must be able to create a source from at least one real source path for MVP, with OpenAPI import, remote MCP, and manual route modeled honestly if not all are implemented.
- RQ-08: Source discovery must normalize operations into tool candidates with id, description, input schema, output hint, upstream target, and support status.
- RQ-09: Tool states must use accepted publication language: `Draft`, `Selected`, `Priced`, `Published`, `Unpublished`, and `Unsupported`.
- RQ-10: The provider must select which tools are exposed before pricing/publishing.
- RQ-11: Provider upstream credentials must be stored server-side only, masked after save, and never exposed to clients, receipts, explorer, exports, browser state, or user-facing logs.
- RQ-12: The provider must configure pricing per published tool: network, scheme, asset, amount, payee account, and timeout.
- RQ-13: The product must support the Casper Testnet x402 proof path: `casper:casper-test`, `exact`, CEP-18 asset, and valid payee account.
- RQ-14: The provider must publish a hosted MCP/x402 endpoint with copyable client configuration.
- RQ-15: Hosted endpoint config must list published tools and advertised payment requirements.

### MCP Client Access

- RQ-16: MCP client access auth must be separate from provider upstream credentials and wallet/payment authorization.
- RQ-17: MVP may use scoped bearer tokens for compatibility, labeled as client access tokens only.
- RQ-18: OAuth 2.1/Bearer remains the target architecture for remote MCP auth.
- RQ-19: Client access tokens must be scoped to workspace/endpoint/tool access and must not authorize spending.

### Agent Wallet Control Plane

- RQ-20: An operator must be able to connect or provision at least one Casper agent wallet profile.
- RQ-21: Wallet profile must show account/public key, network, signing mode, funding status, CSPR gas balance, payment-asset balance, allowance/spend headroom, and readiness verdict when data is available.
- RQ-22: Wallet readiness must be derived from real balance/allowance evidence for implementation, not a stored `funded` flag.
- RQ-23: The product must represent the wallet funding journey: connect/provision -> show receive address -> Testnet faucet or transfer instructions -> confirming -> ready.
- RQ-24: The funding journey must account for CSPR gas and CEP-18 payment asset separately.
- RQ-25: The UI must represent faucet constraints and failure/retry states rather than implying unlimited funding.
- RQ-26: The signing mode must be explicit and must not claim production custody unless separately approved.
- RQ-27: Spend policy must support max per call, session/day budget or headroom, allowed endpoint/tool/provider, allowed network/asset, manual approval if included, and kill/disable state if implemented.
- RQ-28: Spend policy must run fail-closed before signing/payment.
- RQ-29: A policy block must create an auditable event/receipt and must not create a Casper transaction.

### Paid Tool Test Console

- RQ-30: The console must behave like an MCP/x402 endpoint runner, not a scripted sandbox.
- RQ-31: The operator must choose either the hosted endpoint or a pasted MCP/x402 endpoint URL.
- RQ-32: The console must discover tools from the selected endpoint before tool input is shown.
- RQ-33: The console must render inputs from the selected tool schema only when the tool requires input.
- RQ-34: No-input tools must show a `No input required` state.
- RQ-35: Raw JSON input may exist only as an advanced/debug option.
- RQ-36: The console must show wallet/policy selection before running a paid call.
- RQ-37: The console timeline must show policy pre-check before x402 verify/settle.
- RQ-38: The console must include settling, payment-failed, policy-blocked, upstream-failed, and proof-pending states.
- RQ-39: Any scenario toggles used in a prototype must be clearly labeled as design/demo controls and must not ship as product controls.

### Casper x402 Payment Flow

- RQ-40: A paid call must follow the x402 flow: request protected resource, return/handle payment requirements, sign payment authorization, verify, settle, execute/return protected result, persist receipt.
- RQ-41: The x402 payment path must use a real Casper-compatible settlement path for MVP, defaulting to CSPR.cloud hosted facilitator unless the team explicitly chooses self-hosted `casper-x402`.
- RQ-42: Verify and settle responses must be persisted for each paid-call attempt.
- RQ-43: Successful settlement must record transaction/deploy hash, network, payer, payee, amount, asset, facilitator, and confirmation/proof status.
- RQ-44: Failure must record machine-readable error reason and human-readable message when available.
- RQ-45: The UI must not branch on HTTP status alone for facilitator success/failure if the underlying facilitator returns structured success/failure bodies.
- RQ-46: Live settlement must never be claimed unless a real Casper Testnet deploy hash is produced.

### Public Explorer And Receipt Layer

- RQ-47: The explorer must be public and viewable without sign-in, wallet connection, or authenticated app sidebar.
- RQ-48: The explorer must support search/filter by receipt id, deploy hash, wallet/account, provider, tool, status, network, and time where data exists.
- RQ-49: The explorer should include infrastructure-like vitality stats: total receipts, settled count/volume, failed/blocked count, latest proof, and unique providers/tools.
- RQ-50: A receipt must be created for each meaningful attempt state: paid, policy-blocked, client-auth-failed, verify-failed, settle/payment-failed, upstream-failed, proof-pending, and no-transaction.
- RQ-51: Public receipt detail must separate four layers: gateway context, policy decision, x402 verify/settle, and Casper proof.
- RQ-52: Public receipts must redact private request inputs, private outputs, provider upstream credentials, MCP client tokens, and internal policy config.
- RQ-53: Casper proof must include deploy hash, network, payer, payee, amount, asset, confirmation/status, and raw explorer link when available.
- RQ-54: The explorer must state that Casper proof covers payment settlement only, not the full tool/provider/policy context.
- RQ-55: Deploy-hash links must point to a raw Casper explorer such as `testnet.cspr.live` when a real hash exists.

### Settings And Audit

- RQ-56: Settings must expose credential boundaries, network, facilitator, signing mode, and client access state without leaking secrets.
- RQ-57: Audit must record source, credential, pricing, publish, policy, payment, proof, and settings events.
- RQ-58: Audit events must distinguish OK, policy block, payment failure, proof pending, auth failure, and upstream failure.
- RQ-59: Secrets, private keys, seed phrases, provider API keys, CSPR.cloud tokens, and wallet material must never be committed or exposed.
- RQ-60: Fixture tokens must not use live-looking secret prefixes.

### Design And Prototype Constraints

- RQ-61: The authenticated app design should use top-header navigation, not a persistent sidebar, unless Abu later approves a different structure.
- RQ-62: Wallet/funding/policy should be a modal with tabs; fund-wallet should be a drawer or stepper.
- RQ-63: Add-source should be a modal wizard; price/publish should be a per-tool drawer; settings should be a tabbed page.
- RQ-64: The design must not reintroduce registry/private-tool semantics, simulated/local product modes, fake proof, or generic send-policy UI.
- RQ-65: A prototype may use mocked integrations, but prototype discovery and reintegration must classify every mock before implementation planning.

## Acceptance Criteria

- AC-01: A new agent can explain Casper GW as provider gateway + agent wallet control plane + paid tool runner + public x402 receipt explorer.
- AC-02: The spec and stories no longer require top-level registry, public/private tool labels, Simulated/Local mode rail, or demo sandbox as MVP scope.
- AC-03: A provider can configure one source, discover/select one tool, price it, and publish a hosted MCP/x402 endpoint.
- AC-04: Provider upstream credentials, MCP client auth, and x402 wallet/payment authorization are visibly separate.
- AC-05: An operator can connect/provision a wallet and complete a funding/readiness journey or see a truthful blocker.
- AC-06: Spend policy blocks unsafe calls before signing/payment and produces no Casper transaction.
- AC-07: A paid allowed call reaches x402 verify/settle and creates a receipt.
- AC-08: Live/Testnet success is never shown without a real deploy hash.
- AC-09: The paid tool console discovers endpoint tools and renders schema-specific inputs only after tool selection.
- AC-10: Public explorer and receipt detail are accessible without app auth or wallet connection.
- AC-11: Receipt detail separates gateway, policy, x402, and Casper proof layers.
- AC-12: Public receipt detail redacts private inputs/outputs, provider secrets, MCP tokens, and internal policy config.
- AC-13: Settings and audit make trust boundaries and proof states inspectable.
- AC-14: Designer reset brief can be handed to a fresh designer without requiring conversation history.

## Constraints

- Follow `.thoughts/README.md` for current context order.
- Treat `2026-06-22-casper-gw-reintegration-and-codex-handoff.md` as the current reintegration source.
- Do not treat older spec/story registry/sandbox/mode requirements as current.
- Do not implement from this spec directly without the next Context Engineering step.
- Use local `.thoughts` and cloned reference repos before broad web research.
- Use Context7 for current SDK/library/API syntax when implementation decisions begin.
- Preserve CSPR.cloud field names exactly when coding against its APIs.

## Stories Needed

- Provider connects a source and discovers candidate tools.
- Provider protects upstream credentials.
- Provider prices and publishes one hosted MCP/x402 endpoint.
- Operator separates MCP client access from payment authorization.
- Operator connects/provisions and funds a Casper agent wallet.
- Operator defines spend policy and readiness.
- Agent/client runs an allowed paid tool call.
- Policy blocks an unsafe paid tool call.
- Successful settlement produces a four-layer receipt.
- Public explorer exposes proof without sign-in.
- Settings/audit expose trust boundaries.
- Designer/prototype pass represents the structure without reintroducing stale scope.

## Open Questions

- What `CSPR_CLOUD_API_KEY` will be used for real Testnet proof?
- Which CEP-18 Testnet payment asset/package will be used?
- Which wallet signing mode is accepted for MVP: CSPR.click, local signer, generated test wallet, or hosted encrypted signer labeled as non-production?
- Which provider source path is first: real `cspr-trade-mcp`, OpenAPI import, remote MCP, or manual route?
- Will OAuth 2.1 be implemented in MVP or preserved as architecture after scoped bearer tokens?
- What datastore is accepted for the first real receipt loop?
- Does Abu want any optional public discovery/catalog surface after the core loop works?
- What final product name should the submitted UI use?

## Source References

- Current front door: `../README.md`
- Current product truth wiki: `../wiki/agent-commerce-gateway-current-truth.md`
- Current reintegration handoff: `../prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Current design review: `../design/2026-06-22-claude-code-design-review.md`
- Scoped design direction: `../design/2026-06-22-design-direction-and-structure.md`
- Earlier thesis: `../wiki/agent-commerce-gateway-thesis.md`
- Auth and proof research: `../research/2026-06-18-mcp-gateway-auth-reality.md`, `../research/2026-06-18-casper-x402-onchain-identification.md`
- Source index and cloned repos: `../raw/source-index.md`, `../raw/repos/`
