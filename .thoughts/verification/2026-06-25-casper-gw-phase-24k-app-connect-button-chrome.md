# Verification: Phase 24K App-Level CSPR.click Connect Button

Date: 2026-06-25

## Scope

This slice verifies the Casper GW app-level `Connect CSPR.click wallet` button after the Phase 24I embedded-provider fix.

It does not click a CSPR.click provider, complete wallet login, sign typed data, spend WCSPR, settle an x402 payment, or claim a deploy hash.

## Sources Checked

- `AGENTS.md`
- `.thoughts/README.md`
- `.thoughts/plans/2026-06-25-casper-gw-phase-24-real-csprclick-browser-signing.md`
- `.thoughts/verification/2026-06-25-casper-gw-phase-24i-csprclick-embedded-provider-config.md`
- Current app code:
  - `src/components/screens/use-csprclick-browser-connection.ts`
  - `src/components/screens/wallet-screen.tsx`
  - `src/lib/csprclick-browser-session.ts`

## Chrome Verification

The dev server was started with public CSPR.click localhost config:

```bash
NEXT_PUBLIC_CSPR_CLICK_APP_ID=csprclick-template \
NEXT_PUBLIC_CSPR_CLICK_APP_NAME="Casper GW" \
NEXT_PUBLIC_CSPR_CLICK_CONTENT_MODE=iframe \
NEXT_PUBLIC_CSPR_CLICK_PROVIDERS=csprclick-w3a-google,csprclick-w3a-apple,casper-wallet,ledger,metamask-snap \
NEXT_PUBLIC_CASPER_CHAIN_NAME=casper-test \
pnpm dev
```

Chrome flow:

1. Opened `http://localhost:3000/app`.
2. Navigated to `Wallets`.
3. Clicked the Casper GW app-level `Connect CSPR.click wallet` button.
4. Inspected the visible modal without clicking any provider.

Observed:

- Browser tab count remained unchanged.
- No `accounts.cspr.click/signin.html` tab was opened.
- The page displayed `CSPR.click sign-in requested`.
- CSPR.click opened the embedded sign-in modal on `http://localhost:3000/app`.
- Visible extension providers: Casper Wallet, Ledger, Metamask.
- Visible social-login provider buttons were icon-only, with accessible labels:
  - `Choose csprclick-w3a-google provider`
  - `Choose csprclick-w3a-apple provider`

## Boundaries

- No provider button was clicked.
- No browser wallet account was connected.
- No wallet profile was imported.
- No x402 payment payload was signed.
- No CSPR.cloud facilitator verify/settle call was made.
- No Casper deploy hash or live proof was claimed.
