# Plan: Casper Agent Commerce Gateway

Date: 2026-06-19
Status: Context Engineering research-backed plan; implementation started, stage/code repair audit added

## Inputs

Accepted artifacts:

- Quality profile: `../quality/2026-06-18-agent-commerce-gateway-quality-profile.md`
- Spec: `../specs/2026-06-18-agent-commerce-gateway.md`
- Stories: `../stories/2026-06-18-agent-commerce-gateway.md`
- Designer brief: `../design/2026-06-18-designer-brief.md`
- Prototype discovery: `../prototype-discovery/2026-06-18-casper-agent-commerce-gateway.md`
- Authoritative prototype: `/Users/abu/Downloads/API Design System Scope (1)/Casper Gateway.dc.html`
- Rendered prototype evidence:
  - `../prototype-discovery/casper-gw-updated-desktop-dashboard.png`
  - `../prototype-discovery/casper-gw-updated-mobile-dashboard.png`

Research inputs:

- Reality refresh: `../research/2026-06-18-agent-commerce-gateway-reality-refresh.md`
- MCP gateway auth reality: `../research/2026-06-18-mcp-gateway-auth-reality.md`
- Casper x402 explorer reality: `../research/2026-06-18-casper-x402-explorer-reality.md`
- Casper x402 on-chain identification: `../research/2026-06-18-casper-x402-onchain-identification.md`
- Product context wiki: `../wiki/agent-commerce-gateway-product-context.md`
- CSPR.cloud x402 facilitator docs from source index.
- Casper x402 and CSPR.trade MCP repo research from source index.

Current workspace state as of 2026-06-19:

- Next.js App Router scaffold exists at project root.
- The root has `package.json`, `package-lock.json`, `src/`, `README.md`, `AGENTS.md`, and Next.js config.
- The root is still not a Git repository.
- Local commands exist for dev, lint, typecheck, and build.
- Initial mocked-first implementation exists for the product shell, screens, local route handlers, fixtures, receipt detail, and sandbox flow.
- Stage/code audit exists at `../verification/2026-06-19-casper-gw-stage-code-audit.md`.

Context7 note:

- Context7 was used for current Next.js documentation before making the stack recommendation.
- Official Next.js docs confirm App Router `app/` routing, `layout.tsx` / `page.tsx`, and route handlers for HTTP methods such as `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.

## Assumptions

- Implementation should start from one complete paid-tool loop, not a broad marketplace.
- Recommended first stack: TypeScript + Next.js App Router for product UI and local full-stack route handlers.
- Route handlers are suitable for the mocked-first dashboard, registry, receipts, sandbox, and narrow gateway API surface.
- If real MCP transport or settlement integration outgrows Next route handlers, split a dedicated Node gateway service later instead of forcing the UI app to own every protocol concern.
- First provider source path should be OpenAPI-shaped in the UI because the accepted prototype uses that path, but implementation may back it with mock/manual normalized tools first.
- Prototype-default wallet mode is `Hosted encrypted signer`, but production custody architecture remains unresolved.
- First settlement mode should be Simulated with the same receipt state model that live settlement will use later.
- Live Casper Testnet settlement is a later verification milestone, not a prerequisite for the first implemented UI loop.
- The cdr-kit-derived design-system export is inspiration/evidence only unless Abu explicitly accepts it as the Casper Gateway visual base.

## Open Questions

- Should the final submission name be `Casper Gateway`, `casper-gw`, or `Casper Agent Commerce Gateway`?
- Should registry endpoint-state badges avoid the word `Live` when global settlement mode is Simulated?
- Should sandbox include runnable verify-failure, upstream-failure, and MCP-auth-failure scenarios, or keep those in explorer fixtures for MVP?
- Should MVP storage be plain local JSON/fixtures first, SQLite, or a lightweight database chosen during scaffold?
- Which Casper Testnet CEP-18 asset and facilitator path will be used for live proof later?
- Will scoped static client tokens ship first, with OAuth 2.1 preserved as the target architecture?

## Phase 1: Scaffold And Quality Baseline

### Goal

Create the implementation workspace without violating the research-only quality profile.

### Work

- Initialize a real app scaffold under the project root.
- Recommended default:
  - Next.js App Router.
  - TypeScript.
  - `src/` directory.
  - lint/typecheck/build scripts.
- Add root `AGENTS.md` with:
  - Context Engineering flow order,
  - Context7 rule,
  - secret handling,
  - fixture-secret rule,
  - quality gates.
- Add initial README with run commands and prototype/source artifact links.
- Add a minimal fixture directory for prototype-derived mock data.

### Checks

- Root manifest exists.
- `npm`/`pnpm` scripts exist for lint, typecheck, build, and dev.
- Context7 has been used for any framework-specific setup details.
- No source fixture uses live-looking secret prefixes such as `sk_live`.
- No cdr-kit/Story/CDR product copy appears in Casper Gateway app semantics.

### Acceptance Criteria Covered

- AC-18.
- Quality profile research-to-implementation transition gates.

### Stop Condition

The app starts locally with a blank/minimal shell and quality commands are known.

### Current Status

Completed for scaffold and commands. The quality profile has been updated for the implementation transition.

## Phase 2: Product Shell From Accepted Prototype

### Goal

Translate the accepted `Casper Gateway.dc.html` prototype into the chosen app stack without copying the generated HTML blindly.

### Work

- Build app shell:
  - desktop top navigation,
  - mobile hamburger navigation,
  - persistent mode switch,
  - Run demo action.
- Add routes/screens:
  - Operations.
  - Source Import.
  - Tool Pricing And Publish.
  - Hosted Endpoint.
  - Wallet Control Plane.
  - Demo Sandbox.
  - Casper x402 Explorer.
  - Discovery / Registry.
  - Settings & Audit.
- Create reusable UI components:
  - `StatusChip`,
  - `CopyButton`,
  - `ModeSwitcher`,
  - `GuidedDemo`,
  - `TrustBoundaryPanel`,
  - `ReceiptProofLayer`.
- Seed realistic mock data from prototype discovery.

### Checks

- Desktop and mobile screenshots render nonblank.
- All nine screens are reachable.
- Global mode indicator appears on every screen.
- Text does not overlap at desktop or mobile dashboard sizes.
- The first screen is product UI, not a landing page.

### Acceptance Criteria Covered

- AC-01.
- AC-12.
- AC-13.
- AC-18.

### Stop Condition

A judge can navigate the prototype-derived app shell and understand the product loop without backend integration.

### Current Status

Started. The initial app shell and nine screens exist, but browser/fidelity verification is still pending.

## Phase 2R: Code Structure Repair

### Goal

Repair implementation drift introduced by the initial monolithic client component.

### Work

- Split the root app component into a state coordinator plus screen-specific components.
- Keep React/TypeScript files under the 300-line hard cap.
- Keep shared UI primitives separate from product surfaces.
- Keep the refactor behavior-preserving.

### Checks

- `wc -l` confirms React/TypeScript files are under 300 lines.
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Acceptance Criteria Covered

- Quality profile file-size policy.
- AC-18 traceability from prototype evidence into the chosen stack.

### Stop Condition

The app builds after refactor and the next implementation or verification step can proceed from small, traceable files.

### Current Status

Completed. React/TypeScript files are below the 300-line hard cap, lint/typecheck/build pass, and npm audit reports zero vulnerabilities after the PostCSS override.

## Phase 3: Provider Gateway And Endpoint Setup

### Goal

Implement the provider-side mocked workflow through a publishable endpoint state.

### Work

- Source Import:
  - OpenAPI, Remote MCP, Manual route selector.
  - source name, description, URL.
  - upstream auth modes: no-auth, static header, API-key header, bearer token.
  - test connection states: empty, loading, success, 401/error.
- Tool Pricing:
  - tool enable/disable,
  - pricing drawer,
  - network, scheme, asset, amount, payee, timeout,
  - public/private registry visibility.
- Hosted Endpoint:
  - generated endpoint URL,
  - endpoint status,
  - copyable Cursor, Claude Desktop, and custom/curl configs,
  - trust-boundary panels.

### Checks

- Upstream credentials are masked and never appear in endpoint configs, receipts, registry, or client-facing fixtures.
- Pricing validation covers amount, asset, payee account, network, and timeout.
- Client access examples are labeled as client access only, not wallet/payment authorization.
- Endpoint/provider liveness labels are not used as settlement/proof evidence.

### Acceptance Criteria Covered

- AC-02.
- AC-03.
- AC-04.
- AC-13.
- AC-17.

### Stop Condition

One provider source can reach a mocked published endpoint state with valid pricing and safe client setup copy.

## Phase 4: Wallet Policy And Registry Allowlisting

### Goal

Implement operator controls for wallet profiles, spend policy, and registry-driven allowlists.

### Work

- Wallet profiles:
  - `agent-trader-01`,
  - `research-readonly`,
  - network, account hash, signing mode, balance/funding state.
- Prototype-default signing mode:
  - `Hosted encrypted signer`,
  - visibly demo/MVP scoped,
  - no production custody claim.
- Spend policy:
  - max per call,
  - daily/session limit,
  - allowed providers,
  - allowed tools,
  - allowed network/assets,
  - manual approval toggle.
- Policy preview:
  - would allow,
  - would block.
- Registry:
  - public tool search,
  - copy config,
  - add-to-allowlist state.

### Checks

- Policy preview evaluates before any payment/settlement state.
- Blocked spend is represented as a policy outcome, not a generic error.
- Registry private tools are absent.
- Add-to-allowlist action updates visible state.
- Wallet private keys, seed phrases, and signing secrets never appear in UI or fixtures.

### Acceptance Criteria Covered

- AC-05.
- AC-06.
- AC-11.
- AC-16.
- AC-17.

### Stop Condition

An operator can define a wallet policy and add a registry tool into the allowlist path.

## Phase 5: Demo Sandbox And Receipt State Model

### Goal

Build the complete paid-call demo loop in simulated mode with honest receipt outcomes.

### Work

- Sandbox scenarios:
  - settles,
  - policy block,
  - settlement failure.
- Execution timeline:
  - request,
  - policy,
  - x402 verify,
  - x402 settle,
  - result,
  - receipt.
- Scenario-specific receipt routing.
- Receipt fixtures for:
  - settled,
  - blocked,
  - verify failed,
  - settle failed,
  - upstream failed,
  - MCP auth failed,
  - raw proof unavailable.
- Shared receipt status model and proof-layer data shape.

### Checks

- Policy-block scenario does not show settlement proof.
- Settlement-failure scenario is not confused with policy block or settled.
- Settled simulated scenario labels proof as simulated/not broadcast.
- Sandbox receipt link opens the matching receipt for each outcome.
- Paid-call states are keyed by request/call id.

### Acceptance Criteria Covered

- AC-06.
- AC-07.
- AC-08.
- AC-12.
- AC-14.

### Stop Condition

The simulated sandbox can demonstrate the full product loop and every outcome routes to an honest receipt.

## Phase 6: Explorer, Settings, And Audit

### Goal

Make proof, failures, and trust boundaries inspectable.

### Work

- Explorer receipt feed:
  - filters for all, settled, blocked, failed,
  - status chips for each receipt state.
- Receipt detail:
  - Gateway Context.
  - Policy Decision.
  - x402 Verify / Settle.
  - Casper Proof.
- Copy actions for receipt id, endpoint URL, account hash, payee, payer, raw proof link.
- Settings/Audit:
  - masked upstream secrets,
  - client access token/OAuth app scopes and status,
  - facilitator mode,
  - wallet signing mode,
  - audit events.

### Checks

- Receipt detail never implies chain-only proof contains provider, tool, resource URL, pricing rule, or policy decision.
- Raw Casper proof unavailable state is clear.
- Client-auth-failed receipts show policy/payment not reached.
- Settings and audit do not expose provider secrets or wallet secrets.
- Audit events cover source creation, credentials changed, tool priced, endpoint published, policy changed, policy block, settlement failure, settlement success.

### Acceptance Criteria Covered

- AC-09.
- AC-10.
- AC-15.
- AC-17.

### Stop Condition

The explorer and settings screens can explain exactly what happened, what was proven, and what was only simulated.

## Phase 7: Casper x402 Boundary Integration

### Goal

Replace simulated settlement internals with a real Casper x402 boundary only after the UI state model is stable.

### Work

- Use Context7/current primary docs before choosing or coding against:
  - CSPR.cloud facilitator APIs,
  - `make-software/casper-x402`,
  - Casper SDK tooling,
  - MCP SDK/auth packages.
- Implement a facilitator adapter boundary.
- Add mocked facilitator success/failure tests first.
- Add payment requirements, verify outcome, settle outcome, and proof persistence.
- Add live Testnet smoke path only if credentials, funding, asset, and signer mode are ready.

### Checks

- Mock facilitator tests cover verify success/failure and settle success/failure.
- Live settlement is never claimed without a real Casper transaction/deploy hash.
- Simulated/local/live labels remain accurate across dashboard, sandbox, explorer, registry, and settings.
- Settlement errors preserve machine-readable and human-readable reasons where available.

### Acceptance Criteria Covered

- AC-08.
- AC-09.
- AC-10.
- AC-13.

### Stop Condition

The product either produces a real Casper Testnet proof hash or remains clearly simulated with the same receipt model.

## Phase 8: Demo Hardening And Submission Package

### Goal

Prepare the hackathon-ready demo and evidence bundle.

### Work

- Add seed/reset command for demo data.
- Add README/runbook:
  - setup,
  - dev server,
  - test commands,
  - demo flow,
  - environment variables,
  - simulated/local/live proof explanation.
- Add screenshot script or browser smoke test.
- Add submission narrative:
  - why Casper matters,
  - why x402 proof matters,
  - what is simulated versus live,
  - how receipts prove the loop.
- Remove stale screenshot assumptions from handoff; use fresh generated evidence.

### Checks

- Fresh install/run succeeds.
- Lint/typecheck/build pass.
- Browser desktop/mobile smoke screenshots pass.
- Demo path completes.
- Secret scan passes.
- Handoff clearly states whether Casper proof is live, local, or simulated.

### Acceptance Criteria Covered

- AC-01 through AC-18.

### Stop Condition

Another person can run or watch the demo and understand the Casper-specific contribution without hidden assumptions.

## Verification Checkpoint

Before declaring implementation complete:

- Run all local quality gates from the updated quality profile.
- Run browser smoke checks for desktop and mobile.
- Verify all nine surfaces are reachable.
- Verify the sandbox settled/block/fail scenarios route to matching receipts.
- Verify receipt proof layers remain separate.
- Verify no UI, fixture, receipt, export, or client config leaks provider upstream secrets or wallet secrets.
- Verify no live settlement claim exists unless a real Casper transaction/deploy hash exists.
- Produce a verification audit artifact using the Context Engineering verification-audit step.

## Handoff Notes

- This plan is the first accepted planning artifact after prototype discovery.
- The old plan/verification/handoff files created before prototype discovery should not be treated as authoritative.
- Implementation should not start until Abu explicitly approves executing this plan.
- The first implementation slice should be Phase 1 through Phase 5 in simulated mode before attempting live Casper settlement.
