# Project Quality Profile: Casper Agent Commerce Gateway

Date: 2026-06-18
Status: Updated for implementation transition on 2026-06-19; scaffold exists, implementation started, verification pending

> 2026-06-22 consistency note: this quality profile contains historical gates from earlier prototype stages. For current product scope, read `.thoughts/README.md`, `2026-06-22-casper-gw-current-quality-profile.md`, `../specs/2026-06-22-casper-gw-current-spec.md`, and `../prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md` first. Registry/private-tool, Demo Sandbox, and Simulated/Local mode checks are no longer current product requirements.

## Detected Stack

Current project root: `/Users/abu/dev/hackathon/casper-agentic`

Detected current state as of 2026-06-19:

- The workspace root contains `.thoughts/`, `package.json`, `package-lock.json`, Next.js config files, `src/`, `public/`, `README.md`, and `AGENTS.md`.
- The root is not a Git repository.
- The app stack is Next.js App Router, React, TypeScript, and local mocked-first route handlers.
- The app source tree includes `src/app`, `src/components`, and `src/lib`.
- The stack detector previously found source-like files inside `.thoughts/raw/repos/docs-redux`; that remains a cloned Casper documentation reference repo, not this product's application code.

Quality conclusion:

- Implementation has started.
- Active local gates are lint, typecheck, production build, file-size checks, fixture-secret scans, and later browser/fidelity verification.
- The updated spec, stories, designer brief, prototype discovery, and research-backed plan are accepted inputs for implementation.
- Planning, verification, and handoff files remain non-final until a real implementation verification audit is completed.

Research-backed future implementation surfaces:

- Frontend product UI.
- Gateway/MCP endpoint layer.
- Provider source and pricing model.
- Agent wallet and policy layer.
- Casper x402 settlement integration.
- Explorer/receipt layer.
- Settings/audit layer.
- Demo sandbox and submission verification.

The MVP UI/gateway shell stack is now selected as TypeScript, React, and Next.js App Router. CSPR.cloud, `@make-software/casper-x402`, `casper-js-sdk`, SQLite, and Postgres remain future integration/storage candidates and must be re-evaluated before live settlement or persistence work.

## Existing Commands

Current root commands:

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

Evidence:

- `package.json` defines `dev`, `lint`, `typecheck`, `build`, and `start`.
- There is no Git repository at the workspace root.
- The docs-redux clone under `.thoughts/raw/repos/docs-redux` has its own tooling, but that tooling belongs to the reference documentation repo and must not be treated as this product's build/test stack.

Inspection commands used for this profile:

```bash
pwd
ls -la
find . -maxdepth 3 -type f -not -path './.thoughts/raw/repos/docs-redux/*' -print | sort
python3 /Users/abu/.codex/plugins/cache/personal/abu-context-engineering/0.4.1/scripts/detect-project-stack.py /Users/abu/dev/hackathon/casper-agentic
git status --short || true
find /Users/abu/dev/hackathon/casper-agentic -name AGENTS.md -print
```

## Required Local Checks

### Historical Research-Only Phase

These checks were relevant before scaffold creation and are now historical:

- The project root previously had no app scaffold.
- Future gates previously could not pretend current tests or CI existed.
- Provider credentials, MCP client auth, and x402 wallet/payment authorization had to remain separate quality concerns.
- Casper receipt/explorer quality rules had to distinguish gateway/facilitator context from raw Casper proof.

Current implementation-phase checks are listed in the Implementation Transition Update below.

### Before Moving To Spec Acceptance

- Re-read the finalized quality profile.
- Confirm the spec does not require quality gates that the current project cannot support yet.
- Confirm any implementation assumptions in the spec are labeled as future choices or open questions.

### Before Moving To Prototype

- Ensure the designer brief and prototype prompt make backend, database, auth, wallet, and payment integrations mocked by default.
- Ensure the prototype requires visible live/simulated settlement state.
- Ensure the prototype includes states for policy block, verify failure, settlement failure, upstream failure, and client-auth failure.

### After Prototype Discovery / Before Planning

- Confirm the authoritative prototype is `/Users/abu/Downloads/API Design System Scope (1)/Casper Gateway.dc.html`.
- Treat `Casper Gateway (v1 sidebar).dc.html`, `Casper Gateway-print-16ycpjl.dc.html`, and exported screenshots as secondary evidence.
- Confirm the updated prototype renders a nonblank dashboard at desktop and mobile viewports.
- Confirm all nine prototype screens are reachable:
  - Operations.
  - Source Import.
  - Tool Pricing And Publish.
  - Hosted Endpoint.
  - Wallet Control Plane.
  - Demo Sandbox.
  - Casper x402 Explorer.
  - Discovery / Registry.
  - Settings & Audit.
- Confirm the global mode indicator is visible and separates Simulated, Local, and Live Testnet.
- Confirm endpoint/provider "live" or "published" labels cannot be confused with live settlement/proof status.
- Confirm prototype findings have been accepted into spec and stories before planning starts.
- Confirm prototype HTML is treated as design/product evidence and not copied blindly into the future app stack.
- Confirm fixture or prototype credentials do not use live-looking prefixes such as `sk_live`.
- Confirm the cdr-kit/Story/CDR design-system provenance is either explicitly accepted by Abu or quarantined as inspiration only.

### Implementation Transition Update

The profile has now been updated after scaffold creation.

Required before further broad implementation:

- Keep all React/TypeScript source files below the 300-line hard cap unless explicitly justified.
- Keep the root app coordinator small; product surfaces should live in screen-specific components.
- Keep route handlers narrow and fixture-backed until real persistence or settlement is intentionally planned.
- Run lint, typecheck, and build after structural changes.
- Do not claim final implementation verification until browser/fidelity checks and a verification audit are complete.

## Required CI Gates

Current CI gates:

- None. There is still no Git repository or CI configuration.

Future CI gates should cover:

### Frontend

- Format check.
- Lint.
- Typecheck.
- Unit tests for state reducers, policy display, receipt rendering, amount formatting, and auth-boundary labels.
- Production build.
- Browser smoke test screenshots for desktop and mobile.
- Visual checks for:
  - dashboard guided demo,
  - hosted endpoint auth boundaries,
  - wallet policy preview,
  - sandbox outcome states,
  - explorer receipt proof layers,
  - registry allowlist state,
  - settings/audit trust boundaries.

### Gateway / MCP

- Format/lint/typecheck for chosen stack.
- Unit tests for tool normalization, endpoint scoping, client auth, upstream secret handling, pricing, policy enforcement, receipt creation, and idempotency.
- Integration tests for authenticated and unauthenticated endpoint calls.
- Integration test for paid-call flow using mocked facilitator.

### Wallet Policy

- Unit tests for:
  - max spend per call,
  - daily/session limits,
  - provider allowlist,
  - tool allowlist,
  - network/asset allowlist,
  - manual approval mode,
  - blocked-call receipt creation.
- Regression tests proving blocked calls do not attempt settlement.

### Casper x402 Settlement

- Mock facilitator tests for `/verify` and `/settle` success and failure paths.
- Live Testnet smoke test when credentials, funding, token asset, and facilitator access are available.
- Settlement result persistence test for transaction/deploy hash, network, payer, payee, amount, asset, and error reason.
- Verification test that live settlement is never claimed without a real transaction/deploy hash.

### Explorer / Receipt Layer

- Tests for blocked, failed, simulated, and settled receipt states.
- Tests for verify-failed, settle-failed, upstream-failed, client-auth-failed, and raw-proof-unavailable receipt states.
- Tests proving receipt sections separate:
  - gateway context,
  - policy decision,
  - x402 verify/settle context,
  - raw Casper proof.
- Filter/search tests by provider, tool, wallet, status, network, and time.
- Export/copy tests for receipt id and transaction/deploy hash.
- Regression test proving sandbox scenario outcomes route to matching receipt statuses.
- Regression test proving endpoint/provider liveness labels are not used as settlement/proof evidence.

### Security And Secrets

- Tests or reviews proving provider upstream credentials do not appear in client responses, receipts, exports, logs, or browser-visible state.
- Token-scope checks for MCP client access tokens.
- Fixture scan proving mock secrets do not use live-looking prefixes such as `sk_live`.
- Product-copy scan proving cdr-kit/Story/CDR provenance does not leak into Casper Gateway semantics unless explicitly accepted.
- Secret scanning before submission.
- Dependency audit appropriate to chosen package manager.

## Suggested Hooks

Current hooks:

- None. There is no Git repo.

Future hooks after Git initialization:

- Fast format/lint hook for changed source files.
- Typecheck should usually remain a local command or CI gate unless fast enough.
- Test hook only for targeted fast unit tests.
- Secret scan hook for `.env`, private keys, bearer tokens, CSPR.cloud access tokens, provider API keys, and wallet material.
- Fixture secret-prefix check for live-looking mock values.
- File-size warning hook for source files above 200 lines.

Hooks should not run against `.thoughts/raw/repos/docs-redux`, generated files, lockfiles, fixtures, build output, or vendored code.

## File Size Policy

Default future source-file policy:

- Target: 200 source lines.
- Warning: above 200 source lines.
- Hard cap: above 300 source lines.
- Exclusions:
  - `.thoughts/raw/`
  - cloned reference repos under `.thoughts/raw/repos/`
  - generated files
  - build output
- Current status after 2026-06-19 refactor:
  - React/TypeScript source files are below 300 lines.
  - `src/lib/fixtures.ts` is above the 200-line warning threshold and should be watched.
  - `src/app/globals.css` remains above 300 lines and should be split before final implementation verification unless explicitly justified as a temporary global stylesheet.
  - `package.json` uses an npm `overrides` entry for PostCSS `8.5.15` to avoid the moderate advisory inherited through Next.js.
  - vendored code
  - fixtures
  - lockfiles
  - framework-generated files
  - static mock data files when explicitly justified
- Escape hatch: files above the cap require a written reason in the quality profile update, implementation plan, or PR notes.

Expected future decomposition pressure:

- Split UI screens into route/page, screen component, focused panels, hooks, and data fixtures.
- Split gateway logic into source adapters, pricing, auth, policy, x402, receipt, and explorer modules.
- Split product surfaces into dashboard, provider, endpoint, wallet, sandbox, explorer, registry, and settings/audit modules.
- Keep policy and receipt logic small and heavily tested.

## Commit Policy

Current policy:

- None. The root is not a Git repository.

Future policy after Git initialization:

- Use concise, implementation-specific commit messages.
- Add conventional commits only if the project explicitly adopts them.
- Do not commit secrets, `.env` files, wallet keys, CSPR.cloud access tokens, provider API keys, generated private keys, or live payment credentials.
- Keep context artifacts and implementation commits logically separated where practical.

## AGENTS.md Notes

Current disk state:

- No `AGENTS.md` file exists in `/Users/abu/dev/hackathon/casper-agentic`.

Active thread rule:

- The current session includes an AGENTS-style instruction requiring Context7 (`npx ctx7@latest`) for current library, SDK, API, CLI, framework, and cloud-service documentation.
- Before choosing or using Next.js, React, MCP SDKs, CSPR.cloud APIs, x402 packages, Casper SDKs, database tools, or deployment services, use Context7 according to that rule.
- The earlier `npx` issue was resolved by loading Homebrew shell env first:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)" && npx ctx7@latest ...
```

Future repo note:

- When an implementation repo is created, add an actual `AGENTS.md` that records Context7 usage, quality gates, secret rules, and the Context Engineering flow order.

## Open Questions

These questions should remain open until the correct Context Engineering step reaches them:

- Which implementation stack will be approved after prototype discovery?
- Will the first provider source be manual tool definition, OpenAPI import, existing MCP proxy, or a mix?
- Should the prototype-default `Hosted encrypted signer` remain the MVP wallet/signing mode after implementation architecture review?
- Will live Casper Testnet settlement be required before prototype acceptance, or only before implementation handoff?
- Which settlement path will be used: CSPR.cloud facilitator or self-hosted `make-software/casper-x402`?
- Which storage layer will be chosen after scaffold: SQLite, Postgres, or another option?
- What deployment target will the hackathon demo use?
- Will OAuth 2.1 be implemented in MVP, or will scoped static client tokens ship first with OAuth preserved as architecture?
- Is the cdr-kit-derived design system accepted as the Casper Gateway visual base or inspiration only?
- Should registry endpoint-state labels avoid the word `Live` when global settlement/proof mode is Simulated?

## Finalization Note

This profile is finalized for the research/prototype-delta/planning phase only. It does not approve implementation. The next strict Context Engineering step is implementation only if Abu explicitly approves executing the research-backed plan.
