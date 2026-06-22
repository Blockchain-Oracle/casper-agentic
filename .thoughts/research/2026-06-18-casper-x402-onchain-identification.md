# Reality Research: Casper x402 On-Chain Identification

## Scope

This pass answers Abu's specific feasibility question: after a Casper x402 payment settles, can an explorer identify the transaction as x402 from Casper on-chain/explorer data alone, and what x402 context is lost unless the gateway/facilitator records it?

## Sources Checked

- Casper x402 repo: https://github.com/make-software/casper-x402
- Casper x402 README and API docs:
  - `README.md`
  - `docs/api-reference.md`
  - `x402/mechanisms/casper/exact/facilitator/scheme.go`
  - `examples/server/main.go`
- CSPR.cloud x402 facilitator docs:
  - https://docs.cspr.cloud/x402-facilitator-api/verify.md
  - https://docs.cspr.cloud/x402-facilitator-api/settle.md
  - https://docs.cspr.cloud/x402-facilitator-api/supported.md
  - GitBook `ask` responses on whether resource/payment metadata is on-chain.
- Casper docs-redux local clone:
  - `../raw/repos/docs-redux/condor/jsonrpc-comp/info_get_transaction.md`
  - `../raw/repos/docs-redux/condor/jsonrpc-comp/rpc-2.0/info_get_transaction.json.md`
  - `../raw/repos/docs-redux/versioned_docs/version-2.0.0/users/block-explorer.md`
- Context7 x402 docs lookup for `/coinbase/x402`.

## Verified Facts

### Casper x402 Settlement Is A CEP-18 Contract Call

- The Casper x402 README says the facilitator submits a Casper `transfer_with_authorization` deploy to the CEP-18 contract and waits for confirmation.
- The public CSPR.cloud `/settle` docs say the facilitator validates the signed payload, submits the payment transaction to Casper, pays gas from the facilitator account, and transfers CEP-18 tokens from payer to payee through `transfer_with_authorization`.
- The Casper x402 facilitator code builds a `TransactionV1` targeting the configured CEP-18 package hash, with custom entry point `transfer_with_authorization`.

### The On-Chain Transaction Contains Payment-Primitive Fields, Not Full x402 Context

The Casper x402 facilitator transaction builder adds these named arguments:

- `from`
- `to`
- `amount`
- `valid_after`
- `valid_before`
- `nonce`
- `public_key`
- `signature`

It also targets the configured CEP-18 package hash and uses the `transfer_with_authorization` entry point.

The code does not add `resource.url`, MCP tool name, API route description, provider name, pricing display string, or x402-specific label into the Casper transaction payload.

### The Facilitator Response Gives The Transaction Linkage

CSPR.cloud `/settle` docs say the response includes:

- `success`
- `transaction`: Casper deploy hash of the settlement transaction, 64 hex chars
- `network`: CAIP-2 network identifier
- `payer`: Casper account hash of the payer
- `errorReason` and `errorMessage` on failure

The docs include a successful example:

- `transaction`: `88461218a5e972fcda1d764d7cc4edb2e0c3a538123b97890d484f43c55935f5`
- `network`: `casper:casper-test`
- `payer`: `00048a54220799a48171743407c086668bdcc788e2a31e4185fe52d0682634f888`

### x402 Resource And Requirement Data Is Facilitator Request Context

CSPR.cloud `/verify` docs define:

- `paymentPayload.resource.url`: URL of the resource being accessed.
- `paymentPayload.accepted`: accepted payment option.
- `paymentRequirements`: required scheme, network, payTo, amount, asset, maxTimeoutSeconds, and extra token metadata.

The CSPR.cloud `ask` response states that `resource.url` and payment requirements are sent to the facilitator in the request body, and the docs do not state that they are encoded on-chain.

### Casper RPC Can Expose Transaction Body Details

Casper `info_get_transaction` docs say the result returns a `Transaction` and optional `ExecutionInfo`.

The example `TransactionV1` response includes:

- `header.chain_name`
- `header.initiator_addr`
- `body.args`
- `body.target`
- `body.entry_point`
- `execution_info.block_hash`
- `execution_info.block_height`
- `execution_info.execution_result`
- transfers/effects data when available

This means an explorer or indexer can inspect target, entry point, and named args, assuming the RPC/explorer exposes the transaction body.

### CSPR.live Is General Chain Visibility

Casper docs identify CSPR.live as a popular block explorer and describe block explorers as tools for transactions, account activity, blocks, validator activity, smart contract deployments, and Testnet behavior.

That is enough to deep-link the Casper transaction hash, but it is not the same as an x402 resource explorer.

## Inferences

- From Casper transaction data alone, the strongest signal for "this is x402" is a known x402 CEP-18 package hash plus entry point `transfer_with_authorization` plus the expected argument shape.
- This signal is not enough to reconstruct the full x402 payment story. The chain transaction does not appear to contain the protected resource URL, MCP tool name, API provider, original route, human description, or policy decision.
- A Casper x402 explorer should therefore be hybrid:
  1. Read/verify Casper transaction hash, network, payer, target package hash, entry point, args, execution status, and block data.
  2. Store/index x402 gateway/facilitator context at request time: resource URL, tool/route, provider, price, payment requirements, policy result, signed receipt, and tenant visibility.
  3. Deep-link to CSPR.live or CSPR.cloud raw transaction views for chain verification.
- If we only scan public Casper chain data, we can build a "likely x402 settlement detector" for registered x402 token contracts, but not a complete x402 explorer.
- If our platform controls the gateway/facilitator, we can build a much stronger explorer because we can bind `transaction` hash to the x402 request and receipt before returning the paid API/MCP result.

## Unknowns And Questions

- Whether the current Casper x402 facilitator emits or can be configured to emit x402 Offer/Receipt extension data in the `PAYMENT-RESPONSE` header for Casper.
- Whether the public CSPR.cloud facilitator has a public API endpoint for transaction/settlement lookup by transaction hash.
- Whether CSPR.cloud REST/streaming APIs expose enough decoded contract-call args for easy public indexing without running our own Casper node/RPC decoder.
- Whether the `Cep18x402` token contract package hash used in CSPR.cloud examples is stable across mainnet/testnet and intended as the canonical x402 asset.

## Not Included

- No implementation design.
- No claim that every `transfer_with_authorization` transaction is x402.
- No claim that full API/tool context is recoverable from Casper chain data alone.
- No test transaction was submitted during this pass.
