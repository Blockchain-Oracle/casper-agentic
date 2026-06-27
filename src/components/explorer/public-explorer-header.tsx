import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";

interface PublicExplorerHeaderProps {
  receiptSource: "fixture" | "postgres";
}

/**
 * Explorer top bar — matches v3 prototype tile "Casper GW – Explorer". Public surface,
 * no wallet UI; the operator app is reached via the right-side button.
 */
export function PublicExplorerHeader({ receiptSource }: PublicExplorerHeaderProps) {
  return (
    <>
      <header className="landingTopbar">
        <Link className="landingBrand" href="/">
          <span className="landingBrandMark" />
          <span>Casper GW</span>
          <span style={{ marginLeft: 4, font: "600 14px/1 var(--sans)", color: "var(--ink-2)" }}>Explorer</span>
          <span className="landingTestnetPill">TESTNET</span>
        </Link>
        <div className="landingTopNav" aria-label="Public">
          <span className="landingNavLink" style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "600 11.5px/1 var(--mono)", color: "var(--ink-3)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--settled)" }} />
            PUBLIC · NO SIGN-IN
          </span>
          <ThemeToggle />
          <Link className="landingCtaPrimary" href="/app" style={{ padding: "10px 18px", fontSize: 13.5 }}>
            Open app ↗
          </Link>
        </div>
      </header>
      <div className="explorerHero" style={{ marginTop: 28 }}>
        <h1>Verify any Casper payment proof</h1>
        <p>
          Search Casper GW receipts and live Testnet WCSPR activity.
          {" "}
          {receiptSource === "postgres"
            ? "Gateway receipts carry all four layers (gateway, policy, x402, Casper proof); external proof carries Casper settlement only."
            : "Showing sample receipts — Postgres unavailable, switch to a live database to see real settlement."}
        </p>
      </div>
    </>
  );
}
