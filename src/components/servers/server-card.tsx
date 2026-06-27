"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Copy, Server } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Server catalogue card — name + tool count + a CONNECT button that copies the
 * MCP endpoint (MCPay's pattern: the agent connects to that endpoint). */
export function ServerCard({
  server,
}: {
  server: { id: string; name: string; endpointUrl: string; toolCount: number };
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
      <div className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-md bg-well text-ink">
          <Server className="size-4.5" />
        </span>
        <ArrowUpRight className="size-4 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:text-casper" />
      </div>
      <div className="mt-3 font-display text-base font-semibold text-ink">{server.name}</div>
      <div className="mt-1 truncate font-mono text-xs text-ink-3">{server.endpointUrl}</div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
          {server.toolCount} paid tool{server.toolCount > 1 ? "s" : ""}
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
