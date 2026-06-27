import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { SiteNav } from "@/components/site/site-nav";
import { ServerTools } from "@/components/tools/server-tools";
import { formatAsset, formatTokenAmount } from "@/lib/format-amount";
import { formatAge } from "@/lib/format-time";
import { getServerWithTools } from "@/server/provider-store";
import { listReceiptDetails } from "@/server/receipt-store";

export const dynamic = "force-dynamic";

export default async function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = await getServerWithTools(id);
  if (!server) notFound();

  const toolNames = new Set(server.tools.map((t) => t.name));
  const all = await listReceiptDetails().catch(() => []);
  const recent = all.filter((r) => toolNames.has(r.receipt.tool)).slice(0, 6);

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/servers" className="font-mono text-xs text-ink-3 hover:text-ink">
          ← Servers
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">{server.source.name}</h1>
        <div className="mt-2 font-mono text-xs text-ink-3">{server.source.endpointUrl}</div>

        <section className="mt-8">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            {server.tools.length} paid tool{server.tools.length > 1 ? "s" : ""}
          </div>
          <ServerTools
            endpointUrl={server.source.endpointUrl}
            tools={server.tools.map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
              price: t.price ? { amount: t.price.amount } : null,
            }))}
          />
        </section>

        <section className="mt-10">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">Recent settlements</div>
          {recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-hairline bg-panel p-6 text-sm text-ink-3">
              No paid calls yet — run a tool above.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-hairline">
              {recent.map((r, i) => (
                <Link
                  key={r.receipt.id}
                  href={`/receipt/${r.receipt.id}`}
                  className={`flex items-center gap-3 bg-panel px-4 py-3 hover:bg-well ${i > 0 ? "border-t border-hairline" : ""}`}
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${r.receipt.status === "settled" ? "bg-settled" : "bg-signal"}`} />
                  <span className="w-20 shrink-0 font-mono text-xs text-ink">{r.receipt.tool}</span>
                  <span className="flex-1 truncate font-mono text-xs text-ink-3">
                    {r.receipt.hash ? `${r.receipt.hash.slice(0, 12)}…` : r.receipt.status}
                  </span>
                  <span className="font-mono text-xs text-ink tnum">
                    {formatTokenAmount(r.receipt.amount)} {formatAsset(r.receipt.asset)}
                  </span>
                  <span className="w-14 text-right font-mono text-[11px] text-ink-3">{formatAge(r.receipt.time)}</span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-ink-3" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
