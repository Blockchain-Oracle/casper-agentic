"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Loader2, Play } from "lucide-react";

import { ProofStamp } from "@/components/site/proof-stamp";
import { SchemaForm } from "@/components/tools/schema-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokenAmount } from "@/lib/format-amount";
import { runPaidCall } from "@/lib/gateway-api";

export interface ServerTool {
  id: string;
  name: string;
  description: string | null;
  inputSchema: unknown;
  price: { amount: string } | null;
}

/** Searchable, expandable tools list for a server detail — modelled on MCPay's tools accordion. */
export function ServerTools({ endpointUrl, tools }: { endpointUrl: string; tools: ServerTool[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
  }, [query, tools]);

  return (
    <div>
      <Input placeholder="Search tools" value={query} onChange={(e) => setQuery(e.target.value)} className="mb-3" />
      <Accordion type="single" collapsible className="overflow-hidden rounded-lg border border-hairline bg-panel">
        {filtered.map((tool) => (
          <AccordionItem key={tool.id} value={tool.id} className="border-hairline px-4 last:border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-mono text-sm text-ink">{tool.name}</span>
                {tool.price ? (
                  <span className="rounded-sm border border-hairline px-2 py-0.5 font-mono text-xs text-ink tnum">
                    {formatTokenAmount(tool.price.amount)} WCSPR
                  </span>
                ) : null}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ToolRunner tool={tool} endpointUrl={endpointUrl} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

const SETTLED = new Set(["settled", "raw_proof_unavailable"]);

function ToolRunner({ tool, endpointUrl }: { tool: ServerTool; endpointUrl: string }) {
  const [args, setArgs] = useState<Record<string, unknown>>({});
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<{ attemptId?: string; status: string; explorerUrl?: string; reason?: string } | null>(null);

  async function run() {
    setPhase("running");
    try {
      setResult(await runPaidCall({ args, client: "server-console", endpointUrl, toolName: tool.name }));
    } catch (error) {
      setResult({ reason: error instanceof Error ? error.message : "request failed", status: "error" });
    }
    setPhase("done");
  }

  if (phase === "done" && result) {
    const settled = SETTLED.has(result.status);
    const hash = result.explorerUrl?.split("/deploy/")[1];
    return (
      <div className="pb-2 text-center">
        {settled ? (
          <ProofStamp size={84} hash={hash} className="mx-auto" />
        ) : (
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-signal/15 font-mono text-signal">✕</span>
        )}
        <div className="mt-2 font-display text-base font-semibold text-ink">
          {result.status === "settled" ? "Settled" : result.status === "raw_proof_unavailable" ? "Settled · proof indexing" : result.status === "blocked" ? "Blocked" : "Not settled"}
        </div>
        {result.reason ? <p className="mt-1 text-sm text-signal">{result.reason}</p> : null}
        {hash ? <p className="mt-1 break-all font-mono text-xs text-ink-3">{hash}</p> : null}
        <div className="mt-4 flex justify-center gap-2">
          {result.explorerUrl ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">cspr.live <ArrowUpRight className="size-3.5" /></a>
            </Button>
          ) : null}
          {result.attemptId ? (
            <Button asChild size="sm"><Link href={`/receipt/${result.attemptId}`}>Receipt</Link></Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => { setPhase("idle"); setResult(null); }}>Run again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      {tool.description ? <p className="mb-3 text-sm leading-relaxed text-ink-2">{tool.description}</p> : null}
      <SchemaForm schema={tool.inputSchema} values={args} onChange={setArgs} />
      <Button onClick={run} disabled={phase === "running"} className="mt-4 w-full gap-2">
        {phase === "running" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        {phase === "running" ? "Signing & settling on Casper…" : `Pay & run · ${tool.price ? formatTokenAmount(tool.price.amount) : "?"} WCSPR`}
      </Button>
    </div>
  );
}
