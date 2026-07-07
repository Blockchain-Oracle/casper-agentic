import Link from "next/link";
import { ArrowRight, KeyRound, Plug, ScanLine } from "lucide-react";

import { ServerCard } from "@/components/servers/server-card";
import { ClientLogos } from "@/components/site/client-logos";
import { ProofStamp } from "@/components/site/proof-stamp";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { networkFromChainName } from "@/lib/casper-networks";
import { formatTokenAmount } from "@/lib/format-amount";
import { listServerCatalog } from "@/server/provider-store";
import { listReceiptDetails } from "@/server/receipt-store";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: Plug, title: "Register a server", body: "Point the gateway at an MCP or API endpoint. It discovers the tools; you price each one in WCSPR." },
  { icon: KeyRound, title: "Pay with an API key", body: "Agents call with a casper_ key. The gateway settles each call on Casper — no wallet pop-ups, no per-user custody." },
  { icon: ScanLine, title: "Verify the proof", body: "Every paid call lands a real Casper deploy. Anyone can open the receipt and the on-chain proof on cspr.live." },
] as const;

export default async function Home() {
  const network = networkFromChainName(process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME);
  const [servers, receipts] = await Promise.all([
    listServerCatalog().catch(() => []),
    listReceiptDetails().catch(() => []),
  ]);
  const settled = receipts.filter((r) => r.receipt.status === "settled" || r.receipt.status === "raw_proof_unavailable");
  const volume = settled.reduce((sum, r) => sum + BigInt(r.receipt.amount || "0"), BigInt(0));
  const stats = [
    { label: "SERVERS", value: String(servers.length) },
    { label: "SETTLED CALLS", value: String(settled.length) },
    { label: "WCSPR SETTLED", value: formatTokenAmount(volume.toString()) },
  ];

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <div className="reveal mb-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-panel px-3 py-1 font-mono text-[11px] tracking-wider text-ink-3">
              <span className="size-1.5 rounded-full bg-casper" /> AGENT PAYMENTS · CASPER NATIVE
            </div>
            <h1
              className="reveal font-display text-4xl font-bold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl"
              style={{ "--reveal-order": 1 } as React.CSSProperties}
            >
              Proof for every
              <br />
              agent payment.
            </h1>
            <p
              className="reveal mt-5 max-w-md text-[15px] leading-relaxed text-ink-2"
              style={{ "--reveal-order": 2 } as React.CSSProperties}
            >
              Casper GW is an x402 payment gateway on Casper. Publish paid tools, let agents pay per
              call with an API key, and verify every settlement on-chain — no account required to look.
            </p>
            <div
              className="reveal mt-7 flex flex-wrap items-center gap-3"
              style={{ "--reveal-order": 3 } as React.CSSProperties}
            >
              <Button asChild size="lg" className="gap-2">
                <Link href="/servers">Browse servers <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Register a server</Link>
              </Button>
            </div>
          </div>
          <div
            className="reveal flex justify-center md:justify-end"
            style={{ "--reveal-order": 4 } as React.CSSProperties}
          >
            <div className="relative grid place-items-center">
              <div className="absolute size-72 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, var(--color-casper) 0%, transparent 68%)", opacity: 0.12 }} />
              <ProofStamp size={232} />
            </div>
          </div>
        </section>

        <ClientLogos />

        {/* Featured servers (real) */}
        {servers.length > 0 ? (
          <section className="border-t border-hairline py-14">
            <div className="mb-6 flex items-end justify-between">
              <div className="font-mono text-[11px] tracking-widest text-ink-3">FEATURED SERVERS</div>
              <Link href="/servers" className="font-mono text-xs text-ink-3 hover:text-ink">Browse all →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {servers.slice(0, 6).map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>
          </section>
        ) : null}

        {/* How it works — a numbered 01→02→03 sequence, not a card row */}
        <section className="border-t border-hairline py-14">
          <div className="mb-9 font-mono text-[11px] tracking-widest text-ink-3">HOW A PAID CALL BECOMES PROOF</div>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="bg-surface p-6">
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold leading-none text-casper tnum">0{i + 1}</span>
                  <span className="grid size-8 place-items-center rounded-md bg-well text-ink-2"><Icon className="size-4" /></span>
                </div>
                <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Stats (real) — one full-bleed band, large figures, no per-stat boxes */}
        <section className="relative left-1/2 my-14 w-screen -translate-x-1/2 border-y border-hairline bg-well">
          <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-hairline px-5 py-12 sm:py-14">
            {stats.map((s) => (
              <div key={s.label} className="px-3 text-center sm:px-6">
                <div className="font-display text-4xl font-bold tracking-tight text-ink tnum sm:text-5xl">{s.value}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink-3 sm:text-[11px]">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Settle your first agent payment.</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-2">Register a server, price its tools, and watch a real Casper deploy land per call.</p>
          <Button asChild size="lg" className="mt-6 gap-2">
            <Link href="/register">Register a server <ArrowRight className="size-4" /></Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 text-sm text-ink-3 sm:flex-row">
          <span className="font-mono text-xs tracking-wider">
            CASPER GW · x402 ON CASPER {network.label.toUpperCase()}
          </span>
          <div className="flex gap-4">
            <Link href="/servers" className="hover:text-ink">Servers</Link>
            <Link href="/explorer" className="hover:text-ink">Explorer</Link>
            <a href="https://github.com/Blockchain-Oracle/casper-agentic" target="_blank" rel="noopener noreferrer" className="hover:text-ink">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
