# Casper Docs Redux Map

Source base: local clone `../raw/repos/docs-redux` at commit `34b2071b550feef46fcdbb40bb87f1a711df8958` and research brief `../research/2026-06-17-docs-redux-repo-map.md`.

## Repo Role

- `docs-redux` is the official Casper documentation repository for `docs.casper.network`.
- It is a Docusaurus repo with current docs under `docs/`, separate Condor/Casper 2.0 docs under `condor/`, and versioned docs under `versioned_docs/`.
- README says a documentation rework is underway; treat the repo as primary evidence but verify implementation details against upstream package repos before coding.

## Decision-Relevant Docs

- Development environment:
  - `docs/developers/prerequisites.md`
  - `docs/developers/essential-crates.md`
- Rust/Wasm contracts:
  - `docs/developers/writing-onchain-code/getting-started.md`
  - `docs/developers/writing-onchain-code/simple-contract.md`
  - `docs/developers/writing-onchain-code/testing-contracts.md`
  - `docs/developers/writing-onchain-code/emitting-contract-events.md`
- dApps and SDK:
  - `docs/developers/dapps/index.md`
  - `docs/developers/dapps/sdk/script-sdk.md`
  - `docs/developers/dapps/signing-a-transaction.md`
  - `docs/developers/dapps/monitor-and-consume-events.md`
- CLI and verification:
  - `docs/developers/cli/sending-transactions.md`
  - `docs/developers/cli/installing-contracts.md`
  - `docs/developers/cli/querying-global-state.md`
  - `docs/developers/cli/calling-contracts.md`
- Token standards:
  - `docs/resources/tokens/cep18/*`
  - `docs/resources/tokens/cep78/*`
- Casper 2.0 context:
  - `condor/index.md`
  - `condor/transactions.md`
  - `condor/rpc-changes.md`
  - `condor/local-setup.md`

## Build-Relevant Facts

- New work should default to Casper 2.0 `Transaction` terminology and verify legacy `Deploy` usage before copying old examples.
- The current JS/TS SDK install command in the clone is `npm install casper-js-sdk --save`.
- Contract workflow evidence points to `cargo-casper`, `make prepare`, `make build-contract`, `make check-lint`, and `make test`.
- Deployment evidence points to `casper-client put-transaction session` / `put-txn session`, `--pricing-mode fixed`, and Testnet chain name `casper-test`.
- Verification evidence says a returned transaction hash is not enough; use `get-txn` / `get-transaction`.
- Event evidence points to Sidecar SSE/REST/JSON-RPC and contract-level messages visible through `TransactionProcessed`.

## Open Questions

- Which docs pages are already fully updated for Casper 2.0 versus legacy-compatible?
- Which token-standard repos should be treated as canonical for current CEP-18 and CEP-78 implementation?
- Which exact SDK/package versions should be pinned once a project stack is chosen?

