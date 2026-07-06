import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { NetworkFilter } from "@/components/primitives/network-filter";
import { ServerCard } from "@/components/servers/server-card";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { getCasperNetwork, isCasperNetworkId } from "@/lib/casper-networks";
import { listServerCatalog } from "@/server/provider-store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Servers — Casper GW" };

export default async function ServersPage({ searchParams }: { searchParams: Promise<{ network?: string }> }) {
  const { network: networkParam } = await searchParams;
  const selectedNetwork = isCasperNetworkId(networkParam) ? networkParam : null;
  const all = await listServerCatalog();
  const servers = selectedNetwork
    ? all.filter((server) => server.networks.some((network) => getCasperNetwork(network).id === selectedNetwork))
    : all;

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Servers</h1>
            <p className="mt-2 text-[15px] text-ink-2">
              MCP servers published on the gateway. Open one to run its paid tools on Casper.
            </p>
          </div>
          <NetworkFilter />
        </div>

        {servers.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-hairline bg-panel p-10 text-center">
            {selectedNetwork ? (
              <p className="text-sm text-ink-2">No servers pricing tools on {getCasperNetwork(selectedNetwork).label} yet.</p>
            ) : (
              <>
                <p className="text-sm text-ink-2">No servers published yet.</p>
                <Button asChild variant="outline" className="mt-4 gap-2">
                  <Link href="/register">
                    Register the first server <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
