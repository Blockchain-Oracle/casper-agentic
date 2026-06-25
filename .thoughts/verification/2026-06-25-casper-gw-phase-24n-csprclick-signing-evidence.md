# Verification: Phase 24N CSPR.click Signing Evidence

Date: 2026-06-25

## Scope

This slice preserves CSPR.click signing evidence before the next live browser-approved x402 smoke.

It does not run a wallet approval, settle through CSPR.cloud, or claim a deploy hash.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24m-csprclick-typed-data-shape.md`
- Context7 `/websites/cspr_click` docs for `SignTypedDataResult` and `EIP712HashArtifacts`

## Code Changes

- `src/lib/browser-x402-signing.ts`
  - Models optional CSPR.click `hashArtifacts`.
- `src/lib/browser-paid-call-flow.ts`
  - Sends CSPR.click digest, public key, and hash artifacts to browser completion after a successful signature.
- `src/app/api/paid-calls/browser-completions/route.ts`
  - Accepts optional signing evidence.
- `src/server/browser-payment-completion.ts`
  - Sanitizes and records signing evidence in audit events before facilitator verify/settle.
- `src/server/browser-signing-evidence.ts`
  - Keeps the browser evidence sanitizer separate from the completion orchestrator.
- `src/server/browser-payment-completion-outcomes.ts`
  - Carries the typed completion input field.

## Verification Commands

```bash
pnpm exec vitest run tests/unit/browser-paid-call-flow.test.ts tests/unit/browser-payment-completion.test.ts tests/unit/browser-payment-completion-route.test.ts tests/unit/browser-payment-completion-guards.test.ts tests/unit/browser-x402-signing.test.ts --reporter=dot
```

Result: 5 files passed, 27 tests passed.

Full CI:

```bash
pnpm run ci
```

Result:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm verify`: passed.
- `pnpm test`: 57 files passed, 239 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.
- `pnpm test:browser:csprclick`: 1 browser test passed.
- `pnpm build`: passed.

File-size guard passed without warnings after extracting `src/server/browser-signing-evidence.ts`.

Full CI was rerun after the domain-key hardening with the same passing result:

- `pnpm test`: 57 files passed, 239 tests passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.
- `pnpm test:browser:csprclick`: 1 browser test passed.
- `pnpm build`: passed.

## Independent Review

Reviewer `Bohr` passed the diff with no blocking findings.

The reviewer confirmed signing evidence remains audit-only metadata and is not used for facilitator verify/settle, payer matching, Casper proof resolution, public receipt rendering, or tool execution.

Non-blocking hardening requested:

- Cap `domain` key names in signing-evidence audit metadata.

Resolution:

- `src/server/browser-signing-evidence.ts` now trims domain keys to 80 characters.
- `tests/unit/browser-payment-completion.test.ts` covers long key-name truncation.
- Focused tests after the hardening passed: 3 files, 14 tests.
- `pnpm run guard:files`, `pnpm run guard:product`, and `pnpm run guard:secrets` passed.

## Boundaries

- Signing evidence is audit metadata only.
- The server still verifies and settles through CSPR.cloud facilitator using the signed x402 payload.
- Browser-supplied evidence is sanitized before persistence.
- No private keys, CSPR.cloud tokens, provider credentials, endpoint tokens, or local signer material are accepted or exposed.
- No browser wallet approval, Testnet spend, deploy hash, or live proof is claimed by this slice.
