# Spec: Casper Agent Commerce Gateway

Date: 2026-06-18
Status: Updated after prototype discovery delta acceptance; research-backed plan created on 2026-06-19

> 2026-06-22 consistency note: this spec is historical. Use `2026-06-22-casper-gw-current-spec.md` for current product decisions. The registry/private-tool requirements, Demo Sandbox language, and Simulated/Local/Live mode rail in this file were superseded by prototype reintegration.

## Objective

Define the product requirements for a Casper-native Agent Commerce Gateway: a platform where providers publish paid API/MCP tools, agent operators control Casper agent wallets and spend policies, and every paid call produces an auditable receipt that joins gateway context, x402 payment context, and Casper transaction proof.

This spec defines what should exist and how done will be recognized. It does not define the implementation sequence and does not approve build artifacts.

## Background And Current Reality

The accepted product direction is an agent-commerce control plane, not a standalone wallet, generic MCP proxy, generic DeFi bot, or generic explorer.

Reality research established these constraints:

- The current project folder is research-only. There is no app scaffold, Git repo, root manifest, CI, or runnable implementation yet.
- Casper x402 has a real path through CSPR.cloud and `make-software/casper-x402`.
- CSPR.cloud supports `/supported`, `/verify`, and `/settle` for Casper x402.
- CSPR.cloud `/verify` validates signed payment payloads without submitting on-chain.
- CSPR.cloud `/settle` validates and settles on Casper, returning a Casper transaction/deploy hash on success.
- Casper x402 uses the `exact` scheme on `casper:*` networks, CEP-18 `transfer_with_authorization`, and EIP-712 signatures.
- Remote HTTP MCP authorization is OAuth 2.1/Bearer-oriented and is separate from x402 payment authorization.
- CSPR.trade MCP proves a Casper MCP precedent exists, but it is not a general provider gateway for arbitrary APIs/MCP servers.
- Chain-only Casper transaction inspection cannot prove the full x402 resource/tool/provider/policy context. The explorer must join gateway/facilitator records to raw Casper proof.
- Existing OpenAPI-to-MCP generators and MCP monetization proxies mean conversion or pricing alone is not enough; the differentiator is the combined Casper-native provider gateway, wallet policy, and receipt proof loop.
- Prototype discovery inspected the updated `Casper Gateway.dc.html` prototype and accepted it as design evidence. The older sidebar/print prototype variants and exported screenshots are secondary evidence only.
- The updated prototype makes the global environment mode, trust boundaries, guided demo, settings/audit surface, registry allowlist behavior, and receipt proof layers concrete enough to carry into the spec.

## Users

- Provider: developer or team that owns an API, OpenAPI spec, or MCP server and wants to publish paid tools.
- Agent Operator: person configuring agent wallets, spend limits, allowlists, and client access.
- Agent Client: Cursor, Claude Desktop, custom MCP client, or scripted agent that calls paid tools.
- Viewer/Judge: person evaluating the product, receipts, and Casper proof.

## Goals

- Let providers publish priced tools from APIs, OpenAPI specs, existing MCP servers, or manual definitions.
- Keep provider upstream credentials server-side and separate from MCP client auth and wallet/payment authorization.
- Let agent operators create or connect Casper wallet profiles and set spend policies before calls are paid.
- Support one complete paid-tool loop where policy, x402 verify/settle, tool result, and receipt are visible.
- Produce receipts that clearly separate gateway context, x402 context, and raw Casper proof.
- Provide a registry/discovery surface for published tools.
- Provide a demo sandbox that can show the full flow safely in live Testnet, local, or clearly labeled simulated mode.
- Provide settings and audit visibility for credentials, client access, facilitator mode, wallet signing mode, and key system events.

## Non-goals

- Production-grade custody for user funds.
- Replacing CSPR.live or building a chain-wide Casper explorer.
- Claiming every Casper `transfer_with_authorization` transaction is x402.
- Full generic OpenAPI coverage for every edge case.
- Full OAuth implementation for every upstream provider.
- On-chain spend-policy smart contracts.
- Mainnet payments unless explicitly approved later.
- Generic DeFi strategy automation.
- Production database, backend, wallet, payment, or smart-contract implementation during design/prototype phases.

## Requirements

### Product Surfaces

- RQ-01: The product must expose five connected surfaces:
  - Provider Gateway.
  - Agent Wallet Control Plane.
  - Casper x402 Explorer/Receipt Layer.
  - Discovery/Registry.
  - Demo Agent Sandbox.
- RQ-02: The product must make the full product loop visible: provider publishes paid tool, operator configures wallet policy, agent calls tool, policy allows or blocks, x402 verifies/settles, receipt proves the outcome.
- RQ-02A: The product must expose a persistent global environment mode:
  - Simulated: no live chain settlement.
  - Local: local facilitator or local-only flow with no live Casper proof unless explicitly proven.
  - Live Testnet: Casper Testnet flow that cannot claim proof without a real transaction/deploy hash.
- RQ-02B: Endpoint or provider status labels such as live, active, published, or public must be visually and semantically distinct from live settlement/proof status.

### Provider Gateway

- RQ-03: A provider must be able to create a provider source with name, description, owner/workspace, and source type.
- RQ-04: The system must support at least one provider source path for MVP and model the remaining paths explicitly:
  - OpenAPI JSON/YAML import.
  - Existing remote MCP server.
  - Manual API route/tool definition.
- RQ-05: The system must normalize source operations into tools with names, descriptions, input schema, output hints, and upstream target metadata.
- RQ-06: The provider must be able to enable or disable each discovered tool before publishing.
- RQ-07: The provider must configure upstream credentials separately from client access and wallet/payment authorization.
- RQ-08: Supported upstream credential types for the MVP should include no-auth, static header, API-key header, and bearer token.
- RQ-09: Upstream credential values must be masked after save and must never be returned to agent clients, receipts, exports, explorer views, or logs intended for users.
- RQ-10: The provider must assign price settings per enabled tool:
  - network,
  - scheme,
  - asset,
  - amount,
  - payee account,
  - timeout.
- RQ-10A: Pricing validation must cover amount, asset, payee account, network, and timeout before a tool is published as paid.
- RQ-11: `casper:casper-test`, `exact`, and CEP-18 asset configuration must be supported or represented for the Casper x402 proof path.
- RQ-12: The provider must be able to publish a hosted endpoint with copyable MCP/client configuration.
- RQ-12A: Hosted endpoint setup must include copyable client configuration examples for Cursor, Claude Desktop, and a custom/curl client unless a later implementation decision removes one with justification.
- RQ-13: The provider must be able to choose whether a tool/endpoint appears in the public registry.

### MCP Client Authentication

- RQ-14: Hosted endpoints must authenticate MCP clients independently from x402 payment.
- RQ-15: The target remote MCP auth model must be OAuth 2.1/Bearer.
- RQ-16: Static scoped endpoint tokens may be used as an MVP compatibility fallback, but must be labeled as client access tokens, not wallet keys or payment authorization.
- RQ-17: Client access tokens must be scoped to workspace, endpoint, and allowed tools.

### Agent Wallet Control Plane

- RQ-18: An operator must be able to create or connect at least one Casper agent wallet profile.
- RQ-19: Wallet profiles must expose network, account identity, signing mode, and balance/funding status or instructions.
- RQ-20: The MVP must choose and clearly label one wallet signing mode:
  - generated demo/test wallet,
  - user-provided test key,
  - CSPR.click signing flow,
  - local signer,
  - or hosted encrypted signer.
- RQ-20A: For the accepted prototype path, the default demo signing mode is `Hosted encrypted signer`. This is a prototype/MVP default, not a claim of production custody architecture.
- RQ-21: Operators must configure spend policies per wallet or agent:
  - max spend per call,
  - max spend per day/session,
  - allowed providers,
  - allowed tools,
  - allowed networks/assets,
  - optional manual approval mode.
- RQ-22: Policy checks must run before payment signing or settlement.
- RQ-23: A blocked call must produce an auditable policy event and must not create a settlement transaction.

### Casper x402 Payment Flow

- RQ-24: A paid call must follow the x402 flow at the product level:
  - client requests paid resource/tool,
  - gateway presents or handles payment requirements,
  - wallet/signing path creates payment authorization,
  - facilitator verifies,
  - facilitator settles when allowed,
  - gateway returns protected result after success.
- RQ-25: The system must integrate with or be designed around a real Casper-compatible settlement path: CSPR.cloud x402 facilitator or `make-software/casper-x402`.
- RQ-26: The system must store verify and settle outcomes for each paid-call attempt.
- RQ-27: Successful settlement must record transaction/deploy hash, network, payer, payee, amount, asset, and facilitator source.
- RQ-28: Settlement failure must record machine-readable error reason and human-readable message when available.
- RQ-29: Live settlement must never be claimed unless a real Casper transaction/deploy hash is produced.
- RQ-30: Simulated/local settlement must be visibly labeled wherever it appears.

### Casper x402 Explorer / Receipt Layer

- RQ-31: The system must create a receipt for every paid-call attempt, including blocked, failed, simulated, and successful states.
- RQ-32: A receipt must include gateway context:
  - provider,
  - tool,
  - endpoint,
  - resource URL,
  - price,
  - client,
  - wallet,
  - policy decision,
  - request id.
- RQ-33: A receipt must include x402 context:
  - payment requirements,
  - verify result,
  - settle result,
  - facilitator source,
  - error codes/messages when available.
- RQ-34: A receipt must include Casper proof context when available:
  - transaction/deploy hash,
  - network,
  - payer,
  - payee,
  - amount,
  - asset,
  - confirmation/status,
  - raw Casper explorer or JSON-RPC verification link/status.
- RQ-35: The explorer must visually and semantically distinguish gateway context, x402 context, and raw Casper proof.
- RQ-36: The explorer must not claim that chain-only inspection proves the MCP tool, resource URL, provider workspace, pricing rule, or policy decision.
- RQ-37: The explorer must support filtering by provider, tool, wallet, status, network, and time.
- RQ-37A: Receipt statuses must distinguish at least settled, blocked, verify failed, settle failed, upstream failed, client auth failed, simulated, and raw proof unavailable states.

### Discovery / Registry

- RQ-38: Providers must be able to mark tools/endpoints as public or private.
- RQ-39: Public tools must appear in a registry with provider, tool name, description, price, network, asset, auth type, and copyable usage instructions.
- RQ-40: Private tools must not appear in the public registry and must require scoped client access.
- RQ-40A: Operators must be able to add a public registry tool to an allowlist or policy candidate list.

### Demo Agent Sandbox

- RQ-41: The product must include a sandbox flow that can run one paid-call journey from tool selection through receipt.
- RQ-42: The sandbox must show policy decision before payment settlement.
- RQ-43: The sandbox must show request, policy, verify, settle, result, and receipt states.
- RQ-43A: The sandbox must support at least three runnable demo outcomes:
  - settled,
  - policy block,
  - settlement failure.
- RQ-43B: Sandbox receipt links must open receipts that match the selected scenario outcome. A blocked or failed scenario must not route to a settled receipt.
- RQ-43C: Verify failure, upstream failure, and client-auth failure must be represented at minimum in receipt/explorer fixtures. They may become runnable sandbox scenarios if implementation time allows.
- RQ-44: The sandbox must have a safe demo mode if live credentials, funding, facilitator access, or Casper Testnet conditions are unavailable.
- RQ-45: Safe demo mode must be clearly labeled as simulated/local and must not masquerade as live Casper settlement.

### Cross-Cutting Quality Requirements

- RQ-46: The UI must make provider-side and agent-side workflows distinct but connected through receipts.
- RQ-47: Secrets must never appear in browser-visible state, client responses, user-facing logs, receipts, exports, or explorer views.
- RQ-48: Paid-call state transitions must be idempotent by request/call id.
- RQ-49: The product must remain demonstrable with one provider, one tool, one wallet, and one demo call.
- RQ-50: Error states must be explicit for provider upstream failure, client auth failure, policy block, x402 verify failure, x402 settlement failure, and raw Casper proof unavailable.
- RQ-51: The product must include Settings/Audit visibility for masked provider credentials, client token/OAuth app status, facilitator mode, wallet signing mode, and audit events.
- RQ-52: Mock credentials, fixture tokens, and prototype/demo secrets must never use live-looking secret prefixes such as `sk_live`.
- RQ-53: The visual/design-system provenance must remain clear: cdr-kit/Story Protocol/CDR assets are prototype design-system evidence only unless Abu explicitly accepts them as the Casper Gateway visual base.

## Acceptance Criteria

- AC-01: The product shape can be explained as a Casper-native Agent Commerce Gateway with provider, wallet, receipt/explorer, registry, and sandbox surfaces.
- AC-02: A provider can define or import at least one tool candidate and configure upstream auth without exposing secrets.
- AC-03: A provider can price and publish at least one hosted paid endpoint.
- AC-04: A client access mechanism is shown separately from wallet/payment authorization.
- AC-05: An operator can define one wallet profile and one spend policy.
- AC-06: A paid call is allowed or blocked by policy before settlement.
- AC-07: A blocked call creates an auditable event/receipt without settlement proof.
- AC-08: An allowed call reaches x402 verify/settle state in live, local, or clearly labeled simulated mode.
- AC-09: Live settlement, if claimed, includes a real Casper transaction/deploy hash.
- AC-10: The explorer receipt separates gateway context, x402 context, and Casper proof.
- AC-11: The registry shows public paid tools and hides private tools.
- AC-12: A judge can follow one full demo path without relying on vague UI copy.
- AC-13: The UI clearly distinguishes Simulated, Local, and Live Testnet modes and does not confuse endpoint liveness with settlement/proof liveness.
- AC-14: Sandbox settled, policy-block, and settlement-failure outcomes each lead to matching receipts.
- AC-15: Settings/Audit shows trust boundaries, masked secrets, client access status/scopes, facilitator mode, wallet signing mode, and audit events.
- AC-16: A registry tool can be copied and added to an allowlist or policy candidate list.
- AC-17: Prototype/demo fixtures contain no live-looking secrets or tokens.
- AC-18: The accepted prototype is treated as design/product evidence and translated into the eventual stack instead of copied blindly.

## Constraints

- The current workspace is research-only; no implementation gates can be treated as active yet.
- The finalized quality profile is the quality input for this spec.
- Do not move into story finalization, designer brief finalization, prototype, plan, or implementation from this spec alone.
- Provider upstream credentials, MCP client auth, and x402 wallet/payment authorization must remain separate.
- The explorer must not invent chain-only x402 context.
- Live Casper proof must be evidence-backed; simulated proof must be labeled.
- Context7 must be used later for current library/API/framework docs before implementation decisions.
- The updated prototype discovery is accepted as product evidence, but implementation planning must still translate it into the chosen stack.

## Stories Needed

The story step should derive testable stories for these slices:

- Provider creates a source and discovers/defines tools.
- Provider configures upstream credentials safely.
- Provider prices and publishes a hosted endpoint.
- Agent operator configures client access separately from payment.
- Agent operator creates/connects wallet profile.
- Agent operator defines spend policy.
- Agent/client makes an allowed paid call.
- Policy blocks an unsafe paid call.
- Successful settlement produces Casper-linked proof.
- Explorer displays gateway, x402, and Casper proof context.
- Registry lists public tools and hides private tools.
- Operator adds a public registry tool to an allowlist or policy candidate list.
- Viewer inspects Settings/Audit to confirm trust boundaries.
- Demo sandbox runs the complete flow.
- Demo sandbox routes each outcome to the matching receipt.

## Open Questions

- Which provider source path should be first for the MVP: manual tool definition, OpenAPI import, existing MCP proxy, or one of each?
- Should `Hosted encrypted signer` remain the MVP wallet signing mode after implementation architecture review, or should it be replaced before build?
- Is live Casper Testnet settlement required for the first high-fidelity prototype, or only for implementation verification?
- Which settlement path should be preferred later: CSPR.cloud facilitator or self-hosted `make-software/casper-x402`?
- Which asset should be used for the Casper Testnet proof?
- Will MVP client auth use scoped static tokens first, or attempt OAuth 2.1 earlier?
- What should be public in the registry during demo versus private workspace-only?
- What raw Casper explorer or JSON-RPC verification link format should be shown once a real transaction/deploy hash exists?
- Is the cdr-kit-derived visual system acceptable as the Casper Gateway visual base, or should it remain inspiration only?
- Should the product name be `Casper Gateway`, `casper-gw`, or `Casper Agent Commerce Gateway` for submission?
- Should registry endpoint-state labels avoid the word `Live` when global settlement mode is Simulated?

## Source References

- Quality profile: `../quality/2026-06-18-agent-commerce-gateway-quality-profile.md`
- Reality refresh: `../research/2026-06-18-agent-commerce-gateway-reality-refresh.md`
- Product context wiki: `../wiki/agent-commerce-gateway-product-context.md`
- Thesis wiki: `../wiki/agent-commerce-gateway-thesis.md`
- Auth reality: `../research/2026-06-18-mcp-gateway-auth-reality.md`
- Casper x402 on-chain identification: `../research/2026-06-18-casper-x402-onchain-identification.md`
- Casper x402 explorer reality: `../research/2026-06-18-casper-x402-explorer-reality.md`
- CSPR.cloud x402 facilitator docs:
  - https://docs.cspr.cloud/x402-facilitator-api/reference.md
  - https://docs.cspr.cloud/x402-facilitator-api/supported.md
  - https://docs.cspr.cloud/x402-facilitator-api/verify.md
  - https://docs.cspr.cloud/x402-facilitator-api/settle.md
- Casper x402 implementation: https://github.com/make-software/casper-x402
- CSPR.trade MCP: https://github.com/make-software/cspr-trade-mcp
- MCP authorization: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- Prototype discovery: `../prototype-discovery/2026-06-18-casper-agent-commerce-gateway.md`
