"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useWorkspace } from "@/components/app/workspace-provider";
import { Panel } from "@/components/screen-primitives";
import { Chip, Field } from "@/components/ui";
import { formatAddress } from "@/lib/format-address";

// Selection-first wallet list. Click a wallet → its dynamic /app/wallets/[id]
// detail. Create uses the connected CSPR.click wallet (no raw key entry).
export function WalletList() {
  const { wallet, provider, browserWallet } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (provider.operatorToken && wallet.wallets.length === 0) void wallet.loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.operatorToken]);

  return (
    <div className="stack">
      {!provider.operatorToken ? (
        <div className="notice">Set operator access in Provider → Sources to load and manage agent wallets.</div>
      ) : null}

      <Panel
        title="Agent wallets"
        action={
          <button className="secondaryButton" onClick={() => wallet.loadWallets()} type="button">
            Refresh
          </button>
        }
      >
        {wallet.wallets.length === 0 ? (
          <div className="emptyState">No agent wallets yet. Create one below.</div>
        ) : (
          wallet.wallets.map((record) => (
            <button
              className="walletRow"
              key={record.id}
              onClick={() => router.push(`/app/wallets/${record.id}`)}
              type="button"
              style={{ textAlign: "left", width: "100%", background: "transparent" }}
            >
              <div className="receiptMeta">
                <strong>{record.label}</strong>
                <Chip tone="primary">{record.signingMode}</Chip>
              </div>
              <div className="miniMeta">
                <span className="mono">{formatAddress(record.accountHash, { lead: 6, trail: 4 })}</span>
                <span>{record.network}</span>
              </div>
            </button>
          ))
        )}
      </Panel>

      <Panel title="Create agent wallet">
        <div className="formGrid">
          <Field label="Label">
            <input value={wallet.walletLabel} onChange={(event) => wallet.setWalletLabel(event.target.value)} />
          </Field>
        </div>
        <div className="buttonRow" style={{ marginTop: 12 }}>
          <button
            className="secondaryButton"
            disabled={!browserWallet.browserSigningState.activePublicKey}
            onClick={() => wallet.useBrowserWalletProfile(browserWallet.browserSigningState.activePublicKey)}
            type="button"
          >
            Use connected CSPR.click wallet
          </button>
          <button className="primaryButton" disabled={wallet.loading || !wallet.walletAccountHash} onClick={() => wallet.createWallet()} type="button">
            Create wallet
          </button>
        </div>
        {wallet.walletAccountHash ? (
          <div className="notice" style={{ marginTop: 10 }}>
            Ready to create <strong>{wallet.walletLabel}</strong> ({wallet.walletSigningMode}) ·{" "}
            <span className="mono">{formatAddress(wallet.walletAccountHash, { lead: 6, trail: 4 })}</span>
          </div>
        ) : null}
        {wallet.errorMessage ? <div className="notice" style={{ marginTop: 10, color: "var(--danger)" }}>{wallet.errorMessage}</div> : null}
      </Panel>
    </div>
  );
}
