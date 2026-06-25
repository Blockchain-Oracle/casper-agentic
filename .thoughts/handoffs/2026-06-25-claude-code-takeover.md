# Handoff: Claude Code Takeover For Casper GW

Date: 2026-06-25

## Objective

Help Claude Code take over the Casper GW repo from the current Codex implementation state, audit what has been built, verify the workflow, and continue only through Context Engineering gates.

Claude should treat this as a review-and-continuation handoff, not as permission to redesign broadly or invent new product scope.

## Current State

- Private GitHub repo: `https://github.com/Blockchain-Oracle/casper-agentic`
- Default branch: `main`
- Current implementation branch: `feat/casper-gw-phase-0`
- Current HEAD: `e17d1ad docs: merge design and signing research artifacts`
- `main` and `feat/casper-gw-phase-0` both point at the current HEAD.
- `CLAUDE.md` delegates to `AGENTS.md`; Claude should read `AGENTS.md` and `.thoughts/README.md` first.
- The current UI is an engineering scaffold. Do not use it as visual design truth or inspiration.
- Real Casper Testnet proof already exists for local/Testnet-signer x402 settlement; browser-approved CSPR.click x402 settlement has not yet been proven.

## Key Decisions

- Product shape remains Casper GW / Casper Agent Commerce Gateway:
  - provider gateway for API/OpenAPI/remote MCP tools,
  - wallet/readiness/policy control plane,
  - paid x402 tool runner,
  - public explorer,
  - four-layer receipts.
- Public explorer is public: no sign-in, no wallet connection, no app sidebar.
- `/app` is protected by wallet/operator connection.
- Receipt layers stay separate: gateway context, policy decision, x402 verify/settle, Casper proof.
- Credential planes stay separate: provider upstream credentials, endpoint client access, wallet/payment authorization.
- No registry/private-tool marketplace, no sandbox product surface, no Simulated/Local product modes, no fake proof, no production custody claim, no Mainnet claim.
- CSPR.click browser signing is a per-signature browser approval path, not a documented pre-approved/autonomous agent-wallet path.
- Configured CSPR.click provider capability rows are no-spend preflight evidence. Current/connected provider identity matters only after wallet connection.

## Artifacts

Read in this order:

1. `AGENTS.md`
2. `.thoughts/README.md`
3. `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
4. `.thoughts/wiki/agent-commerce-gateway-current-truth.md`
5. `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
6. `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
7. `.thoughts/design/2026-06-25-casper-gw-designer-product-flow-brief.md`
8. `.thoughts/design/2026-06-25-casper-gw-designer-prompt.md`
9. `.thoughts/research/2026-06-25-casper-gw-signing-modes-reality.md`
10. Latest CSPR.click verification files:
    - `.thoughts/verification/2026-06-25-casper-gw-phase-24o-browser-failure-closeout.md`
    - `.thoughts/verification/2026-06-25-casper-gw-phase-24p-provider-compatibility-preflight.md`
    - `.thoughts/verification/2026-06-25-casper-gw-phase-24q-provider-capability-probe.md`
    - `.thoughts/verification/2026-06-25-casper-gw-phase-24r-provider-chooser-action.md`
    - `.thoughts/verification/2026-06-25-casper-gw-phase-24s-disconnected-provider-noise.md`

Historical proof anchors:

- Phase 0 audit: `.thoughts/verification/2026-06-22-casper-gw-phase-0.md`
- Phase 3 audit: `.thoughts/verification/2026-06-23-casper-gw-phase-3-paid-tool-console-settlement.md`
- Phase 7 audit: `.thoughts/verification/2026-06-23-casper-gw-phase-7-hosted-endpoint-settlement.md`

## Files Changed Recently

Latest documentation merge:

- `.thoughts/design/2026-06-25-casper-gw-designer-product-flow-brief.md`
- `.thoughts/design/2026-06-25-casper-gw-designer-prompt.md`
- `.thoughts/research/2026-06-25-casper-gw-signing-modes-reality.md`
- `.thoughts/README.md`

Latest CSPR.click provider-noise cleanup:

- `src/lib/csprclick-browser.ts`
- `src/components/screens/browser-signing-state.ts`
- `src/components/screens/settings-signing-mode.ts`
- `tests/unit/csprclick-disconnected-provider.test.ts`
- `tests/unit/browser-signing-state.test.ts`
- `tests/unit/settings-signing-mode.test.ts`
- `tests/browser-csprclick/app-connect.spec.ts`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24s-disconnected-provider-noise.md`

## Commands And Results

Recently passed:

- `pnpm guard:files`
- `pnpm guard:product`
- `pnpm guard:secrets`
- `pnpm guard:workflows`
- `git diff --check`
- `pnpm verify` passed with 64 test files and 259 tests.
- `pnpm build` passed.
- `pnpm test:browser` passed with 19 passed and 3 intentional mobile skips.
- `pnpm test:browser:csprclick` passed with 2 tests.
- `pnpm run ci` passed end to end.

Note: `pnpm ci` is not implemented by pnpm in this environment. Use `pnpm run ci`.

## Recommended Claude Code Audit Workflow

Claude should spin up focused review agents or subagents before changing code. Suggested review slices:

1. Product/context review:
   - Check `.thoughts/README.md`, current spec/stories, designer flow docs, and signing-modes research for contradictions.
2. Security/credential review:
   - Check that CSPR.cloud tokens, signer material, provider upstream credentials, endpoint client tokens, and private request data are never exposed to client UI, explorer, receipts, logs, or fixtures.
3. x402/Casper proof review:
   - Check CSPR.cloud verify/settle handling, receipt status rendering, deploy-hash proof boundaries, and no fake `settled` claims.
4. CSPR.click browser-signing review:
   - Check current SDK usage, provider capability probing, sign-in/provider chooser behavior, typed-data shape, account/profile matching, and failure closeout.
5. Public explorer review:
   - Check that `/explorer` remains public and separates Casper GW receipts from external CSPR.cloud proof.
6. UI/UX review:
   - Review flows against the new designer product-flow brief. Do not treat the current UI as visual truth.
7. Test/CI review:
   - Check file-size guard, product guard, secret scan, unit tests, browser tests, and CI workflow coverage.

After the audit, Claude should write a new verification artifact in `.thoughts/verification/` before committing any changes.

## Open Questions

- The next live browser-approved x402 attempt likely needs a CSPR.click provider that advertises `sign-typed-data-eip712`, such as the CSPR.click Web Wallet provider, not the Casper Wallet extension path that rejected typed-data signing.
- Hosted pre-approved agent-wallet signing is not documented as a Casper/CSPR.click primitive. It needs separate reality research and custody/security acceptance before implementation.
- The visual design is not accepted. The new designer product-flow docs are the source for the next designer pass.
- Remote deployment, public scanner/discovery, streaming runtime consumption, OAuth, and production custody remain out of scope unless Abu accepts a new plan.

## Risks Or Blockers

- Do not spend WCSPR or perform live browser-approved settlement without Abu approving the specific live action.
- Do not use the current UI as design evidence.
- Do not import stale dirty code from old Codex worktrees without comparing it against current HEAD; only the document artifacts were intentionally merged.
- Do not claim browser-approved settlement until a real CSPR.cloud settle success and Casper deploy hash exist.
- Do not rewrite commit history just to adjust dates. Current commit dates are preserved on GitHub.

## Next Steps

1. Pull the private GitHub repo and verify HEAD is `e17d1ad`.
2. Read `AGENTS.md`, `.thoughts/README.md`, and this handoff.
3. Run `pnpm install --frozen-lockfile`.
4. Run `pnpm run ci`.
5. Spawn the focused review agents listed above.
6. Consolidate findings into a verification/audit artifact under `.thoughts/verification/`.
7. Fix only confirmed blockers or Abu-approved next-slice work.
8. Re-run relevant focused tests, then `pnpm verify`, browser smoke, and build.
9. Commit and push to `feat/casper-gw-phase-0` and fast-forward `main` only when the slice is stable.

## Resume Prompt

Take over Casper GW from the private GitHub repo `Blockchain-Oracle/casper-agentic`. Start at `AGENTS.md`, `.thoughts/README.md`, and `.thoughts/handoffs/2026-06-25-claude-code-takeover.md`. Audit the current implementation and documentation with focused subagents before changing code. Preserve Context Engineering gates, do not use the current UI as visual truth, do not claim browser-approved settlement without real CSPR.cloud settle/deploy proof, and write a verification artifact before committing changes.
