import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SiteNav } from "@/components/site/site-nav";
import { formatAsset, formatTokenAmount } from "@/lib/format-amount";
import { formatAge } from "@/lib/format-time";
import { listReceiptDetails } from "@/server/receipt-store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explorer — Casper GW" };

const STATUS_TONE: Record<string, string> = {
  settled: "bg-settled",
  raw_proof_unavailable: "bg-signal",
};

export default async function ExplorerPage() {
  const receipts = await listReceiptDetails().catch(() => []);
  const settled = receipts.filter((r) => r.receipt.status === "settled" || r.receipt.status === "raw_proof_unavailable");
  const volume = settled.reduce((sum, r) => sum + BigInt(r.receipt.amount || "0"), BigInt(0));

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Explorer</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Every x402 payment settled through the gateway on Casper Testnet. Public — no sign-in.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "PAID CALLS", value: String(receipts.length) },
            { label: "SETTLED", value: String(settled.length) },
            { label: "WCSPR SETTLED", value: formatTokenAmount(volume.toString()) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-hairline bg-panel p-4">
              <div className="font-display text-2xl font-bold tracking-tight text-ink tnum">{s.value}</div>
              <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-hairline">
          <div className="grid grid-cols-[16px_1.6fr_1fr_1fr_0.8fr] items-center gap-3 bg-well px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-3 max-sm:grid-cols-[16px_1.4fr_1fr]">
            <span />
            <span>Tool · Provider</span>
            <span className="text-right">Amount</span>
            <span className="max-sm:hidden">Deploy hash</span>
            <span className="text-right max-sm:hidden">Age</span>
          </div>
          {receipts.length === 0 ? (
            <div className="bg-panel px-4 py-10 text-center text-sm text-ink-3">No paid calls yet.</div>
          ) : (
            receipts.map((r, i) => (
              <Link
                key={r.receipt.id}
                href={`/receipt/${r.receipt.id}`}
                className={`grid grid-cols-[16px_1.6fr_1fr_1fr_0.8fr] items-center gap-3 bg-panel px-4 py-3 hover:bg-well max-sm:grid-cols-[16px_1.4fr_1fr] ${i > 0 ? "border-t border-hairline" : ""}`}
              >
                <span className={`size-1.5 rounded-full ${STATUS_TONE[r.receipt.status] ?? "bg-signal"}`} title={r.receipt.status} />
                <span className="min-w-0 truncate text-sm">
                  <span className="font-mono text-ink">{r.receipt.tool}</span>
                  <span className="text-ink-3"> · {r.receipt.provider}</span>
                </span>
                <span className="text-right font-mono text-xs text-ink tnum">
                  {formatTokenAmount(r.receipt.amount)} {formatAsset(r.receipt.asset)}
                </span>
                <span className="flex items-center gap-1 font-mono text-xs text-ink-3 max-sm:hidden">
                  {r.receipt.hash ? (
                    <>
                      {r.receipt.hash.slice(0, 8)}…{r.receipt.hash.slice(-6)}
                      <ArrowUpRight className="size-3 text-casper" />
                    </>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </span>
                <span className="text-right font-mono text-[11px] text-ink-3 max-sm:hidden">{formatAge(r.receipt.time)}</span>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
