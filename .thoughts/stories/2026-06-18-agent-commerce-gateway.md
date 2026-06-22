# Stories: Casper Agent Commerce Gateway

Date: 2026-06-18
Status: Updated after prototype discovery delta acceptance; research-backed plan created on 2026-06-19

> 2026-06-22 consistency note: these stories are historical. Use `2026-06-22-casper-gw-current-stories.md` for current product behavior. Registry/private-tool stories, Demo Sandbox stories, and Simulated/Local mode assumptions in this file were superseded by prototype reintegration.

Source spec: `../specs/2026-06-18-agent-commerce-gateway.md`

## Traceability

| Story | Primary Actor | Spec Coverage | Acceptance Coverage |
| --- | --- | --- | --- |
| 1. Provider creates a source | Provider | RQ-01, RQ-03, RQ-04, RQ-05 | AC-01, AC-02 |
| 2. Provider protects upstream credentials | Provider | RQ-07, RQ-08, RQ-09, RQ-47 | AC-02 |
| 3. Provider prices and publishes a tool | Provider | RQ-06, RQ-10, RQ-11, RQ-12, RQ-13 | AC-03 |
| 4. Operator separates client access from payment | Agent Operator | RQ-14, RQ-15, RQ-16, RQ-17 | AC-04 |
| 5. Operator configures a Casper wallet profile | Agent Operator | RQ-18, RQ-19, RQ-20 | AC-05 |
| 6. Operator defines spend policy | Agent Operator | RQ-21, RQ-22, RQ-23 | AC-05, AC-06, AC-07 |
| 7. Agent runs an allowed paid call | Agent Client | RQ-24, RQ-25, RQ-26 | AC-06, AC-08 |
| 8. Policy blocks an unsafe call | Agent Operator | RQ-22, RQ-23, RQ-31, RQ-50 | AC-06, AC-07 |
| 9. Receipt proves Casper settlement | Viewer/Judge | RQ-27, RQ-28, RQ-29, RQ-30, RQ-34 | AC-08, AC-09 |
| 10. Explorer explains full commerce context | Viewer/Judge | RQ-31, RQ-32, RQ-33, RQ-35, RQ-36, RQ-37 | AC-10 |
| 11. Registry exposes public paid tools | Agent Operator | RQ-38, RQ-39, RQ-40 | AC-11 |
| 12. Demo sandbox tells the end-to-end story | Viewer/Judge | RQ-02, RQ-41, RQ-42, RQ-43, RQ-44, RQ-45, RQ-49, RQ-50 | AC-01, AC-12 |
| 13. Operator copies client configuration | Agent Operator | RQ-12A, RQ-14, RQ-15, RQ-16, RQ-17 | AC-04 |
| 14. Operator adds registry tool to allowlist | Agent Operator | RQ-40A | AC-16 |
| 15. Viewer inspects settings and audit | Viewer/Judge | RQ-51, RQ-52, RQ-53 | AC-15, AC-17, AC-18 |
| 16. Sandbox routes outcome-specific receipts | Viewer/Judge | RQ-43A, RQ-43B, RQ-43C | AC-14 |

## Story 1: Provider Creates A Source

As a Provider,
I want to create a source from an API, OpenAPI spec, existing MCP server, or manual tool definition,
so that I can turn an existing capability into a paid agent tool.

### Acceptance Criteria

- The provider can create a named source inside a workspace or provider context.
- The provider can choose the source type.
- The product shows at least one normalized tool candidate or a clear empty/error state.
- Tool candidates show name, description, input shape, output hint, and upstream target metadata where available.
- The UI distinguishes live source discovery from mocked/manual prototype data.

### Scenarios

- Given a provider creates a manual source, when they add one tool definition, then the tool appears as a candidate for pricing.
- Given a source import fails or produces no tools, when the provider reviews the result, then the UI shows a useful reason and recovery path.

### Notes

This story does not require broad OpenAPI coverage. The MVP can prove one source path first while representing the other paths honestly.

## Story 2: Provider Protects Upstream Credentials

As a Provider,
I want upstream credentials to stay server-side,
so that agents can call my paid tool without seeing my API keys or provider secrets.

### Acceptance Criteria

- The provider can choose no-auth, static header, API-key header, or bearer-token credential mode.
- Saved credential values are masked after save.
- Upstream credentials are not shown in hosted endpoint config.
- Upstream credentials are not shown in agent responses, receipts, explorer views, exports, or user-facing logs.
- The UI labels provider upstream credentials separately from client access tokens and wallet/payment authorization.

### Scenarios

- Given a provider saves an API key, when they reopen the credential panel, then the raw key is not displayed.
- Given an agent copies endpoint configuration, when the config is shown, then provider upstream credentials are absent.

### Notes

This story is a trust boundary. It must remain visible through later design and implementation.

## Story 3: Provider Prices And Publishes A Tool

As a Provider,
I want to enable a tool, set its Casper x402 price, and publish a hosted endpoint,
so that agents can pay for that tool through the gateway.

### Acceptance Criteria

- The provider can enable or disable candidate tools.
- Enabled tools can receive pricing fields for network, scheme, asset, amount, payee account, and timeout.
- The product supports or represents `casper:casper-test`, `exact`, and CEP-18 asset configuration for the Casper proof path.
- The provider can publish a hosted endpoint only after required fields are valid or intentionally mocked.
- Validation covers amount, asset, payee account, network, and timeout before publish.
- Published endpoint details include copyable MCP/client configuration.
- Public registry visibility can be toggled separately from endpoint publish state.

### Scenarios

- Given a priced tool has an invalid amount, asset, payee account, network, or timeout, when the provider tries to publish, then the product blocks publishing and identifies the invalid field.
- Given a priced tool is valid, when the provider publishes it, then endpoint details become available for copy.

### Notes

Pricing is not only UI metadata. It later feeds payment requirements and receipt proof.

## Story 4: Operator Separates Client Access From Payment

As an Agent Operator,
I want MCP clients to authenticate to the gateway separately from wallet payment,
so that login/client access is not confused with spending authority.

### Acceptance Criteria

- The endpoint detail labels MCP/client access separately from wallet/payment authorization.
- OAuth 2.1/Bearer is shown as the target model for remote MCP auth.
- If static scoped tokens are shown for MVP, they are labeled as client access tokens.
- Client access can be scoped to workspace, endpoint, and allowed tools.
- The UI never labels a client access token as a payment key, wallet key, or signing secret.

### Scenarios

- Given an operator views endpoint setup, when they copy MCP client config, then they can see it authenticates client access only.
- Given a static token fallback is used, when the operator inspects it, then it is scoped and clearly distinct from wallet payment authorization.

### Notes

This is the direct answer to the API-key/OAuth confusion: there are multiple auth layers, not one universal API key.

## Story 5: Operator Configures A Casper Wallet Profile

As an Agent Operator,
I want to create or connect a Casper wallet profile,
so that an agent can pay for allowed tools through a known wallet identity.

### Acceptance Criteria

- The operator can add at least one Casper wallet profile.
- The wallet profile shows network, account identity, signing mode, and balance/funding status or instructions.
- The selected signing mode is visible and unambiguous.
- The accepted prototype path labels `Hosted encrypted signer` as the demo signing mode unless replaced by a later architecture decision.
- The profile does not imply production custody unless that mode is explicitly chosen later.

### Scenarios

- Given the operator adds a demo wallet, when the profile is created, then it is labeled as demo/test or simulated as appropriate.
- Given funding status is unavailable, when the wallet is shown, then the UI gives a clear status or instruction instead of fake balance certainty.
- Given the prototype uses hosted encrypted signing, when a viewer inspects the wallet, then the UI treats it as a demo mode and does not claim final custody architecture.

### Notes

The exact wallet mode remains an open question. The story requires clarity, not a predetermined custody architecture.

## Story 6: Operator Defines Spend Policy

As an Agent Operator,
I want to define spend limits and allowlists,
so that the agent cannot spend outside approved rules.

### Acceptance Criteria

- The operator can configure max spend per call.
- The operator can configure max spend per day/session.
- The operator can allow providers, tools, networks, and assets.
- Optional manual approval mode is represented if included.
- Policy checks are shown as happening before payment signing or settlement.

### Scenarios

- Given a tool price is under the max per call and the tool is allowed, when the operator previews the call, then policy status is allowed.
- Given a tool price exceeds max per call, when the operator previews the call, then policy status is blocked before payment.

### Notes

Policy is a product control, not just a warning message.

## Story 7: Agent Runs An Allowed Paid Call

As an Agent Client,
I want to call an allowed paid tool,
so that I can receive the protected result after policy and payment conditions succeed.

### Acceptance Criteria

- The call reaches a hosted endpoint.
- The product shows or handles x402 payment requirements.
- The wallet/signing path creates or represents payment authorization.
- The facilitator verify outcome is recorded or represented.
- The facilitator settle outcome is recorded or represented.
- The protected result appears only after the required policy/payment states succeed.

### Scenarios

- Given a call is allowed by policy, when payment verify and settle succeed, then the product shows the tool result and links to a receipt.
- Given verify fails, when the call ends, then the product shows the verify failure and does not show a successful protected result.

### Notes

The story can be fulfilled by live, local, or clearly labeled simulated mode during prototype stages.

## Story 8: Policy Blocks An Unsafe Call

As an Agent Operator,
I want unsafe calls to be blocked before settlement,
so that policy enforcement prevents unintended spending.

### Acceptance Criteria

- A call outside policy is blocked before payment signing or settlement.
- The blocked call produces an auditable event or receipt.
- The blocked event includes the policy reason.
- The blocked event has no settlement transaction/deploy hash.
- The explorer and sandbox distinguish blocked from failed-settlement states.

### Scenarios

- Given a tool is not on the allowlist, when an agent attempts the call, then the call is blocked and no settlement is attempted.
- Given a call exceeds a daily/session limit, when the agent attempts the call, then the receipt records the limit reason.

### Notes

Blocked is a successful policy outcome, not a generic error.

## Story 9: Receipt Proves Casper Settlement

As a Viewer/Judge,
I want a successful paid call to include Casper-linked proof,
so that I can verify the product's Casper contribution.

### Acceptance Criteria

- Successful live settlement records transaction/deploy hash, network, payer, payee, amount, asset, and facilitator source.
- Settlement failure records machine-readable reason and human-readable message when available.
- Live settlement is never claimed without a real transaction/deploy hash.
- Simulated or local settlement is visibly labeled.
- Raw Casper proof links or verification status appear when available.

### Scenarios

- Given a live Testnet settlement succeeds, when the receipt is opened, then the Casper proof section shows the real transaction/deploy hash.
- Given the flow is simulated, when the receipt is opened, then the receipt is labeled simulated and does not claim live Casper proof.

### Notes

This story protects against fake proof. It should be preserved through design and build.

## Story 10: Explorer Explains Full Commerce Context

As a Viewer/Judge,
I want the explorer to show gateway context, x402 context, and Casper proof separately,
so that I can understand exactly what is proven where.

### Acceptance Criteria

- The explorer has a receipt feed and receipt detail.
- Receipt detail separates gateway context, policy decision, x402 verify/settle context, and raw Casper proof.
- The explorer does not imply chain-only data proves the tool, resource URL, provider workspace, price rule, or policy decision.
- Receipts can be filtered by provider, tool, wallet, status, network, and time.
- Blocked, failed, simulated, and settled states are visually distinct.

### Scenarios

- Given a successful receipt, when a judge opens it, then they can identify which data came from the gateway and which data came from Casper proof.
- Given a blocked receipt, when it appears in the feed, then it is not confused with settled or failed-settlement receipts.

### Notes

The explorer is a receipt and observability layer for the gateway, not a replacement for CSPR.live.

## Story 11: Registry Exposes Public Paid Tools

As an Agent Operator,
I want to browse public paid tools,
so that I can decide which tools my agents may call.

### Acceptance Criteria

- Public tools appear in a registry.
- Registry items show provider, tool name, description, price, network, asset, auth type, and usage instructions.
- Private tools do not appear in the public registry.
- Registry usage instructions can be copied.
- A public tool can be considered for allowlisting.
- A public tool can be added to an allowlist or policy candidate list.

### Scenarios

- Given a provider marks a tool public, when an operator opens the registry, then the tool is visible with pricing and auth information.
- Given a provider marks a tool private, when the registry is viewed, then the private tool is hidden.
- Given an operator adds a public tool to the allowlist, when the tool is viewed again, then the registry reflects the allowlist state.

### Notes

Registry is discovery for paid tools, not a replacement for the provider configuration surface.

## Story 12: Demo Sandbox Tells The End-To-End Story

As a Viewer/Judge,
I want one guided sandbox to run the full paid-call journey,
so that I can understand the product quickly and evaluate the Casper proof path.

### Acceptance Criteria

- The sandbox can start with one provider, one tool, one wallet, and one test call.
- The sandbox shows request, policy, verify, settle, result, and receipt states.
- Policy decision appears before settlement.
- Live, local, and simulated modes are clearly labeled.
- Failure states are explicit for provider upstream failure, client-auth failure, policy block, verify failure, settlement failure, and raw Casper proof unavailable.
- The final receipt is reachable from the sandbox.
- The sandbox supports at least settled, policy-block, and settlement-failure scenarios.
- A sandbox outcome links to a matching receipt for that outcome.

### Scenarios

- Given demo mode is simulated, when the judge runs the sandbox, then every simulated state is labeled and the flow still explains where real integration will occur.
- Given live mode is available, when the paid call succeeds, then the sandbox ends with a receipt containing real Casper proof.
- Given the selected sandbox scenario is policy block, when the viewer opens the receipt, then the receipt is blocked and has no settlement proof.
- Given the selected sandbox scenario is settlement failure, when the viewer opens the receipt, then the receipt is failed and not confused with policy block or settled.

### Notes

This is the main hackathon demonstration story. It should drive the first prototype path.

## Story 13: Operator Copies Client Configuration

As an Agent Operator,
I want endpoint setup instructions for Cursor, Claude Desktop, and custom clients,
so that I can connect an MCP client without confusing client access with wallet payment authority.

### Acceptance Criteria

- Hosted endpoint details show the endpoint URL.
- Client configuration examples are copyable for Cursor, Claude Desktop, and custom/curl clients unless a later implementation decision removes one with justification.
- The examples use a client access token or OAuth/Bearer model only.
- The UI labels static token fallback as scoped client access, not wallet/payment authorization.
- The screen warns that client access cannot authorize payment.

### Scenarios

- Given an operator copies Cursor configuration, when they inspect the copied setup, then it includes the endpoint and client access header without provider upstream secrets or wallet keys.
- Given an operator switches to custom/curl config, when the config appears, then it labels the bearer value as scoped client access.

### Notes

This story comes from the accepted Casper GW prototype endpoint screen.

## Story 14: Operator Adds Registry Tool To Allowlist

As an Agent Operator,
I want to add a discovered public paid tool to an allowlist,
so that agent spend policy can begin from registry discovery instead of manual entry only.

### Acceptance Criteria

- Registry tools show provider, tool, description, price, network, asset, auth type, and endpoint status.
- Registry tools can be searched.
- Private tools are absent from the public registry.
- A registry tool has a copy config action.
- A registry tool has an add-to-allowlist or equivalent policy-candidate action.
- The add-to-allowlist state is visible after the action.

### Scenarios

- Given a public `get_cspr_quote` tool appears in the registry, when the operator adds it to the allowlist, then the registry shows that it is in the allowlist.
- Given a private tool exists, when the public registry is opened, then the private tool is not shown.

### Notes

Registry "live" or "published" labels must not be confused with live settlement/proof mode.

## Story 15: Viewer Inspects Settings And Audit

As a Viewer/Judge,
I want to inspect settings and audit events,
so that I can verify the product keeps trust boundaries visible after configuration.

### Acceptance Criteria

- Settings show provider upstream secrets as masked/write-only.
- Settings show client access tokens or OAuth apps with scopes and active/expired status.
- Settings show facilitator mode, source, network, and asset.
- Settings show wallet signing mode without exposing private keys or seed phrases.
- Audit log shows events for source creation, credential changes, tool pricing, endpoint publish, policy changes, policy blocks, settlement failure, and settlement success.
- Fixture secret values do not use live-looking prefixes such as `sk_live`.
- Any cdr-kit/Story/CDR design-system provenance is kept out of product-facing Casper Gateway semantics unless Abu explicitly accepts that visual base.

### Scenarios

- Given a judge opens Settings and Audit, when they inspect upstream credentials, then only masked values, scopes, and last-used metadata are visible.
- Given a client token is expired, when Settings is inspected, then the token status is visibly different from active client access.
- Given an audit event references settlement success, when the viewer opens the related receipt, then receipt proof status determines whether live Casper proof is real or simulated.

### Notes

This story is supporting evidence for the hackathon proof and security posture.

## Story 16: Sandbox Routes Outcome-Specific Receipts

As a Viewer/Judge,
I want each sandbox outcome to open the matching receipt,
so that the demo cannot accidentally show a successful receipt for a blocked or failed call.

### Acceptance Criteria

- The sandbox supports at least three scenarios: settles, policy block, and settlement failure.
- Each scenario creates or selects a receipt with the matching status.
- Blocked sandbox receipts show policy block and no Casper transaction/deploy hash.
- Settlement-failure receipts show policy allowed, verify result where available, settlement failure, and no successful Casper proof.
- Settled receipts show simulated/local/live proof labeling according to the selected mode.
- Verify failure, upstream failure, and client-auth failure are represented at minimum in explorer fixtures.

### Scenarios

- Given the sandbox scenario is policy block, when the viewer opens the receipt, then the receipt status is blocked and x402 settlement is not attempted.
- Given the sandbox scenario is settlement failure, when the viewer opens the receipt, then the receipt status is settlement failure and not policy block.
- Given the sandbox scenario is settled in simulated mode, when the viewer opens the receipt, then placeholder proof is labeled simulated and not broadcast.

### Notes

This story closes the main prototype-discovery gap from `Casper Gateway.dc.html`.

## Open Questions

- Should the first implementation path keep OpenAPI import as the visible provider source, or switch to manual source for speed?
- Should `Hosted encrypted signer` remain the MVP wallet signing mode after implementation architecture review?
- Should the designer prototype show live Testnet, local, simulated, or a mode switch?
- Which registry content should be public in the demo?
- Which raw Casper proof URL/status format should be shown before implementation selects the verification path?
- Does Abu want separate provider and operator workspaces in the prototype, or one combined demo workspace?
- Should registry endpoint-state labels avoid the word `Live` while the global settlement/proof mode is Simulated?
