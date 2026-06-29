"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Loader2, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteSource, listSources } from "@/lib/gateway-api";
import { useOwnerSession } from "@/lib/owner-session";

type SourceRow = { endpointUrl: string; id: string; name: string; sourceType: string; ownerPublicKey: string | null };

export function RegisteredSourcesPanel() {
  const { enabled, identity } = useOwnerSession();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listSources()
      .then((response) => setSources(response.sources))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Mount fetch: setLoading runs before the awaited listSources resolves — the
    // accepted "subscribe to external system" case, not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Consistent with the server guard: you can manage a server you own, or claim an
  // unclaimed (owner-null) one — only while signed in. Owned-by-someone-else is hidden.
  function canManage(source: SourceRow) {
    if (!enabled || !identity) return false;
    return source.ownerPublicKey === null || source.ownerPublicKey === identity.publicKey;
  }

  async function onDelete(source: SourceRow) {
    if (!window.confirm(`Delete "${source.name}" and all its tools? This cannot be undone.`)) return;
    setDeletingId(source.id);
    try {
      await deleteSource(source.id);
      toast.success(`Deleted ${source.name}`);
      setSources((rows) => rows.filter((row) => row.id !== source.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete server");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Registered endpoints</h2>
        {loading ? <Loader2 className="size-4 animate-spin text-ink-3" /> : null}
      </div>
      {enabled && !identity ? (
        <p className="mb-3 rounded-md border border-hairline bg-well px-3 py-2 text-xs text-ink-3">
          Sign in with your wallet (Account → Wallet) to manage the servers you own.
        </p>
      ) : null}
      {sources.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline bg-well p-4 text-sm text-ink-3">
          No endpoints registered yet.
        </p>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => {
            const manageable = canManage(source);
            return (
              <div key={source.id} className="flex flex-col gap-3 rounded-md border border-hairline bg-well p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{source.name}</div>
                  <div className="mt-1 truncate font-mono text-[11px] text-ink-3">{source.endpointUrl}</div>
                </div>
                <span className="w-fit rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase text-ink-3">
                  {source.sourceType}
                </span>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href={`/servers/${source.id}`}>View <ArrowUpRight className="size-3.5" /></Link>
                </Button>
                {manageable ? (
                  <>
                    <Button asChild size="sm" className="gap-1.5">
                      <Link href={`/manage/${source.id}`}>Manage <Wrench className="size-3.5" /></Link>
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onDelete(source)}
                      disabled={deletingId === source.id}
                      aria-label={`Delete ${source.name}`}
                      title="Delete server"
                    >
                      {deletingId === source.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
