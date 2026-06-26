import Link from "next/link";
import { Chip, KeyValueList, StatusChip } from "@/components/ui";
import { receipts, tools, wallets } from "@/lib/fixtures";

export default function Home() {
  const latestReceipt = receipts[0];

  return (
    <main className="app">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brandMark" />
          <span>
            casper<span className="brandHyphen">-</span>gw
          </span>
        </Link>
        <nav className="nav" aria-label="Public">
          <Link className="navButton" data-active="true" href="/">
            <span className="dot" />
            Overview
          </Link>
          <Link className="navButton" href="/explorer">
            <span className="dot" />
            Explorer
          </Link>
          <Link className="navButton" href="/app">
            <span className="dot" />
            App
          </Link>
        </nav>
        <span className="networkPill">
          <span className="dot" style={{ background: "var(--signal)", opacity: 1 }} />
          Testnet
        </span>
      </header>
      <section className="page">
        <div className="heroBand">
          <div className="heroCopy">
            <div className="stack">
              <Chip tone="primary">Casper agent commerce gateway</Chip>
              <h1>Public x402 receipts for paid agent tool calls.</h1>
              <p className="subhead" style={{ margin: 0 }}>
                Providers publish paid MCP tools, operators fund policy-controlled Casper wallets,
                and every attempt produces a four-layer receipt anyone can inspect.
              </p>
            </div>
            <div className="heroActions">
              <Link className="primaryButton" href="/explorer">Open explorer</Link>
              <Link className="secondaryButton" href="/app">Open operator app</Link>
            </div>
          </div>
          <div className="darkPanel">
            <div className="panelHeader">
              <div>
                <div className="fieldLabel">Latest receipt</div>
                <div className="panelTitle">{latestReceipt.id}</div>
              </div>
              <StatusChip status={latestReceipt.status} />
            </div>
            <div className="panelBody">
              <KeyValueList
                rows={[
                  { key: "provider", value: latestReceipt.provider },
                  { key: "tool", value: latestReceipt.tool, mono: true },
                  { key: "amount", value: `${latestReceipt.amount} ${latestReceipt.asset}`, mono: true },
                  { key: "proof", value: "fixture - no deploy hash claimed", tone: "warn" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="grid auto">
          {[
            ["Published tools", String(tools.filter((tool) => tool.published).length), "Hosted MCP/x402 endpoint tools"],
            ["Wallet profiles", String(wallets.length), "Spend-policy controlled accounts"],
            ["Receipt attempts", String(receipts.length), "Policy, payment, and proof outcomes"],
            ["Live proof volume", "0.00 WCSPR", "Requires a real Testnet deploy hash"],
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

        <div className="stack" style={{ marginTop: 32 }}>
          <Chip tone="primary">One signing engine, three triggers</Chip>
          <p className="subhead" style={{ margin: 0 }}>
            Every paid call settles a fresh per-call x402 authorization on Casper Testnet. The same
            policy → verify → settle → Casper-proof path runs underneath all three.
          </p>
          <div className="grid auto">
            {[
              ["Pay with my agent wallet", "The Gateway server-signs with your selected wallet, under its spend limits and tool allowlist."],
              ["Connect & sign", "Your own Casper wallet approves each payment via CSPR.click — Casper wallets only."],
              ["Autonomous agent + API key", "An agent sends only a bearer token bound to a hosted wallet; the Gateway signs under policy."],
            ].map(([title, note]) => (
              <div className="stat" key={title}>
                <div className="panelTitle" style={{ fontSize: 16 }}>
                  {title}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                  {note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
