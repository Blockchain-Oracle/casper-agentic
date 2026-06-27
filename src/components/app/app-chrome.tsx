"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PricingDrawer } from "@/components/pricing-drawer";
import { formatAddress } from "@/lib/format-address";
import type { Screen } from "@/lib/types";
import { AppGate } from "./app-gate";
import { ThemeToggle } from "./theme-toggle";
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
      return "/app";
  }
}

/**
 * Active-nav check. `/app` (Dashboard) must match exactly — every other route
 * also startsWith("/app"), so a prefix test would light up Dashboard everywhere.
 */
function navActive(pathname: string, href: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

const NAV: ReadonlyArray<readonly [string, string]> = [
  ["/app", "Dashboard"],
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
      <header className="appHeader">
        <div className="appBrand">
          <span className="appBrandMark" />
          <span>Casper GW</span>
        </div>
        <nav className="appNav">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="appNavLink" data-active={navActive(pathname, href)}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="appHeaderRight">
          <ThemeToggle />
          <Link href="/explorer" className="appExplorerLink">
            Explorer ↗
          </Link>
          <span className="appNetPill">Casper Testnet</span>
          {activeKey ? (
            <span className="appKeyChip">
              <span className="dot" />
              {formatAddress(activeKey, { lead: 4, trail: 4 })}
            </span>
          ) : null}
        </div>
      </header>
      <AppGate>
        <section className="page">{children}</section>
      </AppGate>
      <nav className="appBottomNav" aria-label="App">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className="appBottomLink" data-active={navActive(pathname, href)}>
            {label}
          </Link>
        ))}
      </nav>
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
