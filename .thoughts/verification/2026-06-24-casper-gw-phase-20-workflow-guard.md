# Verification Audit: Casper GW Phase 20 Workflow Guard

## Verdict

Pass. The implementation is limited to CI/CD workflow enforcement: a new local guard validates package scripts and GitHub workflow shape, `verify` now runs the guard, focused guard tests pass, full `pnpm run ci` passes, and independent review passed after fixes.

## Artifacts Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-24-casper-gw-phase-20-workflow-guard.md`
- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/prune-feed-state.yml`
- `scripts/guard-workflows.mjs`
- `tests/unit/workflow-guard.test.ts`
- Command output from focused tests, `guard:workflows`, and full CI

## Requirement Traceability

- Enforce package-script gate shape:
  - `package.json` adds `guard:workflows`.
  - `verify` now runs `guard:workflows` between existing secret/product/file guards and unit tests.
  - `scripts/guard-workflows.mjs` checks `verify` contains exact command entries for file guard, product guard, secret guard, workflow guard, unit tests, typecheck, and lint.
  - The script checks `ci` contains exact command entries for frozen install, `verify`, browser smoke, and build.
- Enforce normal CI workflow shape:
  - The guard checks pull request and push triggers, `main`/`feat/**` branches, pnpm 10.33.0, Node 20, frozen install, Playwright chromium install, `pnpm verify`, `pnpm test:browser`, and `pnpm build`.
- Enforce scheduled maintenance workflow shape:
  - The guard checks manual/scheduled triggers, database secret mapping, explicit `DATABASE_URL` presence check, frozen install, and `pnpm maintenance:prune-feed`.
  - The guard allowlists prune workflow top-level triggers to `workflow_dispatch` and `schedule` only.
- Keep scope non-product:
  - No runtime source, UI, explorer, wallet, provider, x402 settlement, CSPR.cloud, Casper proof, registry, sandbox, OAuth, CSPR.click, Mainnet, or custody files changed.

## Acceptance Criteria Coverage

- CI/CD quality requirements are executable:
  - `pnpm run guard:workflows` passed.
  - `pnpm verify` now includes the new guard.
- Scheduler cannot silently become normal PR CI:
  - Unit tests assert prune workflow rejects `push`, privileged `pull_request_target`, and `pull_request_target` after blank lines inside the `on:` block.
  - Guard rejects any top-level prune workflow trigger outside `workflow_dispatch` and `schedule`.
- Scheduler remains database-secret gated:
  - Guard requires `DATABASE_URL: ${{ secrets.DATABASE_URL }}` and `test -n "$DATABASE_URL"`.
- No broad deployment or product behavior introduced:
  - No deployment provider, remote schedule execution, production CD, GitHub PR automation, or product runtime change was added.

## Quality Gates

- Focused workflow guard:
  - `pnpm run guard:workflows`
  - Passed.
- Focused tests:
  - `pnpm exec vitest run tests/unit/workflow-guard.test.ts`
  - Result: 1 file passed, 7 tests passed.
- Full CI:
  - `pnpm run ci`
  - Passed.
  - `verify` included `guard:files`, `guard:product`, `guard:secrets`, `guard:workflows`, unit tests, typecheck, and lint.
  - Unit tests: 38 files, 160 tests passed.
  - Browser tests: 18 passed, 2 intentional mobile skips.
  - Build: `next build` completed successfully.

## Deviations From Plan

- None. This slice stayed within workflow/script/test scope.

## Gaps And Risks

- The guard uses targeted text checks instead of a YAML parser to avoid adding a dependency for a narrow enforcement slice. The highest-risk cases are covered by command-token and trigger-allowlist regression tests, but future complex workflow rewrites may require a parser-backed guard.
- No GitHub remote is configured, so no remote Actions run or PR check was observed.

## Follow-ups

- None required for this slice.

## Evidence Log

- New active source line counts:
  - `scripts/guard-workflows.mjs`: 123 lines.
  - `tests/unit/workflow-guard.test.ts`: 151 lines.
- Independent review:
  - Reviewer `Descartes` initially found one Blocking issue: prune workflow triggers were not strictly allowlisted.
  - Reviewer `Descartes` also found one Should-fix issue: package script checks could confuse `test:browser` with `test`.
  - The exact-command issue was fixed and confirmed resolved.
  - Reviewer `Descartes` then found one remaining Blocking issue: blank lines inside the `on:` block could hide unexpected prune triggers.
  - The blank-line parser gap was fixed; final focused re-review passed with no Blocking or Should-fix findings.
- `pnpm run ci` completed successfully after reviewer fixes on 2026-06-24.
- No lockfile update was needed.
