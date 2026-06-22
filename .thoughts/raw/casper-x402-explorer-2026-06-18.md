# Raw Notes: Casper x402 Explorer Surface

Date captured: 2026-06-18

Purpose: preserve source evidence for Abu's proposed explorer addition: a Casper-focused x402 explorer/receipt surface inside or beside the agent commerce gateway.

## x402scan

Sources:

- Live site: https://www.x402scan.com/
- GitHub: https://github.com/Merit-Systems/x402scan
- Discovery spec: https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md

Observed metadata:

- GitHub repo: `Merit-Systems/x402scan`, TypeScript, 349 stars, 244 forks, created 2025-09-23, pushed 2026-06-16.
- README describes x402scan as an ecosystem explorer for x402.
- README says it lets users explore x402 servers, see transaction volumes, and directly access resources through an embedded wallet.
- Monorepo structure includes a Next.js scan app, sync service, and shared facilitator configuration.

Discovery facts:

- x402scan discovery recommends OpenAPI first, then `/.well-known/x402`, then endpoint-only registration.
- For paid OpenAPI operations, it expects `x-payment-info`, a `402` response, `x-payment-info.protocols`, and valid price metadata.
- Endpoint-only registration works when probing returns a parseable x402 `402` challenge.
- Registration flow discovers resources, probes URLs, parses challenges, registers valid routes, and marks invalid routes with explicit failure reasons.

Supported-chain evidence from repo files:

- `apps/scan/src/types/chain.ts` lists enum values for Base, Solana, Polygon, and Optimism, but `SUPPORTED_CHAINS` is `[Chain.BASE, Chain.SOLANA]`.
- `apps/scan/src/lib/x402/chain-mapping.ts` maps EVM networks and Solana networks; no Casper network mapping appears in that file.
- `sync/transfers/trigger/chains` contains `evm` and `solana`; no Casper sync path appeared in the tree listing.
- `packages/external/facilitators/src/types.ts` defines Network enum values for Base, Polygon, and Solana; no Casper enum appears.

Inference boundary:

- x402scan is a real x402 explorer, but captured repo evidence does not show Casper as a supported chain in the checked app/types/sync/facilitator surfaces.

## x402 Offers And Receipts

Sources:

- x402 docs: https://docs.x402.org/extensions/offer-receipt
- Context7 docs lookup: `/coinbase/x402` query for signed offers/receipts and settlement status.

Relevant facts:

- x402 Offer & Receipt extension signs offers on `402` responses and receipts on `200` responses.
- Docs describe the artifacts as cryptographic proof-of-interaction that can support reputation, dispute resolution, auditing, and client confidence.
- Receipts can include transaction hash, network, payer, and signed receipt extension data.
- The extension supports EIP-712 and JWS signing formats.

## Casper Block Explorers

Source:

- Casper docs: https://docs.casper.network/users/block-explorer

Relevant facts:

- Casper docs describe block explorers as tools for tracking transactions, account balances, blocks, validator activity, and smart contract deployments.
- Casper docs identify CSPR.live as a popular Casper explorer.
- This is generic blockchain visibility, not x402-specific resource/payment visibility.

## Casper x402 Repo Explorer Evidence

Source:

- https://github.com/make-software/casper-x402

Checked:

```bash
gh api 'repos/make-software/casper-x402/git/trees/master?recursive=1' --jq '.tree[].path' | rg -i 'explorer|ui|scan|dashboard|history|receipt|offer'
```

Result:

- Matched docs and Docker/build files only:
  - `docs/user-guide.md`
  - `infra/docker/build-csprclick-x402.Dockerfile`
  - `infra/docker/build-deployer.Dockerfile`
  - `infra/docker/build-facilitator.Dockerfile`
  - `infra/docker/build-server.Dockerfile`
- No dedicated Casper x402 explorer, scan, dashboard, history, receipt, or offer module was visible from path search.

Relevant Casper x402 API facts:

- Facilitator `/settle` returns success, Casper transaction/deploy hash, network, and payer.
- Settlement failure response includes reason/message, empty transaction, network, and payer.
- User guide says settlement errors can be checked in facilitator logs and the Casper explorer.
- CSPR.cloud `/settle` docs say settlement validates a signed payment payload, submits the payment transaction to Casper, the facilitator pays gas, and CEP-18 tokens move from payer to payee through `transfer_with_authorization`.
- CSPR.cloud `/verify` docs say `paymentPayload.resource.url` identifies the resource being accessed, and `paymentRequirements` includes scheme, network, payTo, amount, asset, timeout, and extra token metadata.
- CSPR.cloud docs/ask response says `resource.url` and payment requirements are request/facilitator context, and the docs do not state that they are encoded on-chain.
- Casper x402 facilitator code builds a `TransactionV1` with named args `from`, `to`, `amount`, `valid_after`, `valid_before`, `nonce`, `public_key`, and `signature`, targeting the CEP-18 package hash and entry point `transfer_with_authorization`.

## Casper Transaction Visibility

Sources:

- CSPR.cloud settle docs: https://docs.cspr.cloud/x402-facilitator-api/settle.md
- CSPR.cloud verify docs: https://docs.cspr.cloud/x402-facilitator-api/verify.md
- Casper `info_get_transaction` docs in `docs-redux`: `../raw/repos/docs-redux/condor/jsonrpc-comp/rpc-2.0/info_get_transaction.json.md`

Relevant facts:

- Casper `info_get_transaction` returns a `Transaction` and optional `ExecutionInfo`.
- The documented `TransactionV1` response includes `header.chain_name`, `header.initiator_addr`, `body.args`, `body.target`, `body.entry_point`, and execution info with block/result/transfer/effect data.
- That means an indexer can inspect contract target, entry point, and named args when transaction body data is available.
- It does not mean the chain alone contains the x402 resource URL, API/MCP tool name, or policy decision.

## Product Implication

The explorer surface should probably be:

- A Casper x402 activity explorer inside the gateway.
- Focused on x402 resources, paid MCP/API tools, payment requirements, policy decisions, receipts, settlement status, payer/provider, and Casper transaction hash.
- Hybrid, not chain-only: use Casper transaction data to verify settlement, and gateway/facilitator records to explain what was purchased.
- Linked out to CSPR.live or another Casper block explorer for raw chain verification.

It should not try to replace a general Casper block explorer.
