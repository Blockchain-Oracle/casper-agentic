import Link from "next/link";

import { BrandMark } from "@/components/site/proof-stamp";
import { Button } from "@/components/ui/button";

/**
 * Custom 404, framed in the product's own language: a missing route is a proof
 * lookup that found nothing, so it reads like a failed verify (ochre, never red —
 * red is reserved for positive proof) and points to the explorer. Proof-Print.
 */
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-6 text-ink">
      <section className="w-full max-w-lg text-center">
        <div className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-ink-3">
          <BrandMark size={14} /> Proof not found
        </div>

        <div className="mt-4 font-display text-[clamp(72px,16vw,104px)] font-bold leading-none tracking-tight text-ink">404</div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">No receipt at this address</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">
          The page, receipt, or deploy you&rsquo;re looking for doesn&rsquo;t exist — or never settled. Verify a proof in
          the explorer, or head back to the gateway.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-signal">
          <span className="size-1.5 rounded-full bg-signal" /> Verify fail · 404
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/explorer">Open explorer →</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
