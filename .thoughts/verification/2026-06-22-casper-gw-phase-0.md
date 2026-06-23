# Verification Audit: Casper GW Phase 0

## Verdict

Incomplete for the full Phase 0 goal.

The repository, quality, CI, database, backend module, API, minimal UI, unit test, browser smoke, and build gates are implemented and passing locally. On 2026-06-23, local Postgres, CSPR.cloud API configuration, generated Testnet payer/payee signer material, and a persisted wallet spend policy were configured in ignored local files/state.

The required live Casper Testnet x402 proof gate is still not satisfied because the generated payer account is not funded/created on Testnet. `pnpm smoke:live` reaches CSPR.cloud and stops at `CSPR.cloud /accounts/<payer-account-hash> failed with 404`. Native Testnet CSPR funding is required before WCSPR/payment-asset readiness can be checked.

No live Casper settlement, deploy hash, or "Paid on Testnet" claim is made by this audit.

## Artifacts Checked

- `.thoughts/plans/2026-06-22-casper-gw-phase-0-quality-ci-proof.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `AGENTS.md`
- Current Git branch diff on `feat/casper-gw-phase-0`

## Requirement Traceability

- Repository bootstrap: Git was initialized, branch `feat/casper-gw-phase-0` was created, and baseline commits exist before feature edits.
- Plan artifact: the accepted Phase 0 plan was written to `.thoughts/plans/2026-06-22-casper-gw-phase-0-quality-ci-proof.md`.
- pnpm/tooling: package manager is `pnpm@10.33.0`; Vitest, Playwright, Drizzle, Postgres, Casper/x402, MCP SDK dependencies and scripts are in `package.json`.
- CI: GitHub Actions workflow exists at `.github/workflows/ci.yml` with pnpm install, guards, tests, browser smoke, and build.
- Quality guards: file-size, product-scope, and secret guards exist under `scripts/` and pass locally.
- File-size cleanup: `src/app/globals.css` and fixture data were split; active source files are below the 200-line target and 300-line hard cap.
- Database: Drizzle schema and migration cover providers, tools, prices, access keys, wallets, spend policies, paid-call attempts, policy decisions, x402 records, Casper proofs, receipts through attempt/proof rows, and audit events.
- Integration modules: server-only modules exist for env, Drizzle client, CSPR.cloud REST, x402 facilitator, MCP client, wallet readiness, operator access, endpoint safety, spend policy, receipt storage, and live paid-call orchestration.
- MCP path: discovery/call code uses `@modelcontextprotocol/sdk` Streamable HTTP transport against configurable MCP endpoint, defaulting to `https://mcp.cspr.trade/mcp`; server-side discovery validates HTTPS endpoints, blocks unsafe resolved addresses, and uses manual redirect handling.
- x402 path: code uses CSPR.cloud facilitator `/supported`, `/verify`, and `/settle`, and branches on response bodies for verify/settle success.
- Policy: paid-call orchestration loads persisted wallet policy from Postgres and blocks before payment payload creation when no active policy exists or limits fail.
- API: required routes exist for integration health, tool discovery, paid-call run, wallet readiness, receipts list, and receipt detail. Tool discovery and HTTP paid-call routes require operator access; HTTP signing also requires an explicit enable flag.
- UI: public `/explorer` consumes receipt API with fixture fallback and remains outside the authenticated app shell; `/app` console can call discovery/run APIs and does not fake success when credentials are missing.

## Acceptance Criteria Coverage

- Public explorer no sidebar/sign-in: covered by Playwright desktop/mobile smoke.
- App console route present: covered by Playwright desktop/mobile smoke.
- Integration health redacts secrets: covered by Playwright API smoke.
- Env preflight: covered by Vitest unit tests and `pnpm smoke:live` missing-config output.
- Operator route guard: covered by Vitest unit tests and Playwright API smoke proving unauthenticated paid-call HTTP access fails closed.
- MCP endpoint safety: covered by Vitest unit tests rejecting non-HTTPS URLs, credentialed URLs, localhost, blocked resolved addresses, and IPv4-mapped IPv6 forms for private/link-local/shared ranges.
- Policy fail-closed: covered by Vitest unit tests for allow, disallowed tool, max-per-call, insufficient asset balance, and live paid-call orchestration blocking before payment when persisted policy is missing or over limit.
- Facilitator body handling: covered by Vitest unit test preserving an HTTP-200 invalid verify body.
- Fixture fallback receipt separation: covered by Vitest unit test verifying gateway/policy/x402/Casper receipt layers.
- Receipt proof rendering: covered by Vitest unit test showing Casper proof when a real deploy hash exists even if the upstream tool fails after settlement.
- Build/type/lint: covered by `pnpm run ci`.
- Drizzle migration: applied successfully against local Homebrew Postgres after creating `casper_gw` role/database.

## Quality Gates

- `pnpm verify`: pass.
- `pnpm test`: pass, 8 files and 22 tests.
- `pnpm test:browser`: pass, 8 Playwright checks across desktop and mobile Chromium.
- `pnpm build`: pass, Next.js production build succeeds.
- `pnpm run ci`: pass, frozen install, verify, browser smoke, and build complete successfully.
- `pnpm smoke:live`: expected fail at live funding gate because CSPR.cloud cannot resolve the generated payer account before faucet funding.
- `pnpm ci`: not usable with pnpm 10.33.0 because pnpm owns that command and returns `ERR_PNPM_CI_NOT_IMPLEMENTED`; use `pnpm run ci` for the project CI script.
- Independent review: first pass found blockers in operator auth, policy, SSRF, and proof rendering; those were fixed and re-tested. Second pass found one remaining IPv4-mapped IPv6 SSRF gap; it was fixed and covered by tests.

## Deviations From Plan

- The literal `pnpm ci` command cannot be implemented as a package script under pnpm 10.33.0. The equivalent project command is `pnpm run ci`.
- Docker Compose Postgres could not start because the configured Docker socket was unavailable. The migration gate was run against Homebrew Postgres on `127.0.0.1:5432` instead.
- The live Casper proof gate was run through the first CSPR.cloud account-readiness step after local credentials/signer/database setup. It is blocked because the generated payer account has not been funded on Testnet.
- No GitHub PR was opened because no GitHub remote is configured.

## Gaps And Risks

- Live settlement remains unverified. Required next input is Testnet funding for the generated payer account, first native CSPR for gas/account creation, then WCSPR/payment asset support.
- WCSPR funding was not verified. If WCSPR cannot be funded, Abu must choose whether to fund WCSPR or use/deploy another CEP-18 test token.
- `@make-software/casper-x402` root CJS import fails under the local `tsx` path. The implementation avoids that path by using the working `@make-software/casper-x402/exact/client` export and local signer adapter, but this should be rechecked during the credentialed live smoke.
- pnpm install reports ignored build scripts for `esbuild`, `sharp`, and `unrs-resolver`; current build/tests pass, but the team may choose to run `pnpm approve-builds` before CI hardening.

## Follow-ups

- Fund the generated payer account on Casper Testnet, confirm WCSPR/payment asset support, then run `pnpm smoke:live`.
- After live proof succeeds, verify that the persisted receipt has a real deploy hash resolvable at `testnet.cspr.live`.
- Add the GitHub remote, push the feature branch, and open a PR after live proof/review requirements are satisfied.

## Evidence Log

- Baseline commit: `33d57ae chore: establish current baseline`.
- Plan commit: `360f708 docs: add phase 0 quality proof plan`.
- `pnpm run ci`: passed on 2026-06-22 after review fixes.
- `pnpm test:browser`: passed on 2026-06-22 with 8 checks.
- `pnpm build`: passed on 2026-06-22.
- `pnpm smoke:live`: failed with missing integration configuration only after the payment import preflight bug was fixed.
- Drizzle migration: `migrations applied successfully!` against local Homebrew Postgres.

## 2026-06-23 Live Setup Update

- Added signer PEM path support so ignored local signer files can be used without storing multiline private key content in env.
- Added `@next/env` so `pnpm smoke:live` loads `.env.local` deterministically.
- Local Postgres is configured at `postgres://casper_gw:casper_gw@127.0.0.1:5432/casper_gw`; migrations apply successfully.
- Generated ignored Testnet payer/payee key material under `.secrets/casper-phase0/`.
- Seeded a persisted wallet spend policy for the generated payer allowing only `get_quote`, Casper Testnet, the configured WCSPR package, and the configured per-call amount.
- CSPR.cloud x402 facilitator `/supported` succeeds and advertises `casper:casper-test` with `exact`.
- `pnpm run ci` passed on 2026-06-23: guards, 22 Vitest tests, typecheck, lint, 8 Playwright browser checks, and Next build.
- `pnpm smoke:live` fails at the expected current funding gate: CSPR.cloud account lookup returns 404 for the generated payer account because it has not received Testnet CSPR yet.
