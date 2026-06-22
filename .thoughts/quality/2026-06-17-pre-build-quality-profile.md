# Project Quality Profile: Casper Agentic Pre-Build

## Detected Stack

- Current project root `/Users/abu/dev/hackathon/casper-agentic` is research-only.
- No app, contract, package manifest, source tree, or Git repository exists yet outside `.thoughts/`.
- Raw documentation source cloned for research:
  - `casper-network/docs-redux` under `.thoughts/raw/repos/docs-redux`.
  - Stack for that raw source: Docusaurus 3, React 18, Node `>=23.0`.
- No final build stack has been chosen. Do not enforce stack-specific gates until the project idea and implementation stack are selected.

## Existing Commands

- Project root: none.
- `docs-redux` raw source commands from `package.json`:
  - `npm run start`
  - `npm run build`
  - `npm run serve`
  - `npm run check:externals`
  - `npm run check:unused`
- Casper contract commands from docs:
  - `cargo casper <project>`
  - `make prepare`
  - `make build-contract`
  - `make check-lint`
  - `make test`
- Casper CLI verification commands from docs:
  - `casper-client put-transaction session` / `casper-client put-txn session`
  - `casper-client get-transaction` / `casper-client get-txn`

## Required Local Checks

No mandatory local checks yet because there is no implementation stack.

Conditional checks once stack is chosen:

- Rust/Wasm Casper contract:
  - Format: `cargo fmt`
  - Lint: `cargo clippy` or project Makefile `make check-lint`
  - Build: `make build-contract`
  - Test: `make test`
- JS/TS dApp or agent:
  - Use project manifest scripts after scaffolding.
  - Minimum expected gates: format, lint, typecheck, unit tests, production build.
- Go x402/facilitator component:
  - Format: `gofmt`
  - Test: `go test ./...`
  - Build command from chosen repo/module.
- MCP / CSPR.trade integration:
  - Verify package version and live tool surface before writing code.
  - Test signing/submission flow against Testnet only until explicitly ready.

## Required CI Gates

Deferred until project stack exists.

Expected minimum once stack is chosen:

- Install dependencies from lockfile.
- Format/lint.
- Typecheck/static analysis.
- Unit tests.
- Build/package.
- Contract artifact build and tests if Rust/Wasm is included.
- A scripted Testnet verification command or documented manual verification for hackathon submission, because the event requires a transaction-producing on-chain component.

## Suggested Hooks

Deferred until project stack exists.

Likely hooks:

- Pre-commit: format changed files, lint changed files, file-size check.
- Pre-push: fast tests and build for touched stack.

## File Size Policy

- Target: 200 source lines.
- Warning: above 200 source lines.
- Hard cap: above 300 source lines.
- Exclusions: generated files, build output, vendored code, fixtures, lockfiles, generated ABI/schema output, and copied raw research sources under `.thoughts/raw/`.
- Justified exceptions: allowed only with a short written reason in this profile or a future PR note.

## Commit Policy

- No policy yet. Future policy should follow the scaffolded repo if it already defines commit conventions.
- If we create the repo from scratch, prefer concise conventional commits only if the surrounding tooling uses them.

## AGENTS.md Notes

- Keep current Context7 rule: use `ctx7`/`npx ctx7@latest` for current library, SDK, framework, CLI, API, or cloud-service docs before answering or implementing.
- For Casper implementation, treat `docs-redux` as a primary source for core chain concepts and developer workflows, but use package-specific docs/repos for CSPR.click, CSPR.cloud, CSPR.trade MCP, x402, Odra, and SDK versions.
- Do not choose architecture from this profile. Use it only to set verification expectations after ideation.

## Open Questions

- What stack will the final project use?
- Will we need custom Casper contracts, CSPR.trade MCP-only transactions, x402 paid API flows, CSPR.cloud data/event streams, or a combination?
- Which exact SDK/contract/tool versions will be pinned?
- What will count as the submission's transaction-producing on-chain component?

