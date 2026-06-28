import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { ConnectDialog } from "@/components/connect/connect-dialog";
import { CopyButton } from "@/components/primitives/copy-button";
import { TokenIcon } from "@/components/primitives/token-icon";
import { SiteNav } from "@/components/site/site-nav";
import { ServerTools } from "@/components/tools/server-tools";
import { casperExplorerUrl, truncateHash } from "@/lib/casper-explorer";
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

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{server.source.name}</h1>
            <div className="mt-2 break-all font-mono text-xs text-ink-3">{server.source.endpointUrl}</div>
          </div>
          <ConnectDialog sourceId={server.source.id} serverName={server.source.name} />
        </div>

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
                <div
                  key={r.receipt.id}
                  className={`flex items-center gap-3 bg-panel px-4 py-3 hover:bg-well ${i > 0 ? "border-t border-hairline" : ""}`}
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${r.receipt.status === "settled" ? "bg-settled" : "bg-signal"}`} />
                  <Link href={`/receipt/${r.receipt.id}`} className="w-20 shrink-0 font-mono text-xs text-ink hover:underline">{r.receipt.tool}</Link>
                  <span className="flex flex-1 items-center gap-1.5 truncate font-mono text-xs text-ink-3">
                    {r.receipt.hash ? (
                      <>
                        <a href={casperExplorerUrl(r.receipt.hash, "deploy")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:text-casper">
                          {truncateHash(r.receipt.hash)} <ArrowUpRight className="size-3 text-casper" />
                        </a>
                        <CopyButton value={r.receipt.hash} label="Deploy hash copied" />
                      </>
                    ) : (
                      r.receipt.status
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-ink tnum">
                    <TokenIcon size={14} />
                    {formatTokenAmount(r.receipt.amount)} {formatAsset(r.receipt.asset)}
                  </span>
                  <span className="w-14 text-right font-mono text-[11px] text-ink-3">{formatAge(r.receipt.time)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
