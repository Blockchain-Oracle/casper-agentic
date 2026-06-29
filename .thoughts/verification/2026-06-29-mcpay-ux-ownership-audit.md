# Verification Audit: MCPay UX, API Keys, Funding, Ownership

## Verdict

Conditional pass for the immediate UX and safety patch.

The app no longer defaults paid-tool UX to "create a key", local consumer keys were deleted, free/paid tool execution is clearer, configured signer readiness is shown before payment, and public ID-based destructive controls are locked.

Full owner-gated manage/delete is still incomplete because the database has no owner columns and the app has no wallet-signed owner session. Do not present destructive owner actions as secure until that schema/session work lands.

## Artifacts Checked

- `AGENTS.md`
- MCPay reference:
  - `.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/connect-panel.tsx`
  - `.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/account-modal.tsx`
  - `.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/user-modal.tsx`
  - `.thoughts/raw/repos/MCPay/apps/app/src/components/custom-ui/tool-execution-modal.tsx`
- Cronos402 reference:
  - `.thoughts/raw/repos/cronos402/app/src/components/custom-ui/tool-execution-modal.tsx`
- CSPR.click references:
  - `/Users/abu/.codex/skills/csprclick-skill/SKILL.md`
  - `.thoughts/raw/repos/csprclick-examples/csprclick-react/src/components/GettingStarted/components/BuyMeACoffee.tsx`
  - `.thoughts/raw/repos/csprclick-examples/csprclick-react/src/ClickContext.tsx`
- Current changed files under `src/components`, `src/app/api`, and `src/server`

## Requirement Traceability

- Existing API keys should be first-class, not "create a key every time".
  - Implemented in `src/components/connect/connect-dialog.tsx`, `src/components/connect/connect-key-dropdown.tsx`, `src/components/tools/server-tools.tsx`, and `src/components/tools/payment-key-selector.tsx`.
  - Existing keys are selected from dropdowns. Creation is an empty-state or secondary dropdown action.

- Local database should start clean for consumer API keys.
  - Deleted consumer `endpoint_access_keys` and related `key_credits`.
  - Verified counts: consumer keys `0`, key credits `0`.

- Funding should open/connect wallet but not fake unsupported direct WCSPR transfer.
  - Implemented in `src/components/account/fund-tab.tsx`.
  - The wallet action opens CSPR.click and copies the WCSPR deposit address, then reveals the claim form.
  - Direct CSPR.click WCSPR transfer is not implemented because current app exposes an account-hash deposit address while local CEP-18 helpers need recipient public key or a separately verified account-hash transaction path.

- Paid runner should show who gets paid and readiness before execution.
  - Implemented in `src/components/tools/server-tools.tsx`.
  - Shows amount, network, payTo, key balance, configured Casper signer readiness, and result output after execution.

- Saved key balance must not block an unrelated pasted token.
  - Implemented in `src/components/tools/server-tools.tsx`.
  - Saved-key balance blocks only when the full token was created in the current UI and is known to match that key.

- Public destructive operations must not pretend to be owner-gated.
  - Locked UI controls in `src/components/register/registered-sources-panel.tsx` and `src/components/account/developer-key-row.tsx`.
  - Server-side guard added in `src/server/destructive-action-guard.ts`.
  - Source delete and key revoke now require `x-casper-gw-admin-token` matching `CASPER_GW_ADMIN_TOKEN`; if unset, they return 403.

## Quality Gates

- `CI=true npx -y pnpm@10.33.0 typecheck` passed.
- `CI=true npx -y pnpm@10.33.0 lint` passed.
- File-size spot check: touched source files are under 300 lines.

## Remaining Gaps

- Real owner management needs:
  - `owner_public_key` and `owner_account_hash` columns on provider sources and consumer keys.
  - A wallet-signed nonce/session flow.
  - Owner checks on source manage/delete, key list/create/revoke/fund, tool price/publish/select, and rediscovery.

- Direct WCSPR funding from wallet needs:
  - Browser-exposed CSPR.click `send`.
  - A verified CEP-18 WCSPR transfer builder for the configured payee.
  - Recipient public key or a supported account-hash recipient transaction path.
  - Mapping from CSPR.click send result to key credit claim.

- Connect flow still lacks MCPay-style separate `Client`, `Config`, and `Code` tabs.

- Complex schema form inputs still need recursive object and array controls.

## Evidence Log

- Read-only audit agents reviewed UX gaps, ownership gaps, and CSPR.click funding feasibility.
- Local Postgres cleanup verified with `psql`: consumer keys `0`, key credits `0`.
- Lint and typecheck were run after the patch and passed.
