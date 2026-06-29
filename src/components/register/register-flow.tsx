"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, Plug, Check, CircleDollarSign } from "lucide-react";
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
  const [freeTools, setFreeTools] = useState<Set<string>>(new Set());
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState("7.5");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [kind, setKind] = useState<"mcp" | "openapi">("mcp");

  async function discover() {
    if (!name.trim() || !url.trim()) return toast.error("Add a name and an endpoint URL.");
    setPhase("discovering");
    try {
      const { source } = await createSource({ endpointUrl: url.trim(), name: name.trim(), sourceType: kind });
      const { tools: found } = await discoverSource(source.id);
      if (!found.length) {
        toast.error("No tools found at that endpoint.");
        return setPhase("form");
      }
      setSourceId(source.id);
      setTools(found);
      setPrices(Object.fromEntries(found.map((t) => [t.id, "7.5"])));
      setSelectedTools(new Set(found.map((t) => t.id)));
      setFreeTools(new Set());
      setPhase("priced");
      toast.success(`Discovered ${found.length} tool${found.length > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Discovery failed.");
      setPhase("form");
    }
  }

  async function publishSelected() {
    const selected = tools.filter((tool) => selectedTools.has(tool.id));
    if (!selected.length) return toast.error("Select at least one tool to publish.");
    setPhase("publishing");
    try {
      for (const tool of selected) {
        if (!freeTools.has(tool.id)) {
          await priceTool(tool.id, parseTokenToMotes(prices[tool.id] ?? "7.5"));
        }
        await publishTool(tool.id);
      }
      setPhase("done");
      toast.success(`${selected.length} tool${selected.length > 1 ? "s" : ""} published.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed.");
      setPhase("priced");
    }
  }

  function applyBulk() {
    setPrices((current) => {
      const next = { ...current };
      for (const tool of tools) {
        if (selectedTools.has(tool.id) && !freeTools.has(tool.id)) next[tool.id] = bulk;
      }
      return next;
    });
  }

  function clearSelectedPrices() {
    setPrices((current) => {
      const next = { ...current };
      for (const tool of tools) if (selectedTools.has(tool.id)) next[tool.id] = "";
      return next;
    });
  }

  function toggleSelected(toolId: string) {
    setSelectedTools((current) => {
      const next = new Set(current);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }

  function toggleFree(toolId: string) {
    setFreeTools((current) => {
      const next = new Set(current);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }

  if (phase === "done") {
    return (
      <div className="rounded-lg border border-hairline bg-panel p-8 text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-settled/15 text-settled">
          <Check className="size-6" />
        </span>
        <h2 className="font-display text-xl font-semibold text-ink">Published</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-2">
          {selectedTools.size} tool{selectedTools.size > 1 ? "s are" : " is"} live. Paid tools settle with a casper_ key; free tools run without x402.
        </p>
        <Button asChild className="mt-6 gap-2">
          <Link href={sourceId ? `/servers/${sourceId}` : "/servers"}>
            View server <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-hairline bg-panel p-5">
        <div className="mb-4 inline-flex rounded-md border border-hairline bg-well p-0.5">
          {([["mcp", "MCP Server"], ["openapi", "API (OpenAPI)"]] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setKind(value)}
              disabled={phase !== "form"}
              className={`rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${kind === value ? "bg-panel text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-ink-3">Source name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "mcp" ? "CSPR.trade MCP" : "FakeREST API"} disabled={phase !== "form"} />
        <label className="mb-1.5 mt-4 block font-mono text-[11px] uppercase tracking-widest text-ink-3">
          {kind === "mcp" ? "MCP endpoint URL" : "OpenAPI / Swagger spec URL"}
        </label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={kind === "mcp" ? "https://mcp.cspr.trade/mcp" : "https://api.example.com/openapi.json"}
          disabled={phase !== "form"}
          className="font-mono text-sm"
        />
        {kind === "openapi" ? (
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            We convert the spec to paid tools and execute each as a real REST call after settlement — no code, hosted by the gateway.
          </p>
        ) : null}
        {phase === "form" || phase === "discovering" ? (
          <Button onClick={discover} disabled={phase === "discovering"} className="mt-5 gap-2">
            {phase === "discovering" ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
            {phase === "discovering" ? "Discovering…" : "Discover tools"}
          </Button>
        ) : null}
      </div>

      {tools.length > 0 ? (
        <div className="rounded-lg border border-hairline bg-panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Select, price &amp; publish · {selectedTools.size}/{tools.length} selected
            </span>
            <div className="flex items-center gap-1.5">
              <Input value={bulk} onChange={(e) => setBulk(e.target.value)} className="h-7 w-20 text-right text-xs tnum" inputMode="decimal" disabled={phase === "publishing"} />
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={phase === "publishing"} onClick={applyBulk}>Apply</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={phase === "publishing"} onClick={clearSelectedPrices}>Clear</Button>
            </div>
          </div>
          <div className="space-y-2.5">
            {tools.map((tool) => {
              const selected = selectedTools.has(tool.id);
              const free = freeTools.has(tool.id);
              return (
                <div key={tool.id} className={`rounded-md border px-3 py-2.5 ${selected ? "border-hairline bg-well" : "border-dashed border-hairline bg-panel opacity-70"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => toggleSelected(tool.id)}
                      disabled={phase === "publishing"}
                      className={`grid size-8 shrink-0 place-items-center rounded-md border ${selected ? "border-casper bg-casper/10 text-casper" : "border-hairline text-ink-3"}`}
                      aria-label={selected ? "Unselect tool" : "Select tool"}
                    >
                      {selected ? <Check className="size-4" /> : <span className="size-3 rounded-sm border border-current" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-sm text-ink">{tool.name}</div>
                      {tool.description ? <div className="truncate text-xs text-ink-3">{tool.description}</div> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-1 rounded-md border border-hairline bg-panel p-0.5 font-mono text-[11px] uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => free ? toggleFree(tool.id) : undefined}
                        disabled={!selected || phase === "publishing"}
                        className={`rounded px-2 py-1.5 ${!free ? "bg-casper/10 text-ink" : "text-ink-3"}`}
                      >
                        Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => !free ? toggleFree(tool.id) : undefined}
                        disabled={!selected || phase === "publishing"}
                        className={`rounded px-2 py-1.5 ${free ? "bg-settled/10 text-settled" : "text-ink-3"}`}
                      >
                        Free
                      </button>
                    </div>
                    <Input
                      value={free ? "0" : (prices[tool.id] ?? "7.5")}
                      onChange={(e) => setPrices((p) => ({ ...p, [tool.id]: e.target.value }))}
                      disabled={phase === "publishing" || !selected || free}
                      className="w-full text-right tnum sm:w-24"
                      inputMode="decimal"
                    />
                    <span className="w-14 font-mono text-xs text-ink-3">WCSPR</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={publishSelected} disabled={phase === "publishing" || selectedTools.size === 0} className="mt-5 gap-2">
            {phase === "publishing" ? <Loader2 className="size-4 animate-spin" /> : <CircleDollarSign className="size-4" />}
            {phase === "publishing" ? "Publishing…" : `Publish ${selectedTools.size} selected`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
