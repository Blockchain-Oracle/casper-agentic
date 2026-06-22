# Reality Research: casper-network/docs-redux

## Scope

This brief maps the local `casper-network/docs-redux` clone as a decision source for the Casper Agentic Buildathon. It focuses on documentation structure, current build/developer commands, Casper 2.0 transaction model, contract/testing/deployment paths, event streams, SDKs, and token standards.

## Sources Checked

- Local clone: `.thoughts/raw/repos/docs-redux`
- Git commit: `34b2071b550feef46fcdbb40bb87f1a711df8958`
- Branch: `dev`
- Latest commit date: `2026-06-05 23:10:45 +0300`
- Key files:
  - `README.md`
  - `package.json`
  - `docusaurus.config.js`
  - `config/sidebar.config.js`
  - `.github/workflows/*.yaml`
  - `docs/developers/**`
  - `docs/resources/tokens/**`
  - `condor/**`

## Verified Facts

- `docs-redux` is a Docusaurus documentation repo. `package.json` identifies the package as `cspr-docs-redux`, version `2.0.0`, private, with Node engine `>=23.0`, Docusaurus dependencies, and scripts including `start`, `build`, `serve`, `check:externals`, `check:unused`, and `reversion`.

- The README says this is the Casper Network documentation repository, points to `https://docs.casper.network/`, and says a complete documentation rework is underway; fixes are welcome, but major or structural changes to the legacy version should be avoided.

- Docusaurus config uses the classic preset for `./docs`, with sidebar path `./config/sidebar.config.js`, route base path derived from env config, and separate content-docs plugins for `condor` and `faq`.

- GitHub workflows in this repo only trigger internal build pipelines for `dev`, `stg`, and `main`; they do not run local lint/test/build gates directly in this repository.

- The developer sidebar is explicit. It organizes docs into:
  - Development prerequisites and essential crates.
  - Writing on-chain code.
  - Casper JSON-RPC API.
  - Building dApps.
  - Interacting with the blockchain via CLI.

- Development prerequisites say comfortable Casper development is targeted at Linux Ubuntu 20.04 or macOS, but macOS is cautioned as not officially supported. The same page covers Rust, `cargo-casper`, `casper-client`, and CMake.

- The prerequisites page says `cargo casper` is the fastest way to set up a Casper Rust project. It creates a Wasm smart contract, runtime environment, and testing framework, and can be used in CI/CD.

- Essential Rust crates listed include `casper-types`, `casper-contract`, `casper-engine-test-support`, `casper-node`, `casper-client`, `casper-event-standard`, `casper-hashing`, `casper-wasm-utils`, and `cargo-casper`.

- The Rust getting-started guide says `cargo casper my-project` creates two crates, `contract` and `tests`. It uses `make prepare`, `make build-contract`, `make check-lint`, and `make test`.

- The Rust getting-started guide says Casper smart contracts compile to Wasm and can target `wasm32-unknown-unknown`.

- The current cloned JS/TS SDK page says install with `npm install casper-js-sdk --save`. It says the SDK supports Casper 2.0 Transactions and legacy Deploys.

- The JS/TS SDK page includes examples for key generation, native Casper 2.0 transfer transactions, legacy deploys, transaction/deploy serialization, CSPR transfers, auction manager operations, CEP-18 transfers, NFT transfers, RPC calls, and SSE events.

- The signing doc says every valid transaction has at least one approval. Casper supports both Ed25519 and Secp256k1 public-key cryptography, and signatures are tied to the transaction hash.

- CLI docs use the Casper 2.0 `Transaction` language for installing contracts: `casper-client put-transaction session` / `put-txn session`, `--pricing-mode fixed`, `--chain-name casper-test` for Testnet, and JSON-RPC default port `7777`.

- CLI docs explicitly warn that receiving a transaction hash does not mean processing succeeded; the transaction must be checked with `get-txn` / `get-transaction`.

- Testing docs describe `casper-engine-test-support`, `InMemoryWasmTestBuilder`, `ExecuteRequestBuilder`, and `DEFAULT_RUN_GENESIS_REQUEST` for testing contracts without a full node. They also identify NCTL and Testnet as next testing layers.

- Event docs describe the Casper Sidecar as a process alongside the node that supports SSE, REST, JSON-RPC, and legacy SSE emulation. Node-generated events are exposed through `events`; Sidecar-generated events through `events/sidecar`. Mainnet/Testnet Sidecar event URL is usually `http://HOST:19999/events/`, depending on node configuration.

- Contract-level event docs say smart contracts can emit human-readable messages; the emitted message itself is not stored on-chain, but a checksum is stored in global state to protect against spoofing and repudiation.

- Condor/Casper 2.0 release notes say Casper 2.0 introduces Zug consensus, multi-VM support, CSPR burn, native events, a new transaction model, factory contract pattern, and contract access to auction.

- Condor/Casper 2.0 release notes say the new `Transaction` model replaces the existing Deploy concept. Deploys are deprecated as of Casper 2.0, but valid deploys are still accepted for compatibility and removal is deferred to a future major release.

- Condor/Casper 2.0 release notes say JSON-RPC was moved out of the node and into Casper Sidecar, enabling RPC surface improvements without node binary changes.

- CEP-18 docs identify CEP-18 as Casper's ERC-20 equivalent for fungible tokens, covering total supply, transfer, approval, and token data access. The quickstart still uses legacy `put-deploy` commands, so token docs must be interpreted alongside the current transaction docs.

- CEP-78 docs cover the enhanced NFT standard, required installation runtime arguments, optional modalities, utility session code, and a test suite that serves as behavioral specification.

## Inferences

- For a buildathon project, `docs-redux` is enough to define the base Casper build path: Rust/Wasm contract, JS/TS client, CLI deployment, Sidecar/events, and Testnet verification. It does not cover the full AI Toolkit or CSPR.trade/x402 surfaces; those live in CSPR.build, CSPR.cloud, CSPR.click, CSPR.trade MCP, and make-software repos.

- Casper 2.0 docs should be treated as the default source for new work. Pages that still use `put-deploy` are useful, but they may represent legacy-compatible workflows or token-standard docs that have not been fully rewritten to transaction terminology.

- Any future project that needs on-chain proof should plan for a real verification loop: local contract tests, optional NCTL, Testnet transaction submission, then transaction-status verification. A transaction hash alone is not sufficient evidence.

- Event-driven agent workflows should likely consider Sidecar/CSPR.cloud event streams because Casper docs emphasize events, Sidecar, `TransactionProcessed`, and contract-level messages as the observable surface after execution.

## Unknowns And Questions

- The docs repo says a documentation rework is underway. It is not clear which pages are fully current versus legacy-compatible without checking linked upstream repos and package versions.

- Some token-standard docs still use legacy deploy commands. We need to verify current CEP-18/CEP-78 repos before implementing tokenized asset flows.

- The repo does not document the Casper AI Toolkit in depth. For AI/MCP/x402 implementation details, continue using CSPR.build, CSPR.cloud, CSPR.click, CSPR.trade MCP, and `make-software/casper-x402`.

- The repo's GitHub workflows trigger internal pipelines, so public CI expectations for docs quality are not fully visible from this repository alone.

## Not Included

- No project idea selection.
- No architecture.
- No implementation plan.
- No code scaffolding.
- No attempt to run the Docusaurus site.
- No contract deployment or Testnet transaction.

