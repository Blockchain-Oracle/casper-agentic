import { Panel } from "@/components/screen-primitives";
import { Chip, Field, KeyValueList, StatusChip } from "@/components/ui";
import { receipts } from "@/lib/fixtures";
import {
  getToolOptions,
  policyRows,
  shortHash,
  type WalletScreenProps,
  walletRows,
} from "./wallet-screen-model";
import {
  BrowserSigningConnectionNotice,
  BrowserSigningProviderEvidence,
} from "./browser-signing-evidence";

export function WalletScreen({
  copied,
  dailyLimit,
  errorMessage,
  loading,
  onCopy,
  onConnectBrowserWallet,
  onCreateWallet,
  onDailyLimit,
  onLoadWallets,
  onOpenReceipt,
  onPolicyAmount,
  onPolicyDisabled,
  onPolicyTool,
  onRefreshReadiness,
  onSavePolicy,
  onSelectWallet,
  onSessionLimit,
  onWalletAccountHash,
  onWalletLabel,
  onWalletPublicKey,
  onWalletSigningMode,
  onUseBrowserWalletProfile,
  operatorConnected,
  policy,
  policyAmount,
  policyDisabled,
  policyTool,
  policyTools,
  readiness,
  selectedWallet,
  selectedWalletId,
  sessionLimit,
  statusMessage,
  browserSigningState,
  walletAccountHash,
  walletLabel,
  walletPublicKey,
  wallets,
  walletSigningMode,
}: WalletScreenProps) {
  const toolOptions = getToolOptions(policyTools, policyTool);
  const walletReceipts = selectedWallet
    ? receipts.filter((receipt) => receipt.wallet === selectedWallet.id).slice(0, 4)
    : [];

  return (
    <div className="grid two">
      <div className="stack">
        <Panel title="Wallet profiles">
          {!operatorConnected ? <div className="notice">Enter operator access before loading wallet records.</div> : null}
          <div className="buttonRow" style={{ marginBottom: 12 }}>
            <button className="secondaryButton" disabled={loading || !operatorConnected} onClick={onLoadWallets} type="button">
              Load wallet records
            </button>
          </div>
          {wallets.length ? wallets.map((wallet) => (
            <button
              className="walletRow"
              data-active={wallet.id === selectedWalletId}
              key={wallet.id}
              onClick={() => onSelectWallet(wallet.id)}
              type="button"
            >
              <div className="receiptMeta">
                <strong>{wallet.label}</strong>
                <Chip tone={readiness?.ready && wallet.id === selectedWalletId ? "signal" : "warn"}>
                  {readiness?.ready && wallet.id === selectedWalletId ? "ready" : "registered"}
                </Chip>
              </div>
              <div className="miniMeta">
                <span className="mono">{shortHash(wallet.accountHash)}</span>
                <span>{wallet.signingMode}</span>
              </div>
            </button>
          )) : <div className="emptyState">No wallet profiles saved yet.</div>}
        </Panel>

        <Panel title="Add wallet">
          <div className="stack">
            <BrowserSigningConnectionNotice state={browserSigningState} />
            <BrowserSigningProviderEvidence state={browserSigningState} />
            <div className="buttonRow">
              {browserSigningState.canRequestSignIn && !browserSigningState.connected ? (
                <button className="secondaryButton" disabled={loading} onClick={onConnectBrowserWallet} type="button">
                  Connect CSPR.click wallet
                </button>
              ) : null}
              <button
                className="secondaryButton"
                disabled={loading || !browserSigningState.connected}
                onClick={onUseBrowserWalletProfile}
                type="button"
              >
                Use active CSPR.click wallet
              </button>
            </div>
            <div className="formGrid">
              <Field label="label">
                <input className="input" onChange={(event) => onWalletLabel(event.target.value)} value={walletLabel} />
              </Field>
              <Field label="signing mode">
                <select className="input" onChange={(event) => onWalletSigningMode(event.target.value)} value={walletSigningMode}>
                  <option value="external">external</option>
                  <option value="test-signer">test-signer</option>
                  <option value="browser-wallet">browser-wallet</option>
                </select>
              </Field>
            </div>
            <Field label="account hash">
              <input className="input" onChange={(event) => onWalletAccountHash(event.target.value)} value={walletAccountHash} />
            </Field>
            <Field label="public key">
              <input className="input" onChange={(event) => onWalletPublicKey(event.target.value)} value={walletPublicKey} />
            </Field>
            <button className="primaryButton" disabled={loading || !operatorConnected} onClick={onCreateWallet} type="button">
              Save wallet profile
            </button>
          </div>
        </Panel>

        <Panel title="Selected wallet">
          <KeyValueList rows={walletRows(selectedWallet, readiness)} copiedKey={copied} onCopy={onCopy} />
          <div className="buttonRow" style={{ marginTop: 12 }}>
            <button className="secondaryButton" disabled={!selectedWallet || loading} onClick={onRefreshReadiness} type="button">
              Refresh readiness
            </button>
          </div>
          <div className={`notice ${readiness?.ready ? "signal" : "warn"}`}>{errorMessage ?? statusMessage}</div>
        </Panel>
      </div>

      <div className="stack">
        <Panel title="Spend policy">
          <div className="stack">
            <div className="formGrid">
              <Field label="max per call">
                <input className="input" onChange={(event) => onPolicyAmount(event.target.value)} value={policyAmount} />
              </Field>
              <Field label="allowed tool">
                <select className="input" onChange={(event) => onPolicyTool(event.target.value)} value={policyTool}>
                  {toolOptions.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
                </select>
              </Field>
              <Field label="day limit">
                <input className="input" onChange={(event) => onDailyLimit(event.target.value)} value={dailyLimit} />
              </Field>
              <Field label="session limit">
                <input className="input" onChange={(event) => onSessionLimit(event.target.value)} value={sessionLimit} />
              </Field>
            </div>
            <label className="toggle">
              <input checked={policyDisabled} onChange={(event) => onPolicyDisabled(event.target.checked)} type="checkbox" />
              Disable policy
            </label>
            <KeyValueList rows={policyRows(policy)} />
            <button className="primaryButton" disabled={!selectedWallet || loading} onClick={onSavePolicy} type="button">
              Save spend policy
            </button>
            <div className={`notice ${policy && !policy.disabled ? "signal" : "warn"}`}>
              {policy ? "Saved policy will block before x402 signing when limits fail." : "Save a policy before running paid calls."}
            </div>
          </div>
        </Panel>

        <Panel title="Wallet activity" action={<Chip tone="warn">Sample history</Chip>}>
          {walletReceipts.length ? walletReceipts.map((receipt) => (
            <button className="receiptRow" key={receipt.id} onClick={() => onOpenReceipt(receipt)} type="button">
              <div className="receiptMeta">
                <strong className="mono">{receipt.id}</strong>
                <StatusChip status={receipt.status} />
              </div>
              <div className="miniMeta">
                <span>{receipt.tool}</span>
                <span>{receipt.amount} {receipt.asset}</span>
              </div>
            </button>
          )) : <div className="emptyState">No sample receipt history for this wallet.</div>}
        </Panel>
      </div>
    </div>
  );
}
