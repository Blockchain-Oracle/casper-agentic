# Designer Prompt V2: Fix Registry, Wallet, And Test Console

Use this prompt only after reading:

- `/Users/abu/dev/hackathon/casper-agentic/.thoughts/prototype-reintegration/2026-06-21-casper-gw-redesign-v2-audit.md`
- `/Users/abu/Downloads/Casper docs UI redesign feedback (1)/Casper Gateway.dc.html`

The current prototype has good public explorer direction, but the app model is still wrong. Correct the design without implementing app code.

## Main Correction

Remove the top-level `Tool Registry` from MVP.

Do not design private tools, private registries, or hidden private tools. Casper GW does not support private tools as an accepted MVP product concept.

The app should focus on:

- Sources.
- My Tools.
- Hosted Endpoint.
- Wallets & Policies.
- Paid Tool Test Console.
- Settings.
- Audit.

## Product Language

Use:

- `My Tools`
- `Draft`
- `Selected`
- `Priced`
- `Published`
- `Unpublished`
- `Hosted endpoint`
- `Client access required`
- `Wallet spend policy`
- `Allowed endpoint/tool`

Do not use:

- `Tool Registry`
- `Private tool`
- `Private registry`
- `Private tools hidden`
- `Public registry`
- `List in public registry`

## Correct App IA

Public:

- `/`
- `/explorer`
- `/explorer/receipts/:receiptId`

Authenticated app:

- `/app`
- `/app/sources`
- `/app/tools`
- `/app/endpoints`
- `/app/wallets`
- `/app/test-console`
- `/app/settings`
- `/app/audit`

Do not include `/app/registry` in MVP.

## Correct Flow

The product flow is:

`Sources -> My Tools -> Hosted Endpoint -> Wallets & Policies -> Paid Tool Test Console -> Public Explorer`

The designer should make this flow obvious.

## Sources Screen

Design this for provider source connection and tool discovery.

Must include:

- Source type: OpenAPI, Remote MCP, Manual route.
- Source URL/upload/route.
- Upstream auth.
- Server-side credential safety note.
- Connect/discover action.
- Discovered tools.
- Unsupported operations.
- Tool schema preview.
- Continue to My Tools.

Must not include:

- Pricing.
- Registry visibility.
- Public/private tool labels.

## My Tools Screen

Design this for provider-owned tools from the connected source.

Must include:

- Source context.
- Tool list.
- Tool schema.
- Select/expose tool.
- Price per call.
- Publish/unpublish to hosted endpoint.
- Publish status.

Must not include:

- Registry toggle.
- Public/private chips.
- Private tool copy.

## Hosted Endpoint Screen

Must include:

- Hosted MCP/x402 URL.
- Published tools on that endpoint.
- Client auth config.
- x402 payment requirement.
- Copy config for MCP clients.
- Network/asset/facilitator.

This is where "my published tools" are visible.

## Wallets & Policies Screen

Design wallet policy as spend control for paid tool calls, not generic token-send policy.

Must include:

- Casper wallet/account.
- Funding status.
- Signing mode.
- Max per call.
- Optional session/day budget.
- Allowed endpoint/tool/provider.
- Manual approval before signing.
- Policy evaluation before payment.
- Wallet activity.

Do not source allowlist options from a registry. Source them from hosted endpoint tools, discovered endpoint tools, or manual endpoint/tool entries.

## Paid Tool Test Console

This is the most important app correction.

It should behave like an MCP/x402 endpoint runner:

1. Choose target:
   - `My hosted endpoint`
   - `Paste MCP/x402 URL`
2. Enter or select endpoint URL.
3. Click `Discover tools`.
4. Show discovered tools and payment requirements.
5. Select a tool.
6. Generate inputs from the selected tool schema.
7. If the tool needs no input, show `No input required`.
8. Choose wallet/policy.
9. Run policy pre-check.
10. Sign/pay with x402 on Casper Testnet.
11. Show tool result.
12. Show receipt and link to public explorer.

Do not show a generic `tool input` textarea by default. Raw JSON can exist as an advanced/debug option only.

Do not use scenario buttons as product controls. If the prototype needs success/block/fail states, show them as design states, not user-facing controls.

## Public Explorer

Keep the public explorer direction:

- Public.
- No sign-in.
- No wallet connection.
- No app sidebar.
- Search receipts/deploy hashes/wallets/providers/tools.
- Public receipt details.
- Redact private inputs, outputs, credentials, tokens, and wallet-policy internals.

The screenshot in the current download still shows old simulated modal language. Ignore that screenshot if it conflicts with the current source and this prompt.

## Deliverables

Return:

1. Revised high-fidelity prototype.
2. Screen map.
3. Updated route/access model.
4. List of removed registry/private-tool concepts.
5. Description of test-console discovery/input behavior.
6. Remaining mocks/fixtures clearly labeled as design fixtures only.

