"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { NetworkBadge } from "@/components/primitives/network-badge";
import { ServerLogo } from "@/components/servers/server-logo";
import { Button } from "@/components/ui/button";

/** Server catalogue card — name + tool count + a CONNECT button that copies the
 * MCP endpoint (MCPay's pattern: the agent connects to that endpoint). */
export function ServerCard({
  server,
}: {
  server: { id: string; name: string; endpointUrl: string; toolCount: number; networks?: string[] };
}) {
  const [copied, setCopied] = useState(false);

  function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(server.endpointUrl);
    setCopied(true);
    toast.success("Copied MCP endpoint");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Link
      href={`/servers/${server.id}`}
      className="group rounded-lg border border-hairline bg-panel p-5 transition-colors hover:border-ink-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ServerLogo endpointUrl={server.endpointUrl} name={server.name} />
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold text-ink">{server.name}</div>
            <div className="mt-1 truncate font-mono text-xs text-ink-3">{server.endpointUrl}</div>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:text-casper" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
          {server.toolCount} paid tool{server.toolCount > 1 ? "s" : ""}
          {server.networks?.map((network) => <NetworkBadge key={network} network={network} />)}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={copy}
          className="h-7 gap-1.5 font-mono text-[11px] uppercase tracking-wider"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Connect
        </Button>
      </div>
    </Link>
  );
}
