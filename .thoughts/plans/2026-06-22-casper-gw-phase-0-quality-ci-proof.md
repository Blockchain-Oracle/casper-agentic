# Plan: Casper GW Phase 0 With Quality, CI, Review, And Real Proof Gates

Date: 2026-06-22
Status: Accepted for implementation

## Summary

Implement Phase 0 only after the Context Engineering enforcement layer is in place. Current repo state is fixture-backed Next.js/pnpm with no Git repo, no CI, no tests, no PR loop, and known file-size debt. The build target remains one real Casper Testnet x402 paid call through CSPR.cloud and `cspr-trade-mcp`, persisted as a four-layer receipt and visible in the public explorer.

## Phase 0A: Repository And Quality Bootstrap

- Initialize Git if still absent, create a feature branch, and commit the current baseline before feature edits. If no GitHub remote exists, continue locally but stop before opening a real PR and ask Abu for the repo/remote.
- Create/update the current plan artifact in `.thoughts/plans/` from this approved plan before coding.
- Add deterministic commands: `pnpm test`, `pnpm test:browser`, `pnpm guard:files`, `pnpm guard:product`, `pnpm guard:secrets`, `pnpm verify`, and `pnpm ci`.
- Add GitHub Actions CI for PR/push: pnpm setup, frozen install, file-size guard, product-scope guard, secret scan, unit/integration tests, browser smoke, typecheck, lint, and build.
- Add Vitest for unit/integration tests and Playwright for GUI smoke. Keep live Casper smoke as credential-gated/manual, not normal CI.
- Add independent review workflow: after implementation, run Context Engineering verification audit, then spawn a separate reviewer agent for code review before PR/handoff.

## Phase 0B: Quality Debt Cleanup Before Feature Growth

- Split `src/app/globals.css` so active source files obey the 300-line hard cap.
- Split `src/lib/fixtures.ts` below the warning threshold where practical.
- Keep `src/components/gateway-app.tsx` from growing beyond the 200-line target.
- File-size guard excludes `.thoughts/raw/repos/`, generated output, lockfiles, `.next/`, and vendored/reference material.
- Product guard blocks reintroducing rejected terms/surfaces: registry/private tools, sandbox, Simulated/Local product modes, generic send policy, fake deploy hashes.

## Phase 0C: Integration Preflight And Credentials

- Before coding each integration, check sources in order: local `.thoughts`, cloned repos, CSPR.cloud docs, Casper docs, Casper AI toolkit, Context7 for library syntax, then targeted web only for named gaps.
- Validate CSPR.cloud access with `CSPR_CLOUD_API_KEY` and `/supported`; require `casper:casper-test`.
- Use WCSPR package `3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e` only if it verifies and the payer can be funded with WCSPR.
- Do not assume the normal Casper Testnet faucet provides WCSPR. It only proves CSPR gas funding. If WCSPR funding is unavailable, stop and ask Abu whether to fund WCSPR or deploy/use another CEP-18 test token.
- Require env-only local Testnet signer material, payee account hash, and `DATABASE_URL`. No private keys or CSPR.cloud tokens may be committed or exposed to the browser.

## Phase 0D: Backend Proof Loop

- Add Postgres + Drizzle with migrations and local Postgres setup. Persist providers, tools, pricing, endpoint access keys, wallets, spend policies, paid-call attempts, policy decisions, x402 verify/settle records, Casper proof records, receipts, and audit events.
- Add server-only modules for env validation, CSPR.cloud REST, x402 facilitator, MCP client, wallet readiness, spend policy, receipt assembly, redaction, and audit.
- Use the official MCP TypeScript SDK Streamable HTTP client for `https://mcp.cspr.trade/mcp`; discover tools and start with real `get_quote`.
- Use CSPR.cloud REST for account balance, FT ownership/actions, and deploy proof. Preserve documented CSPR.cloud field names.
- Use CSPR.cloud x402 facilitator `/verify` and `/settle`; branch on response bodies, not HTTP status alone.
- Policy runs fail-closed before signing/payment. Policy-blocked attempts create audit/receipt records and no Casper transaction.
- Local signer is for integration verification only and must be labeled non-production. CSPR.click/browser signing remains later product work.

## Phase 0E: API And Minimal UI Wiring

- Add routes: `GET /api/health/integrations`, `POST /api/tools/discover`, `POST /api/paid-calls/run`, `GET /api/wallets/[id]/readiness`, `GET /api/receipts`, and `GET /api/receipts/[id]`.
- Replace fixture-backed receipt/dashboard reads where needed with datastore-backed reads, while keeping any remaining sample data visibly labeled.
- Update UI only enough to consume real APIs: paid-tool console discovery/run, wallet readiness, receipt detail, and public `/explorer`.
- Public explorer stays public: no sign-in, wallet connection, authenticated app shell, or sidebar.
- Never render `settled`, `Paid on Testnet`, or a deploy-hash link unless settle succeeds and CSPR.cloud resolves the real deploy.

## Verification And PR Gate

- Required local gate: `pnpm ci`, `pnpm verify`, `pnpm test:browser`, and `pnpm build`.
- Required live gate, credential-gated: one real `get_quote` paid call that produces a persisted receipt with a real deploy hash resolvable on `testnet.cspr.live`.
- Required audit: write `.thoughts/verification/YYYY-MM-DD-casper-gw-phase-0.md` mapping spec/story/plan requirements to code, tests, commands, screenshots, and live proof evidence.
- Required review: independent reviewer agent inspects the diff for bugs, leaks, fake proof, file-size violations, and missing tests. Fix blockers before PR.
- Open a GitHub PR only after CI passes. If no remote/repo exists, stop with local commits, verification evidence, and the exact remote info needed from Abu.

## Assumptions

- Postgres + Drizzle is accepted.
- pnpm remains the only package manager.
- CSPR.cloud hosted facilitator is the default; no self-hosted facilitator unless CSPR.cloud blocks the live proof.
- Mainnet, production custody, broad redesign, marketplace/registry, simulated product modes, and production CD deploy are out of Phase 0.
