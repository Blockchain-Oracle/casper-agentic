import Link from "next/link";

import { Chip } from "@/components/ui";

interface PublicExplorerHeaderProps {
  receiptSource: "fixture" | "postgres";
}

export function PublicExplorerHeader({ receiptSource }: PublicExplorerHeaderProps) {
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brandMark" />
          <span>
            casper<span className="brandHyphen">-</span>gw
          </span>
        </Link>
        <nav className="nav" aria-label="Public">
          <Link className="navButton" data-active="true" href="/explorer">
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
      <header className="pageHeader">
        <div className="eyebrow">Public infrastructure</div>
        <h1>Casper x402 Explorer</h1>
        <p className="subhead">
          Public receipt inspection for rich Casper GW records plus external deploy, account, and payment-asset proof lookup. External proofs show chain facts only.
        </p>
        <div className="buttonRow" style={{ marginTop: 14 }}>
          <Chip tone={receiptSource === "postgres" ? "primary" : "warn"}>
            {receiptSource === "postgres" ? "Gateway receipts" : "Sample receipts"}
          </Chip>
          <Chip tone="warn">External proof is limited</Chip>
          <Chip tone="signal">No sign-in required</Chip>
        </div>
      </header>
    </>
  );
}
