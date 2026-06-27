"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, Plug, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSource, discoverSource, priceTool, publishTool, type DiscoveredTool } from "@/lib/gateway-api";
import { parseTokenToMotes } from "@/lib/format-amount";

type Phase = "form" | "discovering" | "priced" | "publishing" | "done";

export function RegisterFlow() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [tools, setTools] = useState<DiscoveredTool[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [sourceId, setSourceId] = useState<string | null>(null);

  async function discover() {
    if (!name.trim() || !url.trim()) return toast.error("Add a name and an MCP endpoint URL.");
    setPhase("discovering");
    try {
      const { source } = await createSource({ endpointUrl: url.trim(), name: name.trim() });
      const { tools: found } = await discoverSource(source.id);
      if (!found.length) {
        toast.error("No tools found at that endpoint.");
        return setPhase("form");
      }
      setSourceId(source.id);
      setTools(found);
      setPrices(Object.fromEntries(found.map((t) => [t.id, "7.5"])));
      setPhase("priced");
      toast.success(`Discovered ${found.length} tool${found.length > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Discovery failed.");
      setPhase("form");
    }
  }

  async function publishAll() {
    setPhase("publishing");
    try {
      for (const tool of tools) {
        await priceTool(tool.id, parseTokenToMotes(prices[tool.id] ?? "7.5"));
        await publishTool(tool.id);
      }
      setPhase("done");
      toast.success("Tools published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed.");
      setPhase("priced");
    }
  }

  if (phase === "done") {
    return (
      <div className="rounded-lg border border-hairline bg-panel p-8 text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-settled/15 text-settled">
          <Check className="size-6" />
        </span>
        <h2 className="font-display text-xl font-semibold text-ink">Published</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-2">
          {tools.length} tool{tools.length > 1 ? "s are" : " is"} live and payable. Agents can call them with an API key.
        </p>
        <Button asChild className="mt-6 gap-2">
          <Link href={sourceId ? `/tools?source=${sourceId}` : "/tools"}>
            View in the catalogue <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-hairline bg-panel p-5">
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-ink-3">Source name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CSPR.trade MCP" disabled={phase !== "form"} />
        <label className="mb-1.5 mt-4 block font-mono text-[11px] uppercase tracking-widest text-ink-3">MCP endpoint URL</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mcp.cspr.trade/mcp" disabled={phase !== "form"} className="font-mono text-sm" />
        {phase === "form" || phase === "discovering" ? (
          <Button onClick={discover} disabled={phase === "discovering"} className="mt-5 gap-2">
            {phase === "discovering" ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            {phase === "discovering" ? "Discovering…" : "Discover tools"}
          </Button>
        ) : null}
      </div>

      {tools.length > 0 ? (
        <div className="rounded-lg border border-hairline bg-panel p-5">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Price &amp; publish · {tools.length} tool{tools.length > 1 ? "s" : ""}
          </div>
          <div className="space-y-2.5">
            {tools.map((tool) => (
              <div key={tool.id} className="flex items-center gap-3 rounded-md border border-hairline bg-well px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm text-ink">{tool.name}</div>
                  {tool.description ? <div className="truncate text-xs text-ink-3">{tool.description}</div> : null}
                </div>
                <Input
                  value={prices[tool.id] ?? "7.5"}
                  onChange={(e) => setPrices((p) => ({ ...p, [tool.id]: e.target.value }))}
                  disabled={phase === "publishing"}
                  className="w-24 text-right tnum"
                  inputMode="decimal"
                />
                <span className="w-14 font-mono text-xs text-ink-3">WCSPR</span>
              </div>
            ))}
          </div>
          <Button onClick={publishAll} disabled={phase === "publishing"} className="mt-5 gap-2">
            {phase === "publishing" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {phase === "publishing" ? "Publishing…" : `Publish ${tools.length} tool${tools.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
