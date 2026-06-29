"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, LockKeyhole, Loader2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listSources } from "@/lib/gateway-api";

type SourceRow = { endpointUrl: string; id: string; name: string; sourceType: string };

export function RegisteredSourcesPanel() {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceRow[]>([]);

  useEffect(() => {
    let alive = true;
    listSources()
      .then((response) => {
        if (alive) setSources(response.sources);
      })
      .catch(() => {
        if (alive) setSources([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mt-8 rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Registered endpoints</h2>
        {loading ? <Loader2 className="size-4 animate-spin text-ink-3" /> : null}
      </div>
      {sources.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline bg-well p-4 text-sm text-ink-3">
          No endpoints registered yet.
        </p>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="flex flex-col gap-3 rounded-md border border-hairline bg-well p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{source.name}</div>
                <div className="mt-1 truncate font-mono text-[11px] text-ink-3">{source.endpointUrl}</div>
              </div>
              <span className="w-fit rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase text-ink-3">
                {source.sourceType}
              </span>
              <Button asChild size="sm" className="gap-1.5">
                <Link href={`/manage/${source.id}`}>Manage <Wrench className="size-3.5" /></Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/servers/${source.id}`}>View <ArrowUpRight className="size-3.5" /></Link>
              </Button>
              <Button size="icon-sm" variant="ghost" disabled aria-label="Delete requires owner verification" title="Delete requires owner verification">
                <LockKeyhole className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
