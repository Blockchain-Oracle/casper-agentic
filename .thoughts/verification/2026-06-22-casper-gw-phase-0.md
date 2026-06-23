# Verification Audit: Casper GW Phase 0

## Verdict

Phase 0 proof loop is satisfied on Casper Testnet.

On 2026-06-23, the generated Testnet signer was funded with native CSPR, wrapped native CSPR into WCSPR through the verified CSPR.trade/WCSPR `deposit` path, ran one real paid `get_quote` call through CSPR.cloud x402 facilitator, persisted the receipt layers in Postgres, and resolved the resulting deploy through CSPR.cloud.

No Mainnet, custody, broad redesign, marketplace, registry, or simulated product mode work is claimed by this audit.

## Live Proof

- WCSPR package: `3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e`
- Latest WCSPR contract checked through CSPR.cloud: `4b351800391d4a47a7f932e9498516ed59bb41056d2743c14a8b1a5f90f67b3e`
- WCSPR entry points checked through CSPR.cloud: `deposit`, `withdraw`, `withdraw_to`, `transfer`, `transfer_from`, `transfer_with_authorization`, `receive_with_authorization`, `approve`, allowance/balance/metadata helpers, and upgrade/admin helpers. No public `mint` path was found.
- CSPR.trade Testnet SDK config confirms the same WCSPR package hash in `.thoughts/raw/repos/cspr-trade-mcp/packages/sdk/src/config.ts`.
- CSPR.trade proxy helper confirms the WASM argument pattern used for wrapping in `.thoughts/raw/repos/cspr-trade-mcp/packages/sdk/src/transactions/proxy-wasm.ts`.
- WCSPR wrap transaction: `5cb92938e22ba2fafa4db978a8e42099b52399e99afc76c8b365fa04de5e60cc`
- WCSPR wrap explorer: `https://testnet.cspr.live/transaction/5cb92938e22ba2fafa4db978a8e42099b52399e99afc76c8b365fa04de5e60cc`
- Paid x402 call attempt: `158ab798-5e21-4512-9823-fe6d95b8d3e5`
- Paid x402 deploy hash: `5566d633e6dc41e20fed6d50d84bb3945ff7327cf3ebdb8ecd67e682e944fa8a`
- Paid x402 explorer: `https://testnet.cspr.live/deploy/5566d633e6dc41e20fed6d50d84bb3945ff7327cf3ebdb8ecd67e682e944fa8a`
- CSPR.cloud deploy resolution for paid call: `status=processed`, `error_message=null`, `block_height=8271862`, `cost=6000000000`, `contract_package_hash=3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e`

## Commands Run

- `pnpm wrap:wcspr`: pass. Wrapped `15000000000` motes into WCSPR for the generated signer.
- `pnpm smoke:live`: pass. Returned `status=settled` for attempt `158ab798-5e21-4512-9823-fe6d95b8d3e5`.
- `pnpm verify`: pass. File guard, product guard, secret guard, 26 Vitest tests, typecheck, and lint passed.
- `pnpm run ci`: pass. Frozen install, verify, Playwright browser smoke, and Next build passed.
- `pnpm ci`: not a valid project-script invocation under pnpm 10.33.0 because pnpm owns that command and returns `ERR_PNPM_CI_NOT_IMPLEMENTED`; use `pnpm run ci`.

## Persisted Receipt Evidence

- `paid_call_attempts`: attempt `158ab798-5e21-4512-9823-fe6d95b8d3e5`, `status=settled`, `tool_name=get_quote`, `amount=7500000000`, `network=casper:casper-test`.
- `policy_decisions`: spend policy allowed before payment payload creation.
- `x402_records`: first row has `verify_response.isValid=true`; second row has `settle_response.success=true` and `settle_response.transaction=5566d633e6dc41e20fed6d50d84bb3945ff7327cf3ebdb8ecd67e682e944fa8a`.
- `casper_proofs`: deploy hash `5566d633e6dc41e20fed6d50d84bb3945ff7327cf3ebdb8ecd67e682e944fa8a`, `proof_status=processed`, explorer URL persisted.

## Requirement Traceability

- Repository bootstrap: Git branch `feat/casper-gw-phase-0` exists with baseline, plan, implementation, and setup commits before this live-proof update.
- Plan artifact: `.thoughts/plans/2026-06-22-casper-gw-phase-0-quality-ci-proof.md` exists.
- pnpm/tooling: `pnpm@10.33.0`, Vitest, Playwright, Drizzle, Postgres, Casper/x402, and MCP SDK dependencies are configured.
- CI: `.github/workflows/ci.yml` runs pnpm install, guards, tests, browser smoke, typecheck, lint, and build.
- Quality guards: file-size, product-scope, and secret guards pass.
- File-size gate: active source files remain below the 200-line target and 300-line hard cap.
- Database: Drizzle schema and migration cover provider/tool/pricing, endpoint access, wallets, spend policies, paid-call attempts, policy decisions, x402 records, Casper proofs, and audit events.
- MCP path: Streamable HTTP discovery/call uses `@modelcontextprotocol/sdk` against `https://mcp.cspr.trade/mcp` and starts with real `get_quote`.
- x402 path: CSPR.cloud `/supported`, `/verify`, and `/settle` are used; success is based on response body fields, not HTTP status alone.
- Casper proof path: deploy lookup retries CSPR.cloud after settlement; if indexing still lags, it persists the settle transaction as proof-pending and leaves the receipt status as `raw_proof_unavailable` rather than claiming `settled`.
- Policy: persisted wallet policy blocks before payment creation when wallet, tool, asset, network, or balance checks fail.
- API: required routes exist for integration health, tool discovery, paid-call run, wallet readiness, receipts list, and receipt detail.
- UI: `/explorer` remains public and outside the app shell; `/app` consumes real APIs where Phase 0 needs it.

## Browser And Build Evidence

- Vitest: 9 files, 26 tests passed.
- Playwright: 8 checks passed across desktop and mobile Chromium.
- Browser coverage includes public explorer separation, app paid-tool console presence, secret-redacted integration health, and fail-closed paid-call HTTP behavior.
- Next production build passed and produced static `/`, `/app`, and `/explorer` plus the required dynamic API routes.

## Independent Review

- Reviewer `019ef312-ff1a-7ac3-9d37-5ff4ac0fa7f5` found one should-fix issue: immediately resolving the deploy after `/settle` could fail during CSPR.cloud indexing lag and leave a real settled payment without a proof-pending receipt row.
- Fix applied: `src/server/casper-proof.ts` now retries deploy/token-action lookup, `src/server/live-paid-call.ts` persists `pending_indexing` proof rows on lookup failure, and `src/lib/receipt-detail.ts` avoids presenting proof-pending receipts as verified deploy proof.
- Tests added: `tests/unit/live-paid-call.test.ts` covers successful `/settle` followed by deploy lookup failure; `tests/unit/receipt-detail.test.ts` covers proof-pending receipt presentation; `tests/unit/proxy-wasm.test.ts` covers WCSPR proxy runtime args.

## Deviations And Constraints

- `pnpm ci` cannot be made to override pnpm's builtin `ci` command in this environment. The enforced project CI command is `pnpm run ci`.
- Docker Compose was not used because the available Postgres path is Homebrew Postgres on `127.0.0.1:5432`.
- No GitHub PR was opened because no remote is configured.
- The signer is build-time integration material only. It is not the product wallet UX and must not be treated as production custody.
- The WCSPR wrapper command is an operator support command, not a user-facing product mode.

## Residual Risks

- A second live paid call would require enough remaining WCSPR after the first settlement. The current wrapper can be rerun with adjusted `CASPER_WCSPR_WRAP_AMOUNT`.
- The paid call depends on CSPR.cloud hosted facilitator, CSPR.cloud REST indexing, Casper Testnet RPC, and CSPR.trade MCP availability.
- The root CJS import path for `@make-software/casper-x402` still fails under the local `tsx` path; the implementation uses the working `@make-software/casper-x402/exact/client` export instead.
- No production wallet UX is implemented yet; CSPR.click/browser signing remains later product work.

## Sources Checked

- Local CSPR.trade SDK config: `.thoughts/raw/repos/cspr-trade-mcp/packages/sdk/src/config.ts`
- Local CSPR.trade proxy helper: `.thoughts/raw/repos/cspr-trade-mcp/packages/sdk/src/transactions/proxy-wasm.ts`
- Local CSPR.trade proxy WASM: `.thoughts/raw/repos/cspr-trade-mcp/packages/sdk/src/assets/proxy_caller.wasm`
- CSPR.cloud contract package, entry-points, entry-point costs, deploy lookup, FT ownership, and FT action endpoints.
- Context7 Casper docs for CEP-18 and Casper JS SDK transaction syntax.
