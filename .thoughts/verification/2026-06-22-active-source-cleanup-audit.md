# Verification Audit: Active Source Cleanup

Date: 2026-06-22
Status: Focused cleanup audit. This is not final product verification.

## Verdict

Conditional pass.

The active app source now matches the accepted product boundaries for the rejected prototype concepts: no top-level registry surface, no private/public tool model, no sandbox product surface, no user-facing Simulated/Local mode rail, no fake deploy hash, and public explorer is separated from the app shell.

This does not verify real Casper x402 settlement. The app is still fixture-backed and must not be presented as live Testnet proof.

## Artifacts Checked

- `.thoughts/README.md`
- `.thoughts/quality/2026-06-22-casper-gw-current-quality-profile.md`
- `.thoughts/specs/2026-06-22-casper-gw-current-spec.md`
- `.thoughts/stories/2026-06-22-casper-gw-current-stories.md`
- `.thoughts/design/2026-06-22-design-direction-and-structure.md`
- `.thoughts/design/2026-06-22-designer-reset-brief.md`
- `.thoughts/prototype-reintegration/2026-06-22-casper-gw-reintegration-and-codex-handoff.md`
- Active source under `src/`

## Requirement Traceability

| Requirement | Evidence | Result |
| --- | --- | --- |
| Remove top-level registry/private-tool semantics | Deleted `src/components/screens/registry-screen.tsx` and `src/app/api/registry/tools/route.ts`; removed `RegistryTool`, `registryTools`, public/private endpoint chips, and public registry pricing toggle. | Pass |
| Replace sandbox with endpoint-first console | Deleted `src/components/screens/sandbox-screen.tsx`, `src/app/api/demo/run/route.ts`, and `src/lib/sandbox-timeline.ts`; added `src/components/screens/test-console-screen.tsx`. | Pass |
| Remove user-facing Simulated/Local modes | Removed `Mode`, `modes`, runtime mode rail, settings runtime selector, and mode query param from receipt API. | Pass |
| Public explorer must not be an app-shell tab | Removed explorer from `Screen`; added public `/explorer`; operator app now lives at `/app`. | Pass |
| Do not show fake proof | Fixture receipts have no deploy hashes; `buildReceiptDetail` only renders real proof when `receipt.status === "settled"` and `receipt.hash` exists. | Pass |
| Keep receipt layers separate | Existing explorer still renders gateway context, policy decision, x402 verify/settle, and Casper proof panels. | Pass |
| Keep credential planes separate | Import, endpoint, wallet, and settings copy still separate provider upstream credentials, MCP client access, and wallet/payment authorization. | Pass |

## Acceptance Criteria Coverage

- Spec AC-02: Covered. Active source no longer requires registry, public/private labels, Simulated/Local mode rail, or demo sandbox.
- Spec AC-08: Covered for fixture UI. No fake deploy hash is shown; live success is not claimed.
- Spec AC-10: Partially covered. `/explorer` is public and not inside the app shell. Browser smoke screenshots were not captured in this cleanup pass.
- Spec AC-11: Covered at UI structure level by `ExplorerScreen` and `buildReceiptDetail`.
- Story 3: Covered for removal of public/private registry toggle.
- Story 7: Partially covered. The console now follows endpoint-first language and flow, but discovery/payment remain fixture-backed.
- Story 10: Partially covered. Public explorer route exists; full search/filter and browser verification remain future work.
- Story 12: Covered for stale-scope cleanup; design artifacts already warn against reintroducing registry/sandbox/modes.

## Quality Gates

Commands run:

```bash
npm run lint
npm run typecheck
npm run build
```

Result: all pass.

Build routes after cleanup:

```text
/
/_not-found
/api/dashboard
/api/receipts
/app
/explorer
```

Stale active-source scan:

```bash
rg -n "registry|Registry|sandbox|Sandbox|simulated|Simulated|local facilitator|Local|publicRegistry|registryTools|SandboxScenario|Demo Sandbox|send policy|private tool|private registry|hidden registry" src
```

Result: no matches.

Secret-file scan:

```bash
find . -maxdepth 3 -type f \( -name '.env*' -o -name '*key*' -o -name '*secret*' \) -not -path './node_modules/*' -not -path './.next/*' -not -path './.thoughts/raw/repos/*' -print
```

Result: no matches.

HTTP smoke checks against the local dev server:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/app
curl -I 'http://localhost:3000/explorer?receipt=rcp_8f42a1'
curl -s http://localhost:3000/api/receipts
```

Result: `/`, `/app`, and `/explorer?receipt=rcp_8f42a1` returned `HTTP/1.1 200 OK`; `/api/receipts` returned `network: casper:casper-test` and fixture receipt data with `hash: null`.

## Deviations From Plan

- This cleanup did not implement the Phase-0 real settlement loop. It only removed rejected prototype concepts from active source.
- The paid tool console remains fixture-backed and must be replaced with real endpoint discovery, policy pre-check, signing, x402 verify/settle, and receipt persistence during Phase 0.
- Public explorer exists as a route, but receipt data is fixture-backed.

## Gaps And Risks

- No test suite exists yet.
- No browser screenshot verification was run in this cleanup pass.
- `src/app/globals.css` is still above the 300-line hard cap.
- `src/lib/fixtures.ts` is still above the 200-line warning threshold.
- Wallet readiness is still fixture-backed and must become CSPR.cloud-derived.
- Real CSPR.cloud/facilitator integration still needs Abu-provided credentials and token/signing decisions.

## Follow-ups

1. Accept this cleanup audit.
2. Split `globals.css` and fixture data during the next implementation planning pass, or explicitly justify temporary exceptions.
3. Produce the research-backed plan for the smallest real Phase-0 loop.
4. Add tests when real policy, receipt, and x402 client logic appears.
5. Capture browser screenshots after the next UI pass or before any final verification claim.

## Evidence Log

- Deleted obsolete registry, sandbox, and demo API files.
- Added `/app` and `/explorer` routes.
- Added `TestConsoleScreen`.
- Updated receipt detail proof logic.
- Updated quality profile after cleanup.
- Used Context7 for current Next.js `Link` and `useSearchParams` behavior during route cleanup.
- Started local dev server and smoke-checked `/`, `/app`, `/explorer`, and `/api/receipts`.
