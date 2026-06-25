# Verification: Phase 24I CSPR.click Embedded Provider Config

Date: 2026-06-25

## Scope

This slice fixes a CSPR.click wallet-connection UX defect before the live browser-approved x402 payment smoke test.

The defect was that Casper GW could be run with CSPR.click `popup` mode and extension-only providers. In Chrome, that can send a user without the extension toward `accounts.cspr.click/signin.html` in a separate tab/window instead of first presenting the embedded CSPR.click connection surface with social-login options.

This slice does not click a CSPR.click provider, complete wallet login, sign typed data, spend WCSPR, settle an x402 payment, or claim a deploy hash.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24h-browser-wallet-profile-import.md`
- Installed CSPR.click skill:
  - `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`
- Context7:
  - `/websites/cspr_click`
- Local CSPR.click references:
  - `.thoughts/raw/repos/csprclick-nextjs-template/src/context/ClientProvider.tsx`
  - `.thoughts/raw/repos/csprclick-examples/csprclick-ts/src/app.ts`
  - `.thoughts/raw/repos/casper-x402/go/examples/csprclick-x402/public/app.js`
- Installed CSPR.click types:
  - `node_modules/@make-software/csprclick-core-types/wallets.js`
  - `node_modules/@make-software/csprclick-core-types/wallets.d.ts`

## Findings

- Current docs initialize CSPR.click with `CONTENT_MODE.IFRAME`.
- Current docs include CSPR.click social-login wallet providers alongside extension wallets:
  - `csprclick-w3a-google`
  - `csprclick-w3a-apple`
- The Casper x402 CSPR.click reference includes `csprclick-w3a-google`.
- The installed CSPR.click type package exposes:
  - `WALLET_KEYS.W3A_GOOGLE = "csprclick-w3a-google"`
  - `WALLET_KEYS.W3A_APPLE = "csprclick-w3a-apple"`
  - `WALLET_KEYS.W3A_PASSKEY = "csprclick-w3a-passkey"`

## Code Changes

- Updated the default browser config to use iframe mode and provider order:
  - `csprclick-w3a-google`
  - `csprclick-w3a-apple`
  - `casper-wallet`
  - `ledger`
  - `metamask-snap`
- Updated `.env.example` to match the embedded/social-provider config.
- Preserved the allowed-provider filter so unknown provider strings are ignored.
- Updated the wallet connection hook so a sign-in request message is reflected in UI state when no wallet is connected.
- Updated CSPR.click unit tests for iframe mode and social-login provider defaults.

## Chrome Evidence

Chrome was used against `http://localhost:3000/app` with the dev server started using:

```bash
NEXT_PUBLIC_CSPR_CLICK_APP_ID=csprclick-template \
NEXT_PUBLIC_CSPR_CLICK_APP_NAME="Casper GW" \
NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE=iframe \
NEXT_PUBLIC_CSPR_CLICK_PROVIDERS=csprclick-w3a-google,csprclick-w3a-apple,casper-wallet,ledger,metamask-snap \
NEXT_PUBLIC_CASPER_CHAIN_NAME=casper-test \
pnpm dev
```

Observed:

- CSPR.click sign-in opens as an embedded modal on `http://localhost:3000/app`.
- Visible extension providers: Casper Wallet, Ledger, Metamask.
- Visible social-login provider buttons are icon-only, with accessible labels:
  - `Choose csprclick-w3a-google provider`
  - `Choose csprclick-w3a-apple provider`
- No provider button was clicked.
- No new `accounts.cspr.click/signin.html` tab was opened during this verification.

## Verification Commands

Focused tests:

```bash
pnpm exec vitest run tests/unit/csprclick-browser.test.ts tests/unit/csprclick-client-config.test.ts tests/unit/csprclick-browser-session.test.ts --reporter=dot
```

Result: 3 files passed, 12 tests passed.

Additional gates:

```bash
pnpm typecheck
pnpm run guard:files
```

Result: passed.

Full CI:

```bash
pnpm run ci
```

Result:

- `pnpm install --frozen-lockfile`: passed.
- `pnpm verify`: passed.
- `pnpm test`: 56 files passed, 233 tests passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test:browser`: 19 passed, 3 intentionally skipped.
- `pnpm build`: passed.

Note: one earlier `pnpm run ci` attempt failed browser smoke because Playwright reused the manual CSPR.click dev server on port 3000. That server had public CSPR.click config enabled for Chrome verification, so the normal no-CSPR browser test assumptions were invalid. After stopping the manual server, Playwright started its clean production test server and CI passed.

## Boundaries

- No local signer fallback was added.
- No wallet extension installation is assumed.
- No social-login provider click was performed on behalf of the user.
- No spending or live x402 proof was claimed for this slice.

## Independent Review

Reviewer: `Erdos`

Result: pass with no findings.

Reviewer checks included:

- Diff inspection for CSPR.click assumptions, leaks, product-boundary regressions, and test gaps.
- Local CSPR.click references and installed wallet key types.
- Context7 CSPR.click docs.
- Focused CSPR.click unit tests.
- `pnpm run guard:secrets`
- `pnpm typecheck`
- `pnpm run guard:files`
- `pnpm run guard:product`
- `pnpm run ci`

Residual risk from review: the fix was not a live provider login or WCSPR spend, and it does not claim that.
