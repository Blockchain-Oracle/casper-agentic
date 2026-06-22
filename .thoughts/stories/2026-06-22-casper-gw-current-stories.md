# Stories: Casper GW Current Product Stories

Date: 2026-06-22
Status: Supersedes `2026-06-18-agent-commerce-gateway.md` stories for current product behavior.

Source spec: `../specs/2026-06-22-casper-gw-current-spec.md`

## Traceability

| Story | Actor | Spec Coverage |
| --- | --- | --- |
| 1. Connect source and discover tools | Provider | RQ-07 to RQ-10 |
| 2. Protect upstream credentials | Provider | RQ-11, RQ-56, RQ-59 |
| 3. Price and publish hosted endpoint | Provider | RQ-12 to RQ-15 |
| 4. Separate client access from payment | Agent Operator | RQ-16 to RQ-19 |
| 5. Connect and fund agent wallet | Agent Operator | RQ-20 to RQ-26 |
| 6. Define spend policy | Agent Operator | RQ-27 to RQ-29 |
| 7. Run paid tool from endpoint console | Agent Client | RQ-30 to RQ-39 |
| 8. Complete Casper x402 settlement | Agent Client / Provider | RQ-40 to RQ-46 |
| 9. Block unsafe call before payment | Agent Operator | RQ-28, RQ-29, RQ-50 |
| 10. Inspect public receipt/explorer | Viewer/Judge | RQ-47 to RQ-55 |
| 11. Inspect settings and audit | Viewer/Judge | RQ-56 to RQ-60 |
| 12. Produce corrected design prototype | Designer / Reviewer | RQ-61 to RQ-65 |

## Story 1: Connect Source And Discover Tools

As a Provider,
I want to connect an API, OpenAPI spec, manual route, or remote MCP server,
so that I can discover candidate tools to expose through Casper GW.

### Acceptance Criteria

- Provider can choose a source type.
- Provider can enter the required source location/configuration.
- Source discovery returns candidate tools or a clear empty/error state.
- Candidate tools show id, description, support status, input schema, and upstream target.
- Unsupported operations are shown as unsupported, not silently hidden.
- Discovery does not require pricing or wallet setup first.

### Scenarios

- Given a valid source, when discovery succeeds, then candidate tools appear as draft/selectable tools.
- Given discovery fails, when the provider inspects the result, then the UI shows the reason and recovery action.

### Notes

MVP only needs one real source path if the remaining paths are honestly represented.

## Story 2: Protect Upstream Credentials

As a Provider,
I want upstream credentials to stay server-side,
so that paid agents can use my tool without seeing my provider secrets.

### Acceptance Criteria

- Provider can configure no-auth, API key/header, bearer, or static header modes where supported.
- Saved credentials are masked.
- Raw provider credentials never appear in endpoint config, receipts, explorer, exports, browser-visible state, or user-facing logs.
- UI labels upstream credentials separately from MCP client auth and wallet/payment authorization.

### Scenarios

- Given a provider saves an API key, when the credential panel is reopened, then the raw key is hidden.
- Given an operator copies MCP client config, when they inspect it, then it contains client access only and no provider upstream secret.

### Notes

This is a trust boundary story. It is not optional polish.

## Story 3: Price And Publish Hosted Endpoint

As a Provider,
I want to select a tool, set its x402 price, and publish a hosted MCP/x402 endpoint,
so that agents can call the tool through a payment-gated route.

### Acceptance Criteria

- Provider can select a discovered tool for exposure.
- Provider can configure amount, asset, network, scheme, payee, and timeout.
- Casper Testnet x402 settings are visible for the proof path.
- Invalid pricing blocks publishing with a field-level reason.
- Published endpoint details show the endpoint URL, published tools, client auth model, and payment requirements.
- Endpoint published/live language is not used as payment settlement proof.

### Scenarios

- Given a selected tool has a valid price, when the provider publishes it, then it appears in the hosted endpoint tool list.
- Given price config is missing asset or payee, when publish is attempted, then publish is blocked.

### Notes

No public/private registry visibility toggle belongs in this MVP story.

## Story 4: Separate Client Access From Payment

As an Agent Operator,
I want MCP clients to authenticate separately from wallet/payment authorization,
so that client access does not become spending authority.

### Acceptance Criteria

- Endpoint setup shows scoped bearer token MVP or OAuth/Bearer target clearly.
- Client access is labeled as client access only.
- Client config examples do not include wallet keys, payment secrets, or provider upstream credentials.
- UI states that client auth cannot authorize payment.
- Client access can be scoped by workspace, endpoint, and tool where implemented.

### Scenarios

- Given a user copies Cursor or Claude Desktop config, when they inspect it, then it contains only endpoint and client access fields.
- Given a paid call is attempted, when client auth succeeds, then policy/payment still run separately.

### Notes

This story resolves the earlier API-key/OAuth confusion.

## Story 5: Connect And Fund Agent Wallet

As an Agent Operator,
I want to connect or provision a Casper agent wallet and fund it,
so that it can actually pay for allowed tools.

### Acceptance Criteria

- Operator can add/select a wallet profile.
- Wallet shows public account/address, network, signing mode, and custody limitation.
- Wallet funding journey exposes receive address, copy action, Testnet faucet or transfer instructions, confirming state, and ready state.
- Readiness distinguishes CSPR gas and CEP-18 payment asset.
- Readiness is based on real balance/allowance evidence in implementation, not a static flag.
- Faucet already-used or funding-failed states are represented.
- The UI never asks for seed phrase/private key.

### Scenarios

- Given a wallet is newly created and unfunded, when the operator opens funding, then they can copy the address and see funding instructions.
- Given funding is detected, when balances update, then the wallet moves to ready only when gas, payment asset, and spend headroom are sufficient.
- Given faucet is exhausted, when the operator requests funding again, then the UI shows a truthful recovery path.

### Notes

This is the main product gap found by the latest design review.

## Story 6: Define Spend Policy

As an Agent Operator,
I want to define spend limits and allowed tools/endpoints,
so that an agent cannot spend outside approved boundaries.

### Acceptance Criteria

- Operator can set max per call.
- Operator can view or set session/day budget/headroom.
- Operator can allow endpoint/tool/provider and network/asset.
- Manual approval or kill-switch state is represented if included.
- Policy preview runs before payment.
- Policy block has a clear reason and creates no Casper transaction.

### Scenarios

- Given a call is under max and allowed, when policy is evaluated, then the call is allowed to continue to signing/payment.
- Given a call exceeds max per call, when policy is evaluated, then the call is blocked before signing.

### Notes

This is spend policy for agent tool calls, not a generic token-send policy.

## Story 7: Run Paid Tool From Endpoint Console

As an Agent Client or Operator,
I want to point the console at an MCP/x402 endpoint, discover tools, choose inputs, and run a paid call,
so that I can prove the gateway loop end to end.

### Acceptance Criteria

- Console target can be the hosted endpoint or a pasted MCP/x402 URL.
- Tool discovery runs before tool selection.
- Tool inputs appear only after a tool is selected.
- Tools with no inputs show `No input required`.
- Raw JSON is advanced/debug only.
- Wallet/policy is selected before running.
- Timeline shows policy pre-check before signing/payment.
- Console can end in paid, policy-blocked, payment-failed, upstream-failed, proof-pending, or no-transaction states.

### Scenarios

- Given an endpoint with tools, when discovery succeeds, then tools and payment requirements are shown.
- Given a selected tool has schema fields, when it is selected, then field inputs appear.
- Given the selected tool has no fields, when it is selected, then no input area is shown.

### Notes

This replaces the old demo sandbox story.

## Story 8: Complete Casper x402 Settlement

As a Provider and Agent Client,
I want an allowed paid call to settle through Casper x402,
so that the result is backed by Casper Testnet proof.

### Acceptance Criteria

- Gateway obtains/handles x402 payment requirements.
- Wallet/signing path creates payment authorization.
- Facilitator verify result is recorded.
- Facilitator settle result is recorded.
- Protected result is returned only after required policy/payment states succeed.
- Successful live settlement records a real Casper Testnet deploy hash.
- Failure records reason/message where available.

### Scenarios

- Given policy allows and payment succeeds, when settle completes, then the receipt includes real network, payer, payee, amount, asset, facilitator, and deploy hash.
- Given verify or settle fails, when the attempt ends, then no successful proof is claimed.

### Notes

The UI must support a visible settling/pending state.

## Story 9: Block Unsafe Call Before Payment

As an Agent Operator,
I want unsafe calls to stop before wallet signing or settlement,
so that policy prevents unintended spending.

### Acceptance Criteria

- Policy block happens before signing/payment.
- Blocked attempt records policy reason.
- Blocked attempt has no Casper transaction/deploy hash.
- Public receipt and audit treat policy block as distinct from payment failure.

### Scenarios

- Given a tool is not allowed, when an agent attempts the call, then policy blocks and no payment is attempted.
- Given a call exceeds spend headroom, when the attempt is inspected, then the receipt shows the exact policy reason.

### Notes

Policy block is a successful control outcome.

## Story 10: Inspect Public Receipt And Explorer

As a Viewer or Judge,
I want to inspect public receipts without signing in,
so that I can verify the Casper contribution and understand what is proven.

### Acceptance Criteria

- `/explorer` and receipt details are public.
- Explorer has no authenticated app sidebar and does not require wallet connection.
- Explorer supports search/filter by receipt id, deploy hash, provider, tool, wallet/account, status, network, and time where available.
- Receipt detail separates gateway context, policy decision, x402 verify/settle, and Casper proof.
- Public detail redacts private request inputs, outputs, provider credentials, MCP tokens, and policy internals.
- Real deploy hashes link to `testnet.cspr.live` or another accepted raw Casper explorer.

### Scenarios

- Given a successful receipt, when a judge opens it, then they can identify the raw Casper proof and what came from gateway records.
- Given a blocked receipt, when it is opened, then it shows no Casper transaction.

### Notes

The explorer does not claim chain-only data proves tool/resource/provider/policy.

## Story 11: Inspect Settings And Audit

As a Viewer or Operator,
I want to inspect settings and audit events,
so that trust boundaries and system actions are visible.

### Acceptance Criteria

- Settings show provider credential boundary, client access model, facilitator, network, and signing mode.
- Settings mask secrets and do not expose wallet/private key material.
- Audit records source, pricing, publish, policy, payment, proof, settings, and credential events.
- Audit distinguishes policy blocks, payment failures, proof pending, auth failures, and upstream failures.
- Fixture tokens do not use live-looking prefixes.

### Scenarios

- Given a provider credential is saved, when audit/settings are viewed, then the raw secret is absent.
- Given a payment fails, when audit is viewed, then the failure reason is distinct from policy block.

### Notes

Settings and audit are proof-supporting surfaces, not decorative admin pages.

## Story 12: Produce Corrected Design Prototype

As a Designer or Reviewer,
I want the high-fidelity prototype to represent the current product structure,
so that implementation does not inherit stale registry, sandbox, or simulated-mode mistakes.

### Acceptance Criteria

- Authenticated app uses a top-header structure unless Abu approves otherwise.
- Wallet/funding/policy is represented as a tabbed modal.
- Funding is a drawer or stepper with connect, address, faucet/transfer, confirming, ready, and failure states.
- Add source is a modal wizard.
- Tool pricing/publish is a focused drawer.
- Settings is tabbed.
- Public explorer remains public and unauthenticated.
- Prototype mocks are labeled and must be reintegrated before implementation planning.

### Scenarios

- Given a fresh designer reads only the reset brief, when they design, then they do not create a top-level registry/private-tool model.
- Given the designer includes successful payment states, when those states are mocked, then they are labeled as fixtures and do not fake a deploy hash.

### Notes

Design output is still evidence. Prototype discovery and reintegration remain required after a new prototype.

## Open Questions

- Which signing mode is accepted for the first build?
- Which CEP-18 Testnet asset/package is accepted?
- Does Abu want optional public discovery/catalog after the core loop works?
- Which provider source path is first for real implementation?
