import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { SourceManager } from "@/components/manage/source-manager";
import { ServerLogo } from "@/components/servers/server-logo";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { getProviderSourceRecord, listProviderTools } from "@/server/provider-store";

export const dynamic = "force-dynamic";

export default async function ManageSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await getProviderSourceRecord(id);
  if (!source) notFound();

  const tools = await listProviderTools(id);
  const sourceView = {
    authMode: source.authMode,
    createdAt: source.createdAt.toISOString(),
    credentialConfigured: Boolean(source.credentialRef),
    endpointUrl: source.endpointUrl,
    id: source.id,
    name: source.name,
    sourceType: source.sourceType,
    updatedAt: source.updatedAt.toISOString(),
  };

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/register" className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-3 hover:text-ink">
          <ArrowLeft className="size-3.5" />
          Register
        </Link>

        <header className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ServerLogo endpointUrl={source.endpointUrl} name={source.name} size={56} />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                <span className="rounded-sm border border-hairline px-2 py-1">{source.sourceType}</span>
                <span className="rounded-sm border border-hairline px-2 py-1">{source.authMode}</span>
                {source.credentialRef ? <span className="rounded-sm border border-hairline px-2 py-1">Credential set</span> : null}
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Manage {source.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
                Control which discovered tools are live, which are free, and which charge WCSPR before agents can call them.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="gap-2 sm:mt-8">
            <Link href={`/servers/${source.id}`}>
              View public page <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </header>

        <div className="mt-8">
          <SourceManager initialTools={tools} source={sourceView} />
        </div>
      </main>
    </div>
  );
}
