# Prototype Discovery: Casper Agent Commerce Gateway

Date: 2026-06-18
Status: Accepted for Context Engineering prototype-delta step; spec/story/quality deltas applied on 2026-06-19

## Accepted Delta Application

The prototype discovery deltas were applied to:

- Spec: `../specs/2026-06-18-agent-commerce-gateway.md`
- Stories: `../stories/2026-06-18-agent-commerce-gateway.md`
- Quality profile: `../quality/2026-06-18-agent-commerce-gateway-quality-profile.md`

Accepted as product requirements:

- Use `/Users/abu/Downloads/API Design System Scope (1)/Casper Gateway.dc.html` as the authoritative prototype evidence.
- Keep global environment modes explicit: Simulated, Local, Live Testnet.
- Keep endpoint/provider liveness separate from settlement/proof liveness.
- Treat `Hosted encrypted signer` as the prototype-default demo wallet signing mode, not final production custody architecture.
- Require sandbox settled, policy-block, and settlement-failure outcomes.
- Require sandbox outcome links to route to matching receipts.
- Represent verify failure, upstream failure, and client-auth failure at least in explorer/receipt fixtures.
- Include registry add-to-allowlist behavior.
- Include Settings/Audit as a visible supporting surface.
- Require mock credentials and fixture tokens to avoid live-looking prefixes such as `sk_live`.
- Treat cdr-kit/Story/CDR design-system provenance as inspiration only unless Abu explicitly accepts it as the Casper Gateway visual base.

Not accepted as implementation yet:

- Copying the `.dc.html` prototype into the future app.
- Starting scaffold, implementation, verification, or handoff from this report alone.

## Prototype Inspected

Authoritative prototype:

- `/Users/abu/Downloads/API Design System Scope (1)/Casper Gateway.dc.html`

User clarification:

- Abu clarified that the updated prototype is the Casper GW / Casper Gateway version.
- Treat `Casper Gateway.dc.html` as the current prototype.
- Treat `Casper Gateway (v1 sidebar).dc.html`, `Casper Gateway-print-16ycpjl.dc.html`, and exported screenshots as secondary evidence only.

Downloaded package contents:

- Static prototype HTML:
  - `Casper Gateway.dc.html`
  - `Casper Gateway (v1 sidebar).dc.html`
  - `Casper Gateway-print-16ycpjl.dc.html`
- Runtime support:
  - `support.js`
- Screenshots:
  - `dash.png`
  - `01-import.png`
  - `02-import.png`
  - `01-pricing.png`
  - `02-pricing.png`
  - `ep.png`
  - `wallet.png`
  - `sandbox.png`
  - `01-exp.png`
  - `02-exp.png`
  - `01-reg.png`
  - `02-reg.png`
  - `mobile.png`
- Design system export:
  - `_ds/cdr-kit-design-system-b3bc5571-372a-4a81-938d-86cd31baa5e7/`

Important provenance note:

- The included design-system README is for `cdr-kit`, Story Protocol, and Confidential Data Rails.
- For this project, use that folder as visual-system evidence only unless Abu explicitly approves adopting the `cdr-kit` design language for Casper Gateway.
- Product meaning must remain Casper Agent Commerce Gateway, not CDR, Story Protocol, or cdr-kit.

Runtime verification performed:

- Rendered the authoritative `Casper Gateway.dc.html` in local Google Chrome through Playwright.
- Desktop viewport: `1440x900`.
- Mobile viewport: `390x844`.
- Saved current rendered evidence:
  - `.thoughts/prototype-discovery/casper-gw-updated-desktop-dashboard.png`
  - `.thoughts/prototype-discovery/casper-gw-updated-mobile-dashboard.png`

Current project artifacts compared:

- Quality profile: `../quality/2026-06-18-agent-commerce-gateway-quality-profile.md`
- Spec: `../specs/2026-06-18-agent-commerce-gateway.md`
- Stories: `../stories/2026-06-18-agent-commerce-gateway.md`
- Designer brief: `../design/2026-06-18-designer-brief.md`

## Screen Map

### App Shell

The updated prototype uses a top navigation on desktop and a compact hamburger shell on mobile.

Global app shell elements:

- Product mark and name: `casper-gw`.
- Navigation:
  - Operations.
  - Import.
  - Pricing.
  - Endpoint.
  - Wallet.
  - Sandbox.
  - Explorer.
  - Registry.
  - Settings.
- Global mode switch:
  - Simulated.
  - Local.
  - Live Testnet.
- Run demo action.

The mode switch is persistent and directly supports the designer-brief requirement that live/local/simulated status remain visible.

### Operations

Purpose:

- Show the whole gateway state across all five surfaces.

Observed content:

- Guided demo with a five-step loop:
  - Import source.
  - Price and publish.
  - Wallet policy.
  - Run paid call.
  - Inspect receipt.
- Stats:
  - Active providers.
  - Published tools.
  - Agent wallets.
  - Paid calls today.
  - Blocked by policy.
  - Settled volume.
- Latest receipts table.
- Facilitator panel:
  - CSPR.cloud x402.
  - `casper:casper-test`.
  - `exact`.
  - CEP-18 TUSDC.
- Three trust boundaries:
  - Provider upstream credentials.
  - MCP client access auth.
  - x402 wallet/payment auth.

Discovery:

- This screen strongly matches the approved product story.
- The original downloaded `dash.png` screenshot is stale or broken because it showed a blank dashboard body, but the authoritative HTML renders the dashboard correctly.

### Source Import

Purpose:

- Create a provider source and discover tool candidates.

Observed content:

- Source type selector:
  - OpenAPI.
  - Remote MCP.
  - Manual route.
- Source name and description.
- Source URL placeholder.
- Upstream authentication modes:
  - No auth.
  - Static header.
  - API-key header.
  - Bearer token.
- Server-side-only upstream credential warning.
- Test upstream connection action.
- Simulate failure action.
- Tool discovery states:
  - Empty.
  - Loading.
  - Error.
  - Success with three discovered tools.

Discovery:

- The prototype makes provider upstream auth clearly separate from client and wallet auth.
- It exposes source discovery as an interactive state machine rather than a static form.

### Tool Pricing And Publish

Purpose:

- Enable tools, price them with Casper x402 settings, and publish the endpoint.

Observed content:

- Tool rows:
  - `get_cspr_quote`.
  - `get_market_depth`.
  - `list_pairs`.
- Enable toggles.
- Enabled/priced/published chips.
- Pricing drawer.
- Pricing fields:
  - Network: `casper:casper-test`.
  - Scheme: `exact`.
  - Asset: CEP-18 TUSDC.
  - Amount.
  - Payee account.
  - Timeout.
- Registry visibility toggle:
  - Public.
  - Private.
- Publish button.
- Amount validation.

Discovery:

- The pricing drawer is a strong interaction pattern for implementation.
- Validation currently covers amount clearly. Asset, payee account, network, and timeout validation are implied by the designer brief but not fully represented in the prototype.

### Hosted Endpoint

Purpose:

- Show the published MCP/x402 endpoint and explain how clients connect.

Observed content:

- Hosted URL.
- Endpoint status chips:
  - Live.
  - Public registry.
  - MCP + x402.
- Warning panel:
  - Client access token is not a wallet key.
- Three separated panels:
  - Client Access.
  - Provider Upstream Secrets.
  - Payment Wallet Auth.
- Client configuration tabs:
  - Cursor.
  - Claude Desktop.
  - Custom / curl.
- Copy URL/config actions.
- Tools on endpoint.

Discovery:

- This screen directly resolves Abu's API-key/OAuth concern.
- It makes the difference between client access, provider upstream credentials, and wallet payment authorization visible without relying on docs.

### Wallet Control Plane

Purpose:

- Manage Casper agent wallets and spend policy.

Observed content:

- Wallet list:
  - `agent-trader-01`.
  - `research-readonly`.
- Wallet status:
  - Active.
  - Funding pending.
- Wallet detail:
  - Account hash.
  - Network.
  - Signing mode.
  - Balance.
- Spend policy:
  - Max per call.
  - Daily limit.
  - Allowed providers.
  - Allowed tools.
  - Allowed network and asset.
  - Manual approval toggle.
- Policy preview:
  - Would allow.
  - Would block.
- Recent activity.

Discovery:

- The prototype implicitly chooses `Hosted encrypted signer` as the primary wallet signing mode for the demo.
- The current spec left wallet signing mode open. This is a proposed spec delta, not an automatic decision.

### Demo Agent Sandbox

Purpose:

- Run a complete paid-call journey.

Observed content:

- Scenario selector:
  - Settles.
  - Policy block.
  - Settle fails.
- Agent wallet.
- Provider tool.
- Input parameters.
- Policy preview before payment signing.
- Execution timeline:
  - Tool request received.
  - Policy evaluation.
  - x402 verify.
  - x402 settle.
  - Tool result returned.
  - Receipt written.
- Result box:
  - Awaiting run.
  - Running.
  - Settled.
  - Blocked by policy.
  - Settlement failed.
- Placeholder proof label for simulated settlement.

Discovery:

- The sandbox expresses policy-before-payment correctly.
- The scenario set is strong for the first demo, but verify failure, upstream failure, and MCP auth failure are explorer states only, not sandbox-run scenarios.
- The sandbox receipt link currently opens the settled receipt id even after blocked or failed scenarios. Implementation should route to scenario-specific receipts.

### Casper x402 Explorer

Purpose:

- Inspect receipt feed and receipt detail.

Observed content:

- Filters:
  - All.
  - Settled.
  - Blocked.
  - Failed.
- Receipt statuses:
  - Settled.
  - Blocked.
  - Verify fail.
  - Settle fail.
  - Upstream 502.
  - MCP auth fail.
- Receipt detail layers:
  - Gateway Context.
  - Policy Decision.
  - x402 Verify / Settle.
  - Casper Proof.
- Copy actions for ids, endpoints, account hashes, and proof links.
- Raw Casper proof unavailable state.
- Warning that chain proof covers payment only, not provider/tool/resource/policy context.

Discovery:

- This is the strongest proof-specific screen.
- It correctly avoids implying that chain-only data proves the full commerce context.
- The default explorer state may need a better "select a receipt" or default-selected receipt behavior, depending on demo flow.

### Discovery / Registry

Purpose:

- Browse public paid tools and add them to policy allowlists.

Observed content:

- Search public paid tools.
- Notice that private tools are not listed.
- Public tool rows:
  - `get_cspr_quote`.
  - `get_weather_risk`.
  - `get_price_feed`.
- Provider, description, network, asset, auth type, and price.
- Copy config action.
- Add to allowlist action.

Discovery:

- The registry is more than display: it implies an allowlist workflow.
- The "LIVE" badges can be ambiguous while global environment is `Simulated`. They should be renamed or scoped as endpoint status, not settlement/proof status.

### Settings And Audit

Purpose:

- Inspect trust boundaries, credentials, facilitator config, wallet signing, and audit log.

Observed content:

- Provider upstream secrets:
  - Masked.
  - Scope.
  - Last used.
- Client access tokens / OAuth apps:
  - Active.
  - Expired.
  - Scopes.
- Facilitator configuration:
  - Mode.
  - Source.
  - Network.
  - Asset.
- Wallet signing:
  - Hosted encrypted signer.
  - Keys never stored in UI.
- Audit log:
  - Settlement succeeded.
  - Spend blocked by policy.
  - Settlement failed.
  - Policy changed.
  - Endpoint published.
  - Tool priced.
  - Credentials changed.
  - Source created.

Discovery:

- Settings and audit should become an explicit product surface or supporting story.
- Audit events are important enough to carry into implementation planning.

## User Flows

### Guided Demo Flow

1. Start on Operations.
2. Follow guided demo steps.
3. Import source.
4. Price and publish tool.
5. Configure wallet policy.
6. Run paid call in sandbox.
7. Inspect receipt in explorer.

### Provider Onboarding Flow

1. Choose source type.
2. Enter source name, description, and URL.
3. Configure upstream auth.
4. Test upstream connection.
5. View discovered tools.
6. Continue to pricing.

### Pricing And Publish Flow

1. Enable tool.
2. Open pricing drawer.
3. Confirm Casper network, scheme, CEP-18 asset, amount, payee, and timeout.
4. Choose public/private registry visibility.
5. Publish endpoint.

### Endpoint Client Setup Flow

1. Open hosted endpoint.
2. Copy endpoint URL.
3. Inspect client access auth.
4. Copy Cursor, Claude Desktop, or custom config.
5. Confirm client token is not wallet/payment authorization.

### Wallet Policy Flow

1. Select wallet profile.
2. Review network, account hash, signing mode, and balance/funding state.
3. Configure spend policy.
4. Preview allow/block result for a candidate call.
5. Review wallet activity.

### Sandbox Flow

1. Select scenario.
2. Review wallet, tool, amount, and input.
3. Confirm policy preview before signing.
4. Run call.
5. Watch request -> policy -> verify -> settle -> result -> receipt timeline.
6. Open receipt.

### Explorer Flow

1. Filter receipts.
2. Select receipt.
3. Inspect Gateway Context.
4. Inspect Policy Decision.
5. Inspect x402 Verify / Settle.
6. Inspect Casper Proof.
7. Copy proof identifiers or raw proof link.

### Registry Flow

1. Search public tools.
2. Inspect price, network, asset, auth type, and provider.
3. Copy config.
4. Add tool to allowlist.

### Settings And Audit Flow

1. Inspect upstream secrets without revealing values.
2. Inspect client access token scopes and expiry.
3. Inspect facilitator mode.
4. Inspect wallet signing mode.
5. Review audit events.

## Revealed Product Requirements

- The app should have a persistent app shell with global environment mode.
- Environment mode must be a first-class product concept:
  - Simulated.
  - Local.
  - Live Testnet.
- The dashboard should expose a guided demo, not only metrics.
- The dashboard should show the three trust boundaries.
- Provider source import should support OpenAPI, Remote MCP, and Manual route options in the UI.
- Provider source import should include test connection states.
- Pricing should use a drawer or equivalent focused panel.
- Pricing should expose network, scheme, asset, amount, payee, timeout, and registry visibility.
- Hosted endpoint should expose copyable Cursor, Claude Desktop, and custom/curl configs.
- Hosted endpoint should make "client access token is not a wallet key" unavoidable.
- Wallet policy should support a policy preview before payment.
- Wallet mode should be visible on every wallet profile.
- The first prototype assumes `Hosted encrypted signer`; this needs acceptance or replacement.
- Sandbox must run at least three scenarios:
  - Settles.
  - Policy block.
  - Settle fails.
- Explorer must support failed states beyond the sandbox:
  - Verify fail.
  - Settle fail.
  - Upstream failure.
  - MCP auth failure.
- Receipt detail must keep the four proof layers separate.
- Registry should support add-to-allowlist, not only copy config.
- Settings and Audit should be included in MVP scope or explicitly deferred.
- Audit log events should cover provider, policy, endpoint, settlement, and credential changes.

## Revealed Technical Requirements

- Global mode state shared across all screens.
- Route or screen state for nine surfaces.
- Responsive app shell:
  - desktop top navigation,
  - mobile hamburger navigation.
- Reusable status chip model for settled, blocked, verify failed, settle failed, upstream failed, auth failed, pending, active, expired, and simulated states.
- Copy-to-clipboard state with temporary "copied" feedback.
- Import wizard state machine:
  - form,
  - loading,
  - error,
  - success.
- Pricing drawer state.
- Tool enable/disable state.
- Amount validation and future validation for payee, asset, timeout, and network.
- Registry visibility state.
- Wallet selection state.
- Manual approval toggle.
- Policy preview computation.
- Sandbox scenario and timeline state.
- Receipt filter and selected receipt state.
- Receipt detail derivation from receipt status.
- Registry search and allowlist state.
- Audit log event rendering.
- Data fixtures that can later be replaced by API/server data.
- Idempotent paid-call identifiers and request ids for receipts.
- Clear separation between UI state and live settlement proof.

## Data Model Candidates

Provider:

- `id`
- `name`
- `workspace_id`
- `status`
- `created_at`

ProviderSource:

- `id`
- `provider_id`
- `type`
- `name`
- `description`
- `source_url`
- `discovery_status`
- `last_tested_at`
- `last_error`

UpstreamCredential:

- `id`
- `provider_source_id`
- `mode`
- `header_name`
- `secret_ref`
- `masked_preview`
- `scope`
- `last_used_at`
- `created_at`
- `rotated_at`

ToolDefinition:

- `id`
- `provider_source_id`
- `name`
- `description`
- `input_schema`
- `output_hint`
- `upstream_target`
- `enabled`
- `published`

ToolPricing:

- `id`
- `tool_id`
- `network`
- `scheme`
- `asset`
- `amount`
- `payee_account`
- `timeout_seconds`
- `registry_visibility`

HostedEndpoint:

- `id`
- `provider_id`
- `slug`
- `url`
- `status`
- `auth_model`
- `public_registry`
- `created_at`

ClientAccessToken:

- `id`
- `endpoint_id`
- `client_name`
- `token_hash`
- `scopes`
- `status`
- `expires_at`
- `last_used_at`

OAuthApp:

- `id`
- `endpoint_id`
- `client_id`
- `redirect_uris`
- `scopes`
- `status`

WalletProfile:

- `id`
- `owner_id`
- `label`
- `network`
- `account_hash`
- `signing_mode`
- `balance_status`
- `balance_amount`
- `status`

SpendPolicy:

- `id`
- `wallet_profile_id`
- `max_per_call`
- `daily_limit`
- `session_limit`
- `allowed_provider_ids`
- `allowed_tool_ids`
- `allowed_networks`
- `allowed_assets`
- `manual_approval_required`
- `enabled`

PaidCallAttempt:

- `id`
- `request_id`
- `endpoint_id`
- `tool_id`
- `client_id`
- `wallet_profile_id`
- `mode`
- `status`
- `input_preview`
- `created_at`
- `completed_at`

PolicyDecision:

- `id`
- `paid_call_attempt_id`
- `decision`
- `matched_rules`
- `failed_rule`
- `reason`
- `evaluated_at`

X402PaymentRecord:

- `id`
- `paid_call_attempt_id`
- `payment_requirements`
- `verify_status`
- `verify_error`
- `settle_status`
- `settle_error`
- `facilitator_source`
- `created_at`

CasperProof:

- `id`
- `paid_call_attempt_id`
- `network`
- `deploy_or_transaction_hash`
- `payer`
- `payee`
- `amount`
- `asset`
- `proof_status`
- `raw_proof_url`
- `confirmed_at`

Receipt:

- `id`
- `paid_call_attempt_id`
- `status`
- `gateway_context`
- `policy_decision_id`
- `x402_payment_record_id`
- `casper_proof_id`
- `created_at`

RegistryTool:

- `id`
- `tool_id`
- `provider_id`
- `endpoint_id`
- `description`
- `price`
- `network`
- `asset`
- `auth_type`
- `status`

AuditEvent:

- `id`
- `actor_id`
- `workspace_id`
- `kind`
- `target_type`
- `target_id`
- `summary`
- `metadata`
- `created_at`

FacilitatorConfig:

- `id`
- `mode`
- `source`
- `network`
- `asset`
- `status`

## API And Event Candidates

Candidate product APIs:

- `GET /api/dashboard`
- `POST /api/provider-sources`
- `POST /api/provider-sources/:id/test`
- `POST /api/provider-sources/:id/discover`
- `GET /api/provider-sources/:id/tools`
- `PATCH /api/tools/:id`
- `PUT /api/tools/:id/pricing`
- `POST /api/endpoints`
- `GET /api/endpoints/:id`
- `GET /api/endpoints/:id/client-config?client=cursor`
- `POST /api/client-access-tokens`
- `POST /api/wallet-profiles`
- `GET /api/wallet-profiles`
- `PATCH /api/wallet-profiles/:id/policy`
- `POST /api/policy/preview`
- `POST /api/demo/run`
- `POST /api/calls`
- `GET /api/calls/:id`
- `GET /api/receipts`
- `GET /api/receipts/:id`
- `GET /api/registry/tools`
- `POST /api/registry/tools/:id/allowlist`
- `GET /api/audit-events`
- `GET /api/facilitator/config`

Candidate MCP endpoint:

- `/mcp/:provider_slug`

Candidate events:

- `provider_source.created`
- `provider_source.connection_test.started`
- `provider_source.connection_test.succeeded`
- `provider_source.connection_test.failed`
- `tools.discovered`
- `tool.enabled`
- `tool.disabled`
- `tool.priced`
- `endpoint.published`
- `endpoint.visibility_changed`
- `client_access_token.created`
- `client_access_token.expired`
- `wallet_profile.created`
- `wallet_profile.funding_status_changed`
- `spend_policy.changed`
- `paid_call.received`
- `paid_call.client_auth_failed`
- `policy.allowed`
- `policy.blocked`
- `x402.verify.started`
- `x402.verify.succeeded`
- `x402.verify.failed`
- `x402.settle.started`
- `x402.settle.succeeded`
- `x402.settle.failed`
- `provider_upstream.failed`
- `tool_result.returned`
- `receipt.created`
- `casper_proof.attached`
- `casper_proof.unavailable`

## Auth, Permissions, And Security Implications

The prototype correctly treats auth as three separate boundaries:

1. Provider upstream credentials.
2. MCP client access auth.
3. x402 wallet/payment authorization.

Security implications:

- Provider upstream credentials must be write-only after save.
- Provider upstream secrets must never be returned to clients, receipts, exports, explorer views, or browser-visible state.
- Static client tokens must be hashed at rest and scoped to endpoint and tools.
- OAuth/Bearer should remain the target remote MCP auth model.
- Wallet signing mode must be explicit and must not imply production custody before architecture is decided.
- Client access token expiry and scopes are product-visible states.
- Policy blocks must stop before signing and settlement.
- Settlement failure must be separate from policy block and verify failure.
- Live proof must not be claimed without a real Casper transaction/deploy hash.
- Simulated proof must stay labeled in dashboard, sandbox, explorer, and receipts.

Prototype-specific security concern:

- The prototype source includes mock values with `sk_live_...` naming in upstream credential examples.
- Even though the browser masks those fields, the strings exist in the prototype HTML.
- Future prototypes and implementation fixtures should use obviously fake values such as `mock_api_key_redacted` or `sk_test_mock_redacted`, not live-looking secret prefixes.

## State And Edge Cases

Covered or represented:

- Source import empty state.
- Source import loading state.
- Source import upstream 401 error state.
- Source import success state with discovered tools.
- Pricing disabled/unpriced/published states.
- Pricing amount invalid state.
- Public/private registry visibility.
- Endpoint copied/copyable states.
- Client access token active/expired states.
- Wallet active/funding-pending states.
- Wallet balance unavailable state.
- Policy would-allow state.
- Policy would-block state.
- Manual approval toggle.
- Sandbox idle/running/done/blocked/failed states.
- Explorer filters and empty filter state.
- Explorer selected receipt detail.
- Receipt statuses:
  - settled,
  - blocked,
  - verify_failed,
  - settle_failed,
  - upstream_failed,
  - auth_failed.
- Raw Casper proof unavailable.
- Simulated placeholder proof.
- Registry search empty state.
- Add-to-allowlist toggle.
- Audit event list.
- Mobile dashboard rendering.

Gaps or weak areas:

- Exported `dash.png` and `mobile.png` appear stale or broken relative to the updated HTML.
- Mobile was runtime-verified for dashboard, but not all screens.
- Sandbox has settled, policy-block, and settle-failed scenarios only.
- Verify failure, upstream failure, and MCP auth failure appear in explorer receipts but are not runnable sandbox scenarios.
- Sandbox receipt link appears to open the settled receipt even for non-settled scenarios.
- Pricing validation is complete for amount only; payee, asset, timeout, and account-format validation need explicit handling.
- Registry "LIVE" badges are ambiguous under global `Simulated` mode.
- Live Testnet mode still says placeholder proof, which is honest, but it should remain visually blocked or clearly incomplete until real proof exists.
- No explicit screen for OAuth app creation/authorization, only endpoint/settings representation.
- No explicit "402 payment required" challenge view is shown for the paid call protocol boundary.
- No explicit provider source "no tools discovered" recovery beyond testing connection.
- No explicit receipt export/download state.

## Target-stack Translation

Current quality profile says the workspace is research-only and no app stack has been selected.

Do not copy the `.dc.html` prototype or its custom runtime directly into the future app unless the accepted stack is static HTML. Treat the prototype as product, interaction, and visual evidence.

When implementation planning begins, use Context7 before selecting or using framework/library docs.

Likely route map if the eventual stack is React/Next:

- `/` or `/dashboard` - Operations.
- `/provider/import` - Source Import.
- `/provider/pricing` - Tool Pricing and Publish.
- `/provider/endpoints/:id` - Hosted Endpoint.
- `/operator/wallets` - Wallet Control Plane.
- `/sandbox` - Demo Agent Sandbox.
- `/explorer` - Casper x402 Explorer.
- `/explorer/:receiptId` - Receipt detail.
- `/registry` - Discovery / Registry.
- `/settings/audit` - Settings and Audit.

Likely component map:

- `AppShell`
- `TopNav`
- `MobileNav`
- `ModeSwitcher`
- `StatusChip`
- `CopyButton`
- `GuidedDemo`
- `MetricTile`
- `ReceiptTable`
- `TrustBoundaryPanel`
- `SourceImportForm`
- `UpstreamAuthPanel`
- `ToolDiscoveryPanel`
- `ToolPricingTable`
- `PricingDrawer`
- `EndpointHeader`
- `ClientConfigTabs`
- `WalletList`
- `WalletDetail`
- `SpendPolicyEditor`
- `PolicyPreview`
- `SandboxScenarioTabs`
- `ExecutionTimeline`
- `ReceiptFeed`
- `ReceiptDetail`
- `ReceiptProofLayer`
- `RegistrySearch`
- `RegistryToolRow`
- `SettingsBoundaryPanel`
- `AuditLog`

Likely domain modules:

- `providers`
- `sourceDiscovery`
- `upstreamCredentials`
- `toolPricing`
- `clientAccess`
- `walletProfiles`
- `spendPolicies`
- `paidCalls`
- `x402Settlement`
- `receipts`
- `registry`
- `audit`
- `demoFixtures`

Implementation should first preserve the prototype's product model with mock data, then replace individual boundaries with real services after tests exist.

## Spec Deltas

Proposed spec deltas, not yet applied:

- Add explicit global environment mode semantics:
  - Simulated means no live chain settlement.
  - Local means local facilitator/no chain proof unless proven otherwise.
  - Live Testnet requires a real transaction/deploy hash before proof can be claimed.
- Add requirement that endpoint "live/published" status must be visually distinct from settlement/proof liveness.
- Add `Hosted encrypted signer` as the prototype-default wallet signing mode if Abu accepts it, or keep it as an explicit unresolved choice.
- Add requirement that sandbox receipt links must open scenario-specific receipts.
- Add requirement that sandbox either:
  - includes verify failure, upstream failure, and MCP auth failure scenarios, or
  - clearly scopes those states to explorer/receipt fixtures only.
- Add requirement for settings/audit as either MVP scope or explicitly deferred supporting scope.
- Add requirement that registry "add to allowlist" is part of operator workflow.
- Add requirement that mock secrets and fixture tokens must never use live-looking prefixes.
- Add explicit validation requirements for payee account, asset, network, and timeout, not only amount.
- Add optional requirement for copyable Cursor, Claude Desktop, and custom/curl client configs.

## Story Deltas

Proposed story deltas, not yet applied:

- Add a story: Operator copies endpoint configuration for a specific MCP client.
- Add a story: Operator adds a public registry tool to a wallet/tool allowlist.
- Add a story: Viewer inspects Settings and Audit to confirm trust boundaries.
- Extend sandbox story to require scenario-specific receipts.
- Extend sandbox story or explorer story to cover verify failure, upstream failure, and MCP auth failure deliberately.
- Extend provider pricing story with validation for account, asset, timeout, and network fields.
- Extend wallet story with funding-pending/read-only wallet behavior.
- Add responsive prototype acceptance to relevant stories if mobile matters for submission.

## Plan Deltas

When the Context Engineering flow reaches planning, include these plan deltas:

- Use `Casper Gateway.dc.html` as prototype evidence, not the older sidebar/print variants.
- Regenerate or ignore stale exported screenshots before implementation handoff.
- Begin implementation with the smallest complete loop:
  - dashboard shell,
  - one provider source,
  - one priced tool,
  - one endpoint,
  - one wallet policy,
  - one sandbox paid call,
  - one receipt detail.
- Preserve the three auth boundaries from the endpoint/settings screens before adding live integration.
- Preserve the four receipt proof layers before attempting real x402 settlement.
- Build fixtures for all receipt statuses early so the explorer remains honest.
- Treat `Hosted encrypted signer` as a selectable/replaceable demo mode until Abu accepts wallet architecture.
- Add scenario-specific receipt routing before browser demo acceptance.
- Add desktop and mobile screenshot checks after the first implemented UI exists.
- Use Context7 before choosing or using any current framework, MCP SDK, Casper SDK, x402 library, database, or auth package docs.

## Quality Profile Deltas

Proposed quality-profile deltas, not yet applied:

- Add a prototype evidence gate:
  - render updated prototype HTML in desktop and mobile,
  - verify dashboard is nonblank,
  - verify all nine screens are reachable,
  - verify global mode indicator is visible.
- Add visual regression/screenshot checks for implemented app:
  - desktop dashboard,
  - mobile dashboard,
  - endpoint auth boundary,
  - sandbox,
  - explorer receipt detail.
- Add a fixture-secrets rule:
  - no fixture value may use live-looking secret names or prefixes.
- Add a brand/design-system provenance rule:
  - if the cdr-kit-derived visual system is adopted, remove or quarantine CDR/Story/cdr-kit references from project-facing docs and assets.
- Add a no-static-copy rule:
  - prototype HTML is design evidence; production UI must be translated into the chosen stack and tested.
- Add a receipt honesty gate:
  - simulated/local/live proof labels must remain accurate across dashboard, sandbox, explorer, registry, and settings.

## Open Questions

- Is the cdr-kit-derived design system acceptable as the visual base for Casper Gateway, or should it be treated only as inspiration?
- Is the product name `Casper Gateway`, `casper-gw`, or `Casper Agent Commerce Gateway` for the hackathon submission?
- Should `Hosted encrypted signer` be accepted as the prototype-default wallet signing mode?
- Should the first demo tool remain `get_cspr_quote`, or should it be changed to a more RWA/AI-agent-specific tool?
- Should sandbox include verify failure, upstream failure, and MCP auth failure as runnable scenarios?
- Should registry "LIVE" mean endpoint published/live, or should the label be renamed to avoid conflict with global settlement mode?
- Should the prototype be revised before acceptance, or are the deltas acceptable to carry into the spec/story/quality delta step?
- Should Settings and Audit be MVP scope, or a support screen kept for prototype/demo only?

## Evidence

File inventory:

```bash
find "/Users/abu/Downloads/API Design System Scope (1)" -maxdepth 3 -type f -print
```

Authoritative HTML:

```text
/Users/abu/Downloads/API Design System Scope (1)/Casper Gateway.dc.html
```

Secondary HTML:

```text
/Users/abu/Downloads/API Design System Scope (1)/Casper Gateway (v1 sidebar).dc.html
/Users/abu/Downloads/API Design System Scope (1)/Casper Gateway-print-16ycpjl.dc.html
```

Rendered evidence saved from local Chrome:

```text
.thoughts/prototype-discovery/casper-gw-updated-desktop-dashboard.png
.thoughts/prototype-discovery/casper-gw-updated-mobile-dashboard.png
```

Downloaded screenshots inspected:

```text
/Users/abu/Downloads/API Design System Scope (1)/screenshots/dash.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/01-import.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/02-import.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/01-pricing.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/02-pricing.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/ep.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/wallet.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/sandbox.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/01-exp.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/02-exp.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/01-reg.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/02-reg.png
/Users/abu/Downloads/API Design System Scope (1)/screenshots/mobile.png
```

Runtime screen reachability was verified in local Google Chrome for:

- Operations.
- Import.
- Pricing.
- Endpoint.
- Wallet.
- Sandbox.
- Explorer.
- Registry.
- Settings.

Key HTML evidence:

- Navigation and screen flags are in `Casper Gateway.dc.html`.
- Receipt statuses include `settled`, `blocked`, `verify_failed`, `settle_failed`, `upstream_failed`, and `auth_failed`.
- Sandbox scenarios include `settled`, `blocked`, and `failed`.
- Receipt detail construction separates Gateway Context, Policy Decision, x402 Verify / Settle, and Casper Proof.
- Wallet data includes `Hosted encrypted signer` and `View-only signer`.
- Endpoint config includes Cursor, Claude Desktop, and custom/curl examples.
