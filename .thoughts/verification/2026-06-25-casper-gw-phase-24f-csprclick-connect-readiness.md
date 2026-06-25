# Verification: Phase 24F CSPR.click Connect Readiness

Date: 2026-06-25

## Scope

Phase 24F prepares the paid console for a real browser-wallet smoke by making CSPR.click connection state visible and actionable.

This slice does not run a live wallet approval, sign an x402 payment, settle through the facilitator, or create a new deploy hash.

## Context Anchors

- Plan: `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- Current front door: `.thoughts/README.md`
- Local reference:
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/index.html`
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/public/app.js`
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/src/App.tsx`
- Context7: `/websites/cspr_click` docs for local `csprclick-template` app id, init options, and CSPR.click account events.

## Implementation Evidence

- `.env.example`
  - Adds public-only CSPR.click local-development config.
  - Keeps private signer, CSPR.cloud, and operator credentials server-side/empty.

- `src/lib/csprclick-client-config.ts`
  - Passes explicit `process.env.NEXT_PUBLIC_*` keys into `getCSPRClickPublicConfig`.
  - Fixes the browser bundle issue where dynamic `process.env` was not inlined.

- `src/components/gateway-app.tsx`
  - Adds `id="app"` and a real `#csprclick-ui` mount element, matching the CSPR.click reference layout.

- `src/lib/csprclick-browser.ts`
  - Defaults `rootAppElement` to `#app`.
  - Reports `signInAvailable` separately from client/runtime availability.

- `src/lib/csprclick-browser-session.ts`
  - Binds CSPR.click signed-in/switched/signed-out/disconnected events.
  - Refreshes app state immediately when the delayed `csprclick:loaded` event binds the SDK client.
  - Requests app-level `signIn()` only when the SDK client exposes it.

- `src/components/screens/use-paid-call-console.ts`
  - Tracks browser signing state from CSPR.click runtime/client/account status.
  - Prevents browser paid runs until a CSPR.click account is connected.

- `src/components/screens/test-console-wallet-actions.tsx`
  - Shows active CSPR.click account status.
  - Shows `Connect CSPR.click wallet` only when `signIn()` is actually callable.
  - Keeps the integration signer path separate.

- `src/server/wallet-signing-readiness.ts`
  - Reports public CSPR.click runtime config as `configured` without claiming live proof or production custody.

## Chrome Evidence

Run with public localhost CSPR.click config:

```bash
NEXT_PUBLIC_CSPR_CLICK_APP_ID=csprclick-template \
NEXT_PUBLIC_CSPR_CLICK_APP_NAME='Casper GW' \
NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE=popup \
NEXT_PUBLIC_CSPR_CLICK_PROVIDERS=casper-wallet,ledger,metamask-snap \
NEXT_PUBLIC_CASPER_CHAIN_NAME=casper-test \
pnpm dev -p 3010
```

Observed in Chrome at `http://localhost:3010/app`:

- CSPR.click script inserted: `https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js`.
- App root exists: `#app`.
- CSPR.click UI mount exists: `#csprclick-ui`.
- CSPR.click top bar renders `Sign in`.
- App-level `Connect CSPR.click wallet` opens the account iframe:
  - `https://accounts.cspr.click/v2.1/index.html?...appId=csprclick-template&chainName=casper-test&origin=http://localhost:3010...`

No wallet approval or x402 spend was submitted.

## Verification Commands

Focused tests:

```bash
pnpm exec vitest run tests/unit/csprclick-browser.test.ts tests/unit/csprclick-browser-session.test.ts tests/unit/csprclick-client-config.test.ts tests/unit/wallet-signing-readiness.test.ts --reporter=dot
```

Result: 4 files passed, 14 tests passed.

Typecheck and lint:

```bash
pnpm typecheck
pnpm lint
```

Result: passed.

File guard:

```bash
pnpm run guard:files
```

Result: passed with no file-size warnings.

Independent review:

- Initial finding: delayed CDN load could bind account events without immediately refreshing app state.
- Fix: `bindCSPRClickAccountEvents` now calls `onChange()` after successful SDK event binding.
- Regression coverage: `tests/unit/csprclick-browser-session.test.ts` includes delayed `csprclick:loaded`.

## Not Yet Proven

- No user completed CSPR.click sign-in in the iframe.
- No active CSPR.click public key was matched against a wallet profile.
- No browser-wallet x402 signature, settlement, or deploy proof was produced.

## Next Gate

The next live gate is user/browser-gated:

1. Sign in through CSPR.click in Chrome.
2. Create or select a Casper GW wallet profile whose account/public key matches the active CSPR.click account.
3. Confirm the wallet has CSPR gas and WCSPR.
4. Run one `get_quote` browser-approved x402 call.
5. Persist and inspect the four-layer receipt in the public explorer.
