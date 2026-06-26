"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useWorkspace } from "@/components/app/workspace-provider";
import { Panel } from "@/components/screen-primitives";
import { policyRows, walletRows } from "@/components/screens/wallet-screen-model";
import { Chip, Field, KeyValueList } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { previewPolicy } from "@/lib/policy-preview";

// Dynamic per-wallet detail (/app/wallets/[id]): identity + readiness + spend
// policy, with policy editing (incl. kill switch + a PASS/BLOCK preview) in a modal.
export function WalletDetail({ walletId }: { walletId: string }) {
  const { wallet, provider } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [previewTool, setPreviewTool] = useState("");
  const [previewAmount, setPreviewAmount] = useState("");

  useEffect(() => {
    if (!provider.operatorToken) return;
    if (wallet.wallets.length === 0) void wallet.loadWallets();
    wallet.selectWallet(walletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId, provider.operatorToken]);

  const selected = wallet.selectedWallet;
  const preview = previewTool ? previewPolicy(wallet.policy, { tool: previewTool, amount: previewAmount || "0" }) : null;

  if (!selected) {
    return <div className="notice">Loading wallet… (ensure operator access is set in Provider → Sources).</div>;
  }

  return (
    <div className="stack">
      <div className="buttonRow">
        <Link className="mono" href="/app/wallets" style={{ color: "var(--ink-2)", fontSize: 13 }}>
          ← All wallets
        </Link>
      </div>

      <div className="grid two">
        <Panel title={selected.label} action={<Chip tone="primary">{selected.signingMode}</Chip>}>
          <KeyValueList rows={walletRows(selected, wallet.readiness)} />
        </Panel>
        <Panel
          title="Spend policy"
          action={
            <button className="secondaryButton" onClick={() => setEditing(true)} type="button">
              Edit policy
            </button>
          }
        >
          <KeyValueList rows={policyRows(wallet.policy)} />
          <div className="buttonRow" style={{ marginTop: 12 }}>
            <Chip tone={wallet.policy?.disabled ? "danger" : "signal"}>
              {wallet.policy?.disabled ? "Kill switch ON" : "Active"}
            </Chip>
          </div>
        </Panel>
      </div>

      <Panel title="Readiness & funding">
        <KeyValueList
          rows={[
            { key: "CSPR gas", value: wallet.readiness?.gasBalance ?? "not checked", mono: true },
            { key: "WCSPR", value: wallet.readiness?.assetBalance ?? "not checked", mono: true },
            { key: "ready", value: wallet.readiness?.ready ? "ready" : wallet.readiness?.reason ?? "not checked" },
          ]}
        />
        <div className="buttonRow" style={{ marginTop: 12 }}>
          <button className="secondaryButton" onClick={() => wallet.refreshReadiness(walletId)} type="button">
            Refresh readiness
          </button>
          <a className="secondaryButton" href="https://testnet.cspr.live/tools/faucet" target="_blank" rel="noopener noreferrer">
            Open Testnet faucet ↗
          </a>
        </div>
      </Panel>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit spend policy"
        subtitle={selected.label}
        maxWidth={560}
        footer={
          <>
            <button className="secondaryButton" onClick={() => setEditing(false)} type="button">
              Cancel
            </button>
            <button
              className="primaryButton"
              onClick={() => {
                void wallet.savePolicy();
                setEditing(false);
              }}
              type="button"
            >
              Save policy
            </button>
          </>
        }
      >
        <div className="formGrid">
          <Field label="Max per call (atomic)">
            <input onChange={(event) => wallet.setPolicyAmount(event.target.value)} value={wallet.policyAmount} />
          </Field>
          <Field label="Daily limit (atomic, optional)">
            <input onChange={(event) => wallet.setDailyLimit(event.target.value)} value={wallet.dailyLimit} />
          </Field>
          <Field label="Allowed tool">
            <input onChange={(event) => wallet.setPolicyTool(event.target.value)} value={wallet.policyTool} />
          </Field>
          <Field label="Kill switch (disable)">
            <input checked={wallet.policyDisabled} onChange={(event) => wallet.setPolicyDisabled(event.target.checked)} type="checkbox" />
          </Field>
        </div>
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div className="fieldLabel">Policy preview — would this call pass?</div>
          <div className="formGrid">
            <Field label="Tool">
              <input onChange={(event) => setPreviewTool(event.target.value)} placeholder="weather.fetch" value={previewTool} />
            </Field>
            <Field label="Amount (atomic)">
              <input onChange={(event) => setPreviewAmount(event.target.value)} placeholder="250000000" value={previewAmount} />
            </Field>
          </div>
          {preview ? (
            <div className="notice" style={{ marginTop: 10 }}>
              <Chip tone={preview.pass ? "signal" : "warn"}>{preview.pass ? "PASS" : "BLOCK"}</Chip> {preview.reason}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
