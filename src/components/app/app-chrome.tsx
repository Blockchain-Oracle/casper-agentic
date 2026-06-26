"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PricingDrawer } from "@/components/pricing-drawer";
import { formatAddress } from "@/lib/format-address";
import type { Screen } from "@/lib/types";
import { AppGate } from "./app-gate";
import { useWorkspace } from "./workspace-provider";

/** Maps a legacy Screen id (still used by some screens' onScreen props) to a /app route. */
export function screenToHref(screen: Screen): string {
  switch (screen) {
    case "import":
    case "pricing":
    case "endpoint":
      return "/app/provider";
    case "wallet":
      return "/app/wallets";
    case "console":
      return "/app/runner";
    case "settings":
      return "/app/settings";
    default:
      return "/app/dashboard";
  }
}

const NAV: ReadonlyArray<readonly [string, string]> = [
  ["/app/dashboard", "Dashboard"],
  ["/app/provider", "Provider"],
  ["/app/wallets", "Wallets"],
  ["/app/runner", "Runner"],
  ["/app/audit", "Audit"],
  ["/app/settings", "Settings"],
];

/** Top-header nav + CSPR.click mount nodes + the wallet gate around the page. */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { browserWallet, pricingTool, amount, setAmount, savePricing, closePricing } = useWorkspace();
  const activeKey = browserWallet.browserSigningState.activePublicKey;

  return (
    <main className="app" id="app">
      <div id="csprclick-ui" />
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          height: 64,
          padding: "0 24px",
          borderBottom: "1px solid var(--line)",
          background: "var(--paper-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 13, height: 13, background: "var(--brand)", transform: "rotate(45deg)", borderRadius: 2 }} />
            <span style={{ font: "700 16px/1 var(--sans)" }}>Casper GW</span>
          </div>
          <nav style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {NAV.map(([href, label]) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 7,
                    font: "600 13.5px/1 var(--sans)",
                    color: active ? "var(--ink)" : "var(--ink-2)",
                    background: active ? "var(--paper-3)" : "transparent",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/explorer" style={{ font: "600 13px/1 var(--sans)", color: "var(--ink-2)" }}>
            Explorer ↗
          </Link>
          <span
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid var(--line)",
              font: "600 11px/1 var(--mono)",
              color: "var(--ink-2)",
            }}
          >
            Casper Testnet
          </span>
          {activeKey ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid var(--line)",
                font: "600 12px/1 var(--mono)",
                color: "var(--ink)",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--settled)" }} />
              {formatAddress(activeKey, { lead: 4, trail: 4 })}
            </span>
          ) : null}
        </div>
      </header>
      <AppGate>
        <section className="page">{children}</section>
      </AppGate>
      {pricingTool ? (
        <PricingDrawer amount={amount} onAmount={setAmount} onClose={closePricing} onSave={savePricing} tool={pricingTool} />
      ) : null}
    </main>
  );
}

/** Per-screen page header (eyebrow / title / subtitle). */
export function AppPageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <header className="pageHeader">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p className="subhead">{subtitle}</p>
    </header>
  );
}
