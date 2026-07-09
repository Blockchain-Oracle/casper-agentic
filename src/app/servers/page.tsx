import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ServerCard } from "@/components/servers/server-card";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { listServerCatalog } from "@/server/provider-store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Servers — Casper GW" };

export default async function ServersPage() {
  const servers = await listServerCatalog().catch(() => []);

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Servers</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          MCP servers published on the gateway. Open one to run its paid tools on Casper.
        </p>

        {servers.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-hairline bg-panel p-10 text-center">
            <p className="text-sm text-ink-2">No servers published yet.</p>
            <Button asChild variant="outline" className="mt-4 gap-2">
              <Link href="/register">
                Register the first server <ArrowRight className="size-4" />
              </Link>
            </Button>
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
