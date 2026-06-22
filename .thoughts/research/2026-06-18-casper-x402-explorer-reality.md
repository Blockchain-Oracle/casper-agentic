# Reality Research: Casper x402 Explorer Surface

## Scope

This pass evaluates Abu's proposed explorer addition: a Casper-focused x402 activity explorer that makes paid API/MCP calls, wallet policy decisions, x402 receipts, and Casper settlement hashes visible.

This is not a full block explorer proposal. It checks whether an x402-specific explorer layer is grounded in current ecosystem reality.

## Sources Checked

- Raw source notes: `../raw/casper-x402-explorer-2026-06-18.md`.
- x402scan live site: https://www.x402scan.com/
- x402scan GitHub: https://github.com/Merit-Systems/x402scan
- x402scan discovery docs: https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md
- x402 Offer & Receipt docs: https://docs.x402.org/extensions/offer-receipt
- Context7 x402 docs lookup for `/coinbase/x402`.
- Casper block explorer docs: https://docs.casper.network/users/block-explorer
- Casper x402 GitHub: https://github.com/make-software/casper-x402
- Casper x402 on-chain identification pass: `2026-06-18-casper-x402-onchain-identification.md`

## Verified Facts

### x402scan Proves The Explorer Category Exists

- `x402scan` describes itself as an ecosystem explorer for x402.
- Its README says it lets users explore x402 servers, see transaction volumes, and access resources through an embedded wallet.
- Its discovery docs describe OpenAPI-first discovery, then `/.well-known/x402`, then endpoint-only probing.
- For paid OpenAPI operations, x402scan expects `x-payment-info`, a `402` response, protocol metadata, and valid price metadata.

### Captured x402scan Repo Evidence Does Not Show Casper Support

- `apps/scan/src/types/chain.ts` lists Base, Solana, Polygon, and Optimism, with `SUPPORTED_CHAINS` set to Base and Solana.
- `apps/scan/src/lib/x402/chain-mapping.ts` maps EVM and Solana networks; no Casper mapping appeared in that file.
- `sync/transfers/trigger/chains` contains EVM and Solana sync paths; no Casper sync path appeared in the tree listing.
- `packages/external/facilitators/src/types.ts` defines Base, Polygon, and Solana networks; no Casper enum appeared.

Inference boundary: x402scan may evolve, but the checked repo surfaces did not show Casper as a supported x402 explorer chain.

### x402 Receipts Are A Real Audit Primitive

- x402 Offer & Receipt docs define signed offers on `402` responses and signed receipts on successful `200` responses.
- The docs frame those artifacts as cryptographic proof-of-interaction for reputation, dispute handling, auditing, and client confidence.
- Receipt data can include transaction hash, network, payer, and signed extension data.
- The extension supports EIP-712 and JWS signing formats.

### Casper Has General Explorers, Not x402-Specific Explorer UX

- Casper docs identify CSPR.live as a popular block explorer.
- Casper block explorers cover transactions, accounts, blocks, validator activity, smart contract deployments, and Testnet behavior.
- That visibility is raw chain visibility, not x402 resource visibility: tool name, provider, route, payment requirement, agent wallet policy, receipt, and call result are not the same object as a block/deploy page.

### Casper x402 Exposes Settlement Data The Explorer Can Use

- `make-software/casper-x402` facilitator `/settle` returns success/failure, network, payer, and the Casper transaction/deploy hash on success.
- The Casper x402 user guide points users to facilitator logs and Casper explorer for settlement errors.
- Path search of the Casper x402 repo did not reveal a dedicated explorer, scan, dashboard, history, receipt, or offer module.
- The actual Casper settlement transaction is a CEP-18 `transfer_with_authorization` call. It exposes payment-primitive data such as target package hash, entry point, payer/payee/amount authorization args, public key, nonce, and signature, but not the full x402 resource/tool context.

## Inferences

- Abu's explorer addition is grounded. It is not merely cosmetic; it solves proof, trust, and demo legibility for machine payments.
- The useful product is a Casper x402 activity explorer, not a general Casper block explorer replacement.
- The explorer should sit inside the gateway as a hybrid observability and receipt layer: it should read/verify Casper transaction data, but it must also index gateway/facilitator context such as paid resources, providers, agents, prices, policy decisions, receipts, settlement status, and Casper transaction hash.
- The explorer should deep-link to CSPR.live or another Casper explorer for raw transaction verification.
- The hackathon MVP should probably index our own gateway/facilitator events first. Indexing all Casper x402 activity would be attractive later, but it is not required to prove the product.
- A chain-only scanner can identify likely Casper x402 settlements only when it knows the x402 CEP-18 package hash and sees the expected `transfer_with_authorization` shape; it cannot reconstruct API/MCP tool context by itself.

## Product Consequence

The researched product should be framed as three pillars:

1. Provider Gateway: import APIs/MCPs, configure auth, price tools, and publish x402/MCP endpoints.
2. Agent Wallet Control Plane: create/connect Casper wallets, set spend limits, allowlists, and payment policies.
3. Casper x402 Explorer/Receipt Layer: show discovered resources, paid calls, policy outcomes, signed receipts, settlement status, and Casper transaction links.

This makes the prototype feel like infrastructure rather than a single wrapper script.

## Unknowns And Questions

- Whether Casper x402 already supports the x402 Offer & Receipt extension directly or needs an adapter/custom receipt envelope for the prototype.
- Whether the explorer should use a public feed, authenticated tenant views, or both.
- Whether all events should be public by default; provider API route names, prompts, and result snippets may expose sensitive information.
- Whether using `/.well-known/x402` and OpenAPI discovery is enough for Casper-specific indexing, or if Casper x402 should expose extra metadata.
- Whether public CSPR.cloud/CSPR.live APIs expose decoded transaction call args cleanly enough for a broader public Casper x402 scan.

## Not Included

- No full indexer architecture.
- No database schema.
- No implementation decision on CSPR.live, CSPR.cloud, or direct node RPC as the transaction data source.
- No claim that x402scan cannot add Casper in the future.
