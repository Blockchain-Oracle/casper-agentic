# Verification: Phase 24G CSPR.click Primary-Source Refresh

Date: 2026-06-25

## Scope

This slice corrects the CSPR.click research and integration source order before the next live browser-signing attempt.

It does not run a wallet approval, sign an x402 payment, settle through the facilitator, or create a new deploy hash.

## Sources Checked

- Installed official CSPR.click agent skill:
  - `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`
- Upstream examples clone:
  - `.thoughts/raw/repos/csprclick-examples`
  - Latest checked commit: `40a436e3f105ca106a9a6481c4b48b452c757bcf`
- Upstream Next.js template clone:
  - `.thoughts/raw/repos/csprclick-nextjs-template`
  - Latest checked commit: `e90ae47e2d3f1352afaa03c316622c257c77a412`
- Casper x402 CSPR.click reference:
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402`
- Current docs:
  - `https://docs.cspr.click/cspr.click-sdk/integration/download-and-initialize.md`
  - `https://docs.cspr.click/cspr.click-sdk/integration/react-context-provider.md`
  - `https://docs.cspr.click/cspr.click-sdk/integration/handling-events.md`
  - `https://docs.cspr.click/cspr.click-sdk/integration/connecting-a-wallet.md`
  - `https://docs.cspr.click/cspr.click-sdk/integration/signing-transactions.md`
  - `https://docs.cspr.click/cspr.click-sdk/integration/processing-status-updates.md`
  - `https://docs.cspr.click/cspr.click-sdk/reference/types.md`
  - `https://docs.cspr.click/cspr.click-sdk/reference/methods.md`
  - `https://docs.cspr.click/cspr.click-sdk/reference/cloud-proxies.md`
  - `https://docs.cspr.click/sitemap.md`
- Context7:
  - `/websites/cspr_click`
  - `/make-software/csprclick-examples`
- NPM metadata:
  - `@make-software/csprclick-core-types@2.1.0`
  - `@make-software/csprclick-ui@2.1.0`

## Findings

- The official CSPR.click skill is installed and readable, but the current package only contains `SKILL.md`; the docs page that mentions `references/llms.txt` is stale for the installed skill layout.
- The examples README points to a moved docs URL for the React template guide. The current sitemap points to `cspr.click-sdk/integration/react-context-provider.md`.
- Current docs, the TypeScript example, the React example, and the CSPR.click skill all support the CDN runtime path:
  - assign `window.clickUIOptions`,
  - assign `window.clickSDKOptions`,
  - inject `https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js`,
  - wait for `csprclick:loaded` before SDK calls.
- Current docs require `clickUIOptions` and recommend explicit `uiContainer`, `rootAppElement`, `show1ClickModal`, `showTopBar`, `accountMenuItems`, and `defaultTheme`.
- Current types mark `getActiveAccount()` deprecated and prefer `getActiveAccountAsync()`.
- Current `signTypedData()` type returns the shape Casper GW already modeled: `cancelled`, `signatureHex`, `digest`, `publicKey`, `error`, and optional `errorCode`.
- The Next.js template uses `@make-software/csprclick-ui`, but its package still has React 18 peer dependencies. Casper GW is React 19, so switching to that UI package without a dedicated compatibility pass would be riskier than the current CDN/custom-provider path.
- The x402 CSPR.click reference signs EIP-712 typed data and submits the x402 payment payload through `PAYMENT-SIGNATURE`, which remains the correct target for Casper GW browser signing.

## Code Changes

- Added current official CSPR.click types:
  - `@make-software/csprclick-core-types@2.1.0`
- Updated `src/lib/csprclick-browser.ts` to:
  - type SDK/UI options from the official package,
  - set `show1ClickModal` and `showTopBar` explicitly,
  - prefer `getActiveAccountAsync()` and fall back to `getActiveAccount()`,
  - keep `signTypedData()` aligned to the official type shape.
- Added `src/lib/csprclick-browser-config.ts` to keep CSPR.click config/types below the file-size warning threshold.
- Updated `AGENTS.md` so future CSPR.click work starts from:
  - installed CSPR.click skill,
  - upstream CSPR.click examples,
  - Casper x402 CSPR.click reference,
  - Context7/direct docs.

## Decision

Keep the current CDN/custom-provider integration for this phase.

Do not migrate to `@make-software/csprclick-ui` yet, because the current docs support the CDN path and the UI package has React 18 peer constraints while Casper GW runs React 19. Revisit the package/provider migration only as a separate compatibility slice.

## Not Yet Proven

- No user completed CSPR.click sign-in in Chrome after this refresh.
- No browser wallet signed x402 typed data after this refresh.
- No browser-approved CSPR.click settlement/deploy proof exists yet.

## Verification Commands

Focused CSPR.click tests:

```bash
pnpm exec vitest run tests/unit/csprclick-browser.test.ts tests/unit/csprclick-browser-session.test.ts tests/unit/csprclick-client-config.test.ts tests/unit/browser-paid-call-flow.test.ts tests/unit/browser-x402-signing.test.ts --reporter=dot
```

Result: 5 files passed, 27 tests passed.

Full CI:

```bash
pnpm run ci
```

Result:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm verify`: passed.
- `pnpm test`: 55 files passed, 228 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.
- `pnpm build`: passed.

## Independent Review

Reviewer: `Heisenberg`

Finding:

- Should-fix: `getActiveAccountAsync()` resolving `null` could fall back to deprecated sync account state and revive stale connection state.

Resolution:

- Fixed `getActiveAccount()` helper to fall back to sync state only when the async method is absent or throws.
- Added a unit test for async `null` plus stale sync account data.
