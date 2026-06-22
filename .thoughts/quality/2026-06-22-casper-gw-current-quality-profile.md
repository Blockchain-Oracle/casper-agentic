# Project Quality Profile: Casper GW Current Build Gate

Date: 2026-06-22
Status: Current quality gate after active-source cleanup. Supersedes the 2026-06-18 quality profile for current product scope.

This profile is a gate artifact, not an implementation plan. It exists to keep the next Context Engineering stages honest before new build work starts.

## Detected Stack

Project root:

```text
/Users/abu/dev/hackathon/casper-agentic
```

Observed stack:

- Next.js App Router.
- React 19.
- TypeScript with `strict` enabled.
- pnpm `10.33.0` pinned through `packageManager`.
- `pnpm-lock.yaml`.
- ESLint flat config using Next.js `core-web-vitals` and TypeScript rules.
- App source under `src/app`, `src/components`, and `src/lib`.
- Product context and research under `.thoughts/`.
- Cloned reference repos under `.thoughts/raw/repos/`.

Important scoping note:

- The Context Engineering stack detector correctly found Next.js, TypeScript, npm-era package metadata, and ESLint signals before the package-manager migration.
- It also sampled source files inside `.thoughts/raw/repos/`, especially cloned reference projects. Those files are research evidence, not this product's application code.
- All build gates in this profile apply to the Casper GW app source, not vendored or cloned reference repos.

Current project state:

- The root is not a Git repository.
- No `.github/` CI config or `.husky/` hooks were found.
- No project test script is defined.
- `package-lock.json` has been removed and ignored to prevent package-manager drift.
- `pnpm-lock.yaml` is the authoritative lockfile.
- Shallow secret-file scan found no `.env*`, `*key*`, or `*secret*` files outside excluded folders.

Current app validation:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

All three passed after the pnpm migration on 2026-06-22.

Current build routes include:

```text
/
/_not-found
/api/dashboard
/api/receipts
/app
/explorer
```

The passing build proves the current app is mechanically valid. It does not prove real Casper Testnet settlement exists.

## Current Source Alignment Status

The active `src/` app has now been cleaned of rejected prototype product concepts.

Removed or replaced:

- `src/components/screens/registry-screen.tsx`
- `src/app/api/registry/tools/route.ts`
- registry datasets and public/private registry toggles,
- `src/components/screens/sandbox-screen.tsx`
- `src/app/api/demo/run/route.ts`
- `src/lib/sandbox-timeline.ts`
- sandbox scenario state,
- user-facing Simulated/Local/Live runtime mode rail,
- fake deploy hashes in fixture receipts,
- internal app-shell explorer tab.

Current active structure:

- `/` public overview.
- `/explorer` public explorer without the authenticated app shell.
- `/app` authenticated/operator app shell.
- `/api/dashboard` fixture-backed dashboard summary.
- `/api/receipts` fixture-backed receipt detail API.
- `TestConsoleScreen` replaces the old sandbox with endpoint-first paid-tool-console language.
- Fixture receipts are proof-pending or failure/block states; no fake deploy hash is displayed.

Quality conclusion:

- Source is now aligned with the current product boundaries at the language, route, and active-surface level.
- It remains a fixture-backed prototype, not a real Phase-0 Casper settlement implementation.
- Do not claim live settlement until a real Testnet deploy hash is produced and stored.

## Existing Commands

Root commands:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

`package.json` currently defines:

- `dev`: local Next.js dev server.
- `lint`: ESLint.
- `typecheck`: TypeScript `tsc --noEmit`.
- `build`: production Next.js build.
- `start`: production Next.js server.

Missing commands:

- No test command.
- No format command.
- No CI command.
- No file-size command.
- No product-scope guard command.
- No secret-scan command.

## Required Local Checks

Before any new implementation pass:

1. Read `.thoughts/README.md`.
2. Read `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`, especially section `0. Engineering Rules of Engagement`.
3. Read `.thoughts/wiki/agent-commerce-gateway-current-truth.md`.
4. Read `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`.
5. Read `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`.
6. If touching design, read `.thoughts/design/2026-06-22-design-direction-and-structure.md` and the designer reset artifacts.
7. If touching Casper, x402, MCP, Next.js, React, SDK, CLI, or API syntax, use Context7 per `AGENTS.md`.

Required mechanical checks after changes:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Required product-alignment checks after changes:

- Search active `src/` code for rejected concepts: `private tool`, `private registry`, `hidden registry`, `Demo Sandbox`, `sandbox`, `Simulated`, `Local`, `send policy`, and stale top-level `registry` framing.
- Any remaining use must be intentionally accepted in a current `.thoughts/` artifact, or removed before implementation handoff.
- Verify public explorer routes are not placed inside the authenticated app shell or sidebar.
- Verify `/explorer` and receipt detail pages are viewable without sign-in or wallet connection.
- Verify authenticated `/app` surfaces are separated from public explorer surfaces.
- Verify provider upstream credentials, MCP client access auth, and x402 wallet/payment authorization stay separate.
- Verify receipt UI and data keep gateway context, policy decision, x402 verify/settle state, and Casper proof separate.
- Verify no UI claims `Paid on Testnet`, `settled`, or shows a deploy-hash link unless a real Casper Testnet deploy hash exists.

Required secret checks before handoff:

- No committed `.env`.
- No wallet private keys or seed phrases.
- No `CSPR_CLOUD_API_KEY`.
- No provider upstream API keys.
- No MCP client bearer tokens.
- No live-looking mock prefixes such as `sk_live`.
- No provider credentials in client state, endpoint metadata, receipts, exports, logs, or browser-visible fixtures.

## Required CI Gates

No CI exists today.

Future CI should include:

- `pnpm install --frozen-lockfile` or `pnpm ci`,
- lint,
- typecheck,
- production build,
- file-size check,
- product-scope stale-term scan,
- secret scan,
- unit tests,
- integration tests,
- browser smoke tests.

Minimum future unit tests:

- spend policy evaluation,
- policy block creates a receipt but does not attempt settlement,
- wallet readiness calculation,
- endpoint discovery and generated input fields,
- pricing and payment requirement generation,
- x402 verify/settle client success and failure handling,
- receipt redaction,
- receipt-layer rendering,
- auth-boundary labels.

Minimum future integration tests:

- provider source discovery from API/OpenAPI/remote MCP,
- hosted MCP/x402 endpoint requires correct client access,
- upstream provider credentials never leak,
- paid tool call returns x402 payment requirement,
- facilitator verify failure creates correct receipt state,
- facilitator settle failure creates correct receipt state,
- successful Testnet settlement persists real deploy hash when credentials and funding are available.

Minimum future browser checks:

- public explorer list and receipt detail without auth,
- authenticated app dashboard without public explorer sidebar leakage,
- connect/provision wallet,
- fund-wallet journey,
- spend policy controls,
- endpoint-first paid tool test console,
- receipt proof layers,
- settings/audit trust boundaries,
- desktop and mobile layouts.

Live Casper Testnet gate:

- A live Testnet claim requires an actual deploy hash resolvable on `testnet.cspr.live`.
- If `CSPR_CLOUD_API_KEY`, wallet funding, signing mode, or CEP-18 payment-token details are missing, the implementation must stop and ask Abu instead of pretending settlement happened.

## Suggested Hooks

Current hooks:

- None. The root is not a Git repository.

Suggested hooks after Git initialization:

- pre-commit file-size warning for active app source,
- secret scan for `.env`, wallet material, bearer tokens, API keys, and live-looking mock prefixes,
- product-scope guard for rejected terms in active `src/`,
- lint changed source files,
- optional typecheck if fast enough.

Hooks must exclude:

- `.thoughts/raw/repos/`,
- `node_modules/`,
- `.next/`,
- generated files,
- lockfiles,
- build output,
- downloaded reference material.

## File Size Policy

Default app source policy:

- Target: 200 lines or fewer.
- Warning: above 200 lines.
- Hard cap: above 300 lines.

Exclusions:

- `.thoughts/raw/`,
- `.thoughts/raw/repos/`,
- `node_modules/`,
- `.next/`,
- generated files,
- build output,
- lockfiles.

Current size debt:

- `src/app/globals.css`: 930 lines. This is above the hard cap and must be split, reduced, or explicitly justified before final implementation verification.
- `src/lib/fixtures.ts`: 239 lines. This is above the warning threshold and should be split before the next broad implementation pass.
- `src/components/gateway-app.tsx`: 200 lines. This is at the target boundary after cleanup; keep it from growing.

Do not enforce this policy against cloned reference repos under `.thoughts/raw/repos/`.

## Commit Policy

Current policy:

- No Git policy is active because the project root is not a Git repository.

Future policy after Git initialization:

- Use concise, implementation-specific commit messages.
- Adopt conventional commits only if the project explicitly chooses them.
- Keep context artifacts and implementation changes logically separated where practical.
- Never commit `.env`, wallet keys, seed phrases, `CSPR_CLOUD_API_KEY`, provider API keys, generated private keys, or live payment credentials.

## AGENTS.md Notes

`AGENTS.md` exists at project root and is active project policy.

Important current rules from `AGENTS.md`:

- Use local `.thoughts/` first for Casper GW product, UX, MCP Pay/x402 inspiration, wallet-policy, registry, explorer, and hackathon-positioning decisions.
- Do not browse broadly for these product decisions before checking local reports and cloned repos.
- Use Context7 for current library/API/SDK/CLI documentation.
- Do not present `Simulated` or `Local` as user-facing product modes unless Abu re-accepts that direction.
- Public explorer is public infrastructure and must not require sign-in, wallet connection, or the authenticated app sidebar.
- Do not invent private tools, private registries, or hidden registry modes.
- Treat wallet policy as spend and permission controls for paid agent tool calls, not a generic send-policy product.

When `AGENTS.md` and older `.thoughts/` artifacts conflict, the current 2026-06-22 artifacts and this profile should guide the next step.

## Open Questions

These questions are not blockers for the quality profile, but they are gates for later stages:

- Which test framework should be introduced first: unit tests, Playwright browser tests, or both?
- Which datastore should persist receipt layers during Phase 0?
- What is the first real upstream tool for the paid loop: `cspr-trade-mcp get_quote` or another accepted source?
- Which CEP-18 Testnet payment token/package hash should the live path use?
- Which wallet signing mode is accepted for the first real paid call?
- When should Abu provide `CSPR_CLOUD_API_KEY` and funded Testnet wallet credentials?
- Should CI and Git initialization happen before or after the first implementation pass?
- How should the large global stylesheet and fixture data be decomposed without losing the accepted visual direction?

## Acceptance

This quality profile records the active-source cleanup and approves moving to the next Context Engineering gate only after Abu accepts the focused cleanup audit.

The next strict step is a research-backed implementation plan for the smallest real Phase-0 loop, unless Abu requests more design/prototype work first.
