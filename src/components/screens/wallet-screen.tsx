import { Panel } from "@/components/screen-primitives";
import { Chip, Field, KeyValueList, StatusChip } from "@/components/ui";
import { receipts, wallets } from "@/lib/fixtures";
import type { Receipt, Tool, WalletProfile } from "@/lib/types";

export function WalletScreen({
  allowlist,
  copied,
  manualApproval,
  onCopy,
  onManualApproval,
  onOpenReceipt,
  onPolicyAmount,
  onPolicyTool,
  onWallet,
  policyAllowed,
  policyAmount,
  policyTool,
  policyTools,
  selectedWallet,
  selectedWalletId,
}: {
  allowlist: string[];
  copied: string | null;
  manualApproval: boolean;
  onCopy: (value: string) => void;
  onManualApproval: (enabled: boolean) => void;
  onOpenReceipt: (receipt: Receipt) => void;
  onPolicyAmount: (amount: string) => void;
  onPolicyTool: (tool: string) => void;
  onWallet: (walletId: string) => void;
  policyAllowed: boolean;
  policyAmount: string;
  policyTool: string;
  policyTools: Tool[];
  selectedWallet: WalletProfile;
  selectedWalletId: string;
}) {
  const walletReceipts = receipts.filter((receipt) => receipt.wallet === selectedWallet.id).slice(0, 4);

  return (
    <div className="grid two">
      <div className="stack">
        <Panel title="Wallet profiles">
          {wallets.map((wallet) => (
            <button
              className="walletRow"
              data-active={wallet.id === selectedWalletId}
              key={wallet.id}
              onClick={() => onWallet(wallet.id)}
              type="button"
            >
              <div className="receiptMeta">
                <strong className="mono">{wallet.id}</strong>
                <Chip tone={wallet.funded ? "signal" : "warn"}>{wallet.status}</Chip>
              </div>
              <div className="miniMeta">
                <span>{wallet.account}</span>
                <span>{wallet.signingMode}</span>
              </div>
            </button>
          ))}
        </Panel>

        <Panel title="Selected wallet">
          <KeyValueList
            rows={[
              { key: "account", value: selectedWallet.fullAccount, mono: true },
              { key: "network", value: selectedWallet.network, mono: true },
              { key: "signing mode", value: selectedWallet.signingMode },
              { key: "balance", value: `${selectedWallet.balance} WCSPR`, mono: true },
              { key: "custody note", value: "MVP signing mode - no production custody claim" },
            ]}
            copiedKey={copied}
            onCopy={onCopy}
          />
        </Panel>
      </div>

      <div className="stack">
        <Panel title="Spend policy">
          <div className="stack">
            <div className="formGrid">
              <Field label="max per call">
                <input
                  className="input"
                  onChange={(event) => onPolicyAmount(event.target.value)}
                  value={policyAmount}
                />
              </Field>
              <Field label="tool to evaluate">
                <select className="input" onChange={(event) => onPolicyTool(event.target.value)} value={policyTool}>
                  {policyTools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.id}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <label className="toggle">
              <input
                checked={manualApproval}
                onChange={(event) => onManualApproval(event.target.checked)}
                type="checkbox"
              />
              Require manual approval before wallet signing
            </label>
            <KeyValueList
              rows={[
                { key: "daily limit", value: "2.00 WCSPR" },
                { key: "allowed providers", value: "Make Software Labs, Weather Risk Desk" },
                { key: "allowed tools", value: allowlist.join(", ") },
                { key: "allowed network", value: "casper:casper-test", mono: true },
                { key: "allowed asset", value: "CEP-18 WCSPR", mono: true },
              ]}
            />
            <div className={`notice ${policyAllowed ? "signal" : "danger"}`}>
              {policyAllowed
                ? "Policy would allow this call before creating an x402 payment payload."
                : "Policy would block before wallet signing. No Casper transaction should be created."}
            </div>
          </div>
        </Panel>

        <Panel title="Wallet activity">
          {walletReceipts.map((receipt) => (
            <button className="receiptRow" key={receipt.id} onClick={() => onOpenReceipt(receipt)} type="button">
              <div className="receiptMeta">
                <strong className="mono">{receipt.id}</strong>
                <StatusChip status={receipt.status} />
              </div>
              <div className="miniMeta">
                <span>{receipt.tool}</span>
                <span>
                  {receipt.amount} {receipt.asset}
                </span>
              </div>
            </button>
          ))}
        </Panel>
      </div>
    </div>
  );
}
