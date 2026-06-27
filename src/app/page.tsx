import Link from "next/link";
import { ArrowRight, KeyRound, Plug, ScanLine } from "lucide-react";

import { SiteNav } from "@/components/site/site-nav";
import { ProofStamp } from "@/components/site/proof-stamp";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Plug,
    title: "Register a tool",
    body: "Point the gateway at an MCP server or API. It discovers the tools and you price each one in WCSPR.",
  },
  {
    icon: KeyRound,
    title: "Pay with an API key",
    body: "Agents call with a casper_ key. The gateway settles each call on Casper — no wallet pop-ups, no per-user custody.",
  },
  {
    icon: ScanLine,
    title: "Verify the proof",
    body: "Every paid call lands a real Casper deploy. Anyone can open the receipt and the on-chain proof on cspr.live.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-panel px-3 py-1 font-mono text-[11px] tracking-wider text-ink-3">
              <span className="size-1.5 rounded-full bg-casper" />
              AGENT PAYMENTS · CASPER NATIVE
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Proof for every
              <br />
              agent payment.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-2">
              Casper GW is an x402 payment gateway on Casper. Publish paid tools, let agents pay
              per call with an API key, and verify every settlement on-chain — no account required
              to look.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/explorer">
                  Open the explorer
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Register a tool</Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="relative grid place-items-center">
              <div
                className="absolute size-72 rounded-full opacity-60 blur-2xl"
                style={{ background: "radial-gradient(circle, var(--color-casper) 0%, transparent 68%)", opacity: 0.12 }}
              />
              <ProofStamp size={232} />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-hairline py-16">
          <div className="mb-9 font-mono text-[11px] tracking-widest text-ink-3">
            HOW A PAID CALL BECOMES PROOF
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-lg border border-hairline bg-panel p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-md bg-well text-ink">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="font-mono text-xs text-ink-3">0{i + 1}</span>
                </div>
                <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 text-sm text-ink-3 sm:flex-row">
          <span className="font-mono text-xs tracking-wider">CASPER GW · x402 ON CASPER TESTNET</span>
          <Link href="/explorer" className="hover:text-ink">Explorer</Link>
        </div>
      </footer>
    </div>
  );
}
