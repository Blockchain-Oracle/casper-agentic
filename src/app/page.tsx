import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { StatusChip } from "@/components/ui";
import { formatReceiptId } from "@/lib/format-address";
import { receipts } from "@/lib/fixtures";

export default function Home() {
  const latest = receipts.find((receipt) => receipt.hash) ?? receipts[0];
  const recent = receipts.slice(0, 3);
  const settledCount = receipts.filter((receipt) => receipt.status === "settled").length;
  const unsettledCount = receipts.length - settledCount;
  const providerCount = new Set(receipts.map((receipt) => receipt.provider)).size;
  const flow: Array<[string, string, string]> = [
    ["01 Source", "Provider connects an API, OpenAPI spec, or MCP server.", "var(--ink)"],
    ["02 Tool", "Discovered tools get priced and published as x402.", "var(--ink)"],
    ["03 Policy", "Spend policy runs before any signing or payment.", "var(--policy)"],
    ["04 x402", "Wallet signs; facilitator verifies and settles.", "var(--x402)"],
    ["05 Casper proof", "A real deploy hash lands on Casper Testnet.", "var(--brand)"],
    ["06 Receipt", "Four layers assembled into a verifiable receipt.", "var(--settled)"],
  ];

  return (
    <main className="landingShell">
      <header className="landingTopbar">
        <Link className="landingBrand" href="/">
          <span className="landingBrandMark" />
          <span>Casper GW</span>
          <span className="landingTestnetPill">TESTNET</span>
        </Link>
        <nav className="landingTopNav" aria-label="Public">
          <Link className="landingNavLink" href="/explorer">Explorer</Link>
          <Link className="landingNavLink" href="#how-it-works">How it works</Link>
          <ThemeToggle />
          <Link className="landingOpenAppBtn" href="/app">Open app →</Link>
        </nav>
      </header>

      <section className="landingHero">
        <div>
          <div className="landingEyebrow">Agent commerce · Casper native</div>
          <h1 className="landingTitle">Pay-per-call proof for agent tools.</h1>
          <p className="landingSubhead">
            Providers publish APIs and MCP servers as paid x402 endpoints. Operators govern Casper
            wallets with spend policy. Every paid call settles on-chain and produces a receipt
            anyone can verify — no account required.
          </p>
          <div className="landingCtaRow">
            <Link className="landingCtaPrimary" href="/explorer">
              Open explorer <span className="arrow">↗</span>
            </Link>
            <Link className="landingCtaSecondary" href="/app">Connect wallet</Link>
          </div>
        </div>
        <div className="landingProofCard">
          <div className="landingProofHead">
            <span className="landingProofTag">LATEST PROOF</span>
            <StatusChip status={latest.status} />
          </div>
          <div className="landingProofBody">
            <div style={{ font: "600 13.5px/1 var(--sans)" }}>
              {latest.tool} <span style={{ color: "var(--ink-3)" }}>·</span> {latest.provider}
            </div>
            <div className="landingProofPills">
              <span className="pillGw">GATEWAY</span>
              <span className="pillPol">POLICY</span>
              <span className="pillX402">x402</span>
              <span className="pillCs">PROOF</span>
            </div>
            <div className="landingProofHashLabel">{latest.hash ? "DEPLOY HASH" : "RECEIPT ID"}</div>
            <div className="landingProofHash">{latest.hash ?? latest.id}</div>
            <div className="landingProofMeta">
              <div>
                <div className="landingProofHashLabel">AMOUNT</div>
                <div style={{ marginTop: 5, font: "600 14.5px/1 var(--mono)" }}>
                  {latest.amount} {latest.asset}
                </div>
              </div>
              {latest.hash ? (
                <a className="mono" href={`https://testnet.cspr.live/deploy/${latest.hash}`} rel="noopener noreferrer" style={{ color: "var(--brand)", fontWeight: 600, fontSize: 12 }} target="_blank">cspr.live ↗</a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="landingBand" id="how-it-works">
        <div className="landingBandInner">
          <div className="landingBandLabel">HOW A PAID CALL BECOMES PROOF</div>
          <div className="landingFlow">
            {flow.map(([step, desc, color]) => (
              <div key={step}>
                <div className="landingFlowStep" style={{ color }}>{step}</div>
                <div className="landingFlowDesc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landingZones">
        <div className="landingZone">
          <div className="landingZoneHead">
            <span className="landingZoneDot outline" />
            <span className="landingZoneTitle">Public explorer</span>
          </div>
          <p className="landingZoneBody">
            Anyone can verify Casper payment proof — no sign-in, no wallet. Search receipts, deploy
            hashes, and accounts; open raw proof on cspr.live.
          </p>
          <Link className="landingZoneCta" href="/explorer">Open explorer →</Link>
        </div>
        <div className="landingZone">
          <div className="landingZoneHead">
            <span className="landingZoneDot brand" />
            <span className="landingZoneTitle">Operator app 🔒</span>
          </div>
          <p className="landingZoneBody">
            Wallet-gated. Publish paid tools, govern wallet readiness and spend policy, and run
            paid calls through the x402 console.
          </p>
          <Link className="landingZoneCta" href="/app">Connect wallet →</Link>
        </div>
      </section>

      <section className="landingVitality">
        <div className="landingVitalityHead">
          <span className="landingVitalityTitle">Gateway activity</span>
          <span className="landingSampleChip">SAMPLE · FIXTURE</span>
        </div>
        <div className="landingStats">
          <div className="landingStat"><div className="label">RECEIPTS</div><div className="num">{receipts.length}</div></div>
          <div className="landingStat"><div className="label">SETTLED</div><div className="num settled">{settledCount}</div></div>
          <div className="landingStat"><div className="label">UNSETTLED</div><div className="num warn">{unsettledCount}</div></div>
          <div className="landingStat"><div className="label">PROVIDERS</div><div className="num">{providerCount}</div></div>
          <div className="landingStat"><div className="label">LATEST</div><div className="num">{receipts[0].time}</div><div className="sub">most recent fixture</div></div>
        </div>
        <div className="landingRecent">
          <div className="landingRecentHead">
            <div>Status</div><div>Receipt</div><div>Tool · Provider</div>
            <div style={{ textAlign: "right" }}>Amount</div>
            <div style={{ textAlign: "right" }}>Proof</div>
          </div>
          {recent.map((r) => (
            <div className="landingRecentRow" key={r.id}>
              <StatusChip status={r.status} />
              <span className="mono" style={{ fontSize: 12.5 }}>{formatReceiptId(r.id)}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {r.tool} <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>· {r.provider}</span>
              </span>
              <span className="mono" style={{ textAlign: "right", fontSize: 12.5 }}>{r.amount} {r.asset}</span>
              <span className="mono" style={{ textAlign: "right", fontSize: 12, color: r.hash ? "var(--brand)" : "var(--ink-3)" }}>
                {r.hash ? `${r.hash.slice(0, 6)}…${r.hash.slice(-2)} ↗` : "no tx"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
