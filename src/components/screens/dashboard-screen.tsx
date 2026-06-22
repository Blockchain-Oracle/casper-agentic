import Link from "next/link";
import { Panel, TrustBoundaryGrid } from "@/components/screen-primitives";
import { Chip, KeyValueList, StatusChip } from "@/components/ui";
import { receipts, wallets } from "@/lib/fixtures";
import type { Receipt, Screen } from "@/lib/types";

export function DashboardScreen({
  onOpenReceipt,
  onOpenConsole,
  onScreen,
  publishedToolCount,
}: {
  onOpenReceipt: (receipt: Receipt) => void;
  onOpenConsole: () => void;
  onScreen: (screen: Screen) => void;
  publishedToolCount: number;
}) {
  const blockedCount = receipts.filter((receipt) => receipt.status === "blocked").length;

  return (
    <div className="stack">
      <div className="heroBand">
        <div className="heroCopy">
          <div className="stack">
            <Chip tone="primary">Casper agent commerce loop</Chip>
            <h2>Publish paid tools, let agents spend safely, and inspect every payment receipt.</h2>
            <p className="subhead" style={{ margin: 0 }}>
              This is the judge path: provider import, Casper x402 pricing, wallet policy,
              paid tool call, then proof-layer explorer.
            </p>
          </div>
          <div className="heroActions">
            <button className="primaryButton" onClick={() => onScreen("import")} type="button">
              Start provider flow
            </button>
            <button className="secondaryButton" onClick={onOpenConsole} type="button">
              Open test console
            </button>
          </div>
        </div>
        <div className="darkPanel">
          <div className="panelHeader">
            <div>
              <div className="fieldLabel">Facilitator path</div>
              <div className="panelTitle">CSPR.cloud x402</div>
            </div>
            <Chip tone="signal">Casper Testnet</Chip>
          </div>
          <div className="panelBody">
            <KeyValueList
              rows={[
                { key: "network", value: "casper:casper-test", mono: true },
                { key: "scheme", value: "exact", mono: true },
                { key: "asset", value: "CEP-18 TUSDC", mono: true },
                { key: "proof rule", value: "No deploy hash is shown until real Testnet proof exists" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid auto">
        {[
          ["Active providers", "2", "OpenAPI and remote MCP sources"],
          ["Published tools", String(publishedToolCount), "Hosted endpoint tools"],
          ["Agent wallets", String(wallets.length), "Policy-controlled Casper accounts"],
          ["Receipt attempts", String(receipts.length), "All meaningful attempts produce receipts"],
          ["Blocked by policy", String(blockedCount), "Stopped before wallet signing"],
          ["Live proof volume", "0.00 TUSDC", "Awaiting a real deploy hash"],
        ].map(([label, value, note]) => (
          <div className="stat" key={label}>
            <div className="fieldLabel">{label}</div>
            <div className="statValue">{value}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {note}
            </div>
          </div>
        ))}
      </div>

      <div className="grid two">
        <Panel title="Guided path">
          <div className="stack tight">
            {[
              ["Import source", "Create a provider source and discover tools.", "import"],
              ["Price and publish", "Attach Casper x402 price requirements.", "pricing"],
              ["Wallet policy", "Set agent spending rules before payment.", "wallet"],
              ["Run paid call", "Discover endpoint tools and run policy/payment.", "console"],
            ].map(([label, note, target], index) => (
              <div className="railItem" key={label}>
                <span className="railIndex">{index + 1}</span>
                <div>
                  <strong>{label}</strong>
                  <div className="muted" style={{ marginTop: 3, fontSize: 13 }}>
                    {note}
                  </div>
                </div>
                <button className="secondaryButton" onClick={() => onScreen(target as Screen)} type="button">
                  Open
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Latest receipts"
          action={
            <Link className="secondaryButton" href="/explorer">
              Explorer
            </Link>
          }
        >
          <div className="stack tight">
            {receipts.slice(0, 5).map((receipt) => (
              <button
                className="receiptRow"
                key={receipt.id}
                onClick={() => onOpenReceipt(receipt)}
                type="button"
              >
                <div className="receiptMeta">
                  <strong className="mono">{receipt.id}</strong>
                  <StatusChip status={receipt.status} />
                </div>
                <div className="miniMeta">
                  <span>{receipt.tool}</span>
                  <span>
                    {receipt.amount} {receipt.asset}
                  </span>
                  <span>{receipt.wallet}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Trust boundaries">
        <TrustBoundaryGrid />
      </Panel>
    </div>
  );
}
