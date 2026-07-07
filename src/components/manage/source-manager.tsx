"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, Copy, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ManageToolRow } from "@/components/manage/manage-tool-row";
import type { ManageMode, ManagedSource, ManageTool } from "@/components/manage/manage-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokenAmount, parseTokenToMotes } from "@/lib/format-amount";
import { deleteSource, listTools, priceTool, publishFreeTool, publishTool, unpublishTool } from "@/lib/gateway-api";
import { useOwnerSession } from "@/lib/owner-session";

export function SourceManager({ initialTools, source }: { initialTools: ManageTool[]; source: ManagedSource }) {
  const [tools, setTools] = useState(initialTools);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, string>>(() => priceMap(initialTools));
  const [modes, setModes] = useState<Record<string, ManageMode>>(() => modeMap(initialTools));
  const [query, setQuery] = useState("");
  const [bulkPrice, setBulkPrice] = useState("7.5");
  const [busy, setBusy] = useState("");
  const { identity } = useOwnerSession();
  // Payout wallet = where paid calls settle WCSPR. Defaults to the connected/signed-in
  // wallet; editable to pay out elsewhere. Empty → server uses the owner session wallet.
  const [payout, setPayout] = useState("");
  const payoutArg = payout.trim() || undefined;
  const router = useRouter();

  async function deleteSourceNow() {
    if (!window.confirm(`Delete "${source.name}" and all ${tools.length} tools? This cannot be undone.`)) return;
    setBusy("delete");
    try {
      await deleteSource(source.id);
      toast.success(`Deleted ${source.name}`);
      router.push("/register");
    } catch (error) {
      // The server enforces ownership; surface its 401/403 message verbatim.
      toast.error(error instanceof Error ? error.message : "Could not delete server");
      setBusy("");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((tool) => tool.name.toLowerCase().includes(q) || (tool.description ?? "").toLowerCase().includes(q));
  }, [query, tools]);

  const counts = useMemo(() => ({
    all: tools.length,
    draft: tools.filter((tool) => tool.status !== "published").length,
    free: tools.filter((tool) => tool.status === "published" && !tool.price).length,
    paid: tools.filter((tool) => tool.status === "published" && tool.price).length,
  }), [tools]);

  async function refresh() {
    const response = await listTools(source.id);
    setTools(response.tools);
    setPrices(priceMap(response.tools));
    setModes(modeMap(response.tools));
  }

  async function rediscover() {
    setBusy("rediscover");
    try {
      const response = await fetch(`/api/provider/sources/${source.id}/rediscover`, { method: "POST" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? "Re-index failed");
      await refresh();
      toast.success(`Re-indexed: ${json.inserted} new, ${json.updated} refreshed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Re-index failed");
    } finally {
      setBusy("");
    }
  }

  async function publishPaid(tool: ManageTool) {
    await saveTool(tool, "paid");
  }

  async function publishFree(tool: ManageTool) {
    await saveTool(tool, "free");
  }

  async function saveTool(tool: ManageTool, mode: ManageMode) {
    setBusy(tool.id);
    try {
      if (mode === "paid") {
        await priceTool(tool.id, parseTokenToMotes(prices[tool.id] || "7.5"), payoutArg);
        await publishTool(tool.id);
      } else {
        await publishFreeTool(tool.id);
      }
      await refresh();
      toast.success(`${tool.name} published ${mode === "paid" ? "with WCSPR pricing" : "free"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish tool");
    } finally {
      setBusy("");
    }
  }

  async function unpublish(tool: ManageTool) {
    setBusy(tool.id);
    try {
      await unpublishTool(tool.id);
      await refresh();
      toast.success(`${tool.name} unpublished`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unpublish tool");
    } finally {
      setBusy("");
    }
  }

  async function publishSelected() {
    const picked = tools.filter((tool) => selected.has(tool.id));
    if (!picked.length) return toast.error("Select at least one tool.");
    setBusy("bulk");
    try {
      for (const tool of picked) {
        // Default to "paid" exactly like the row display (modes[id] ?? "paid"), so a
        // tool shown as Paid can never be silently published Free on an unset mode.
        if ((modes[tool.id] ?? "paid") === "paid") {
          await priceTool(tool.id, parseTokenToMotes(prices[tool.id] || bulkPrice || "7.5"), payoutArg);
          await publishTool(tool.id);
        } else {
          await publishFreeTool(tool.id);
        }
      }
      setSelected(new Set());
      await refresh();
      toast.success(`${picked.length} tool${picked.length === 1 ? "" : "s"} published`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish selected tools");
    } finally {
      setBusy("");
    }
  }

  function applyBulkPrice() {
    setPrices((current) => {
      const next = { ...current };
      for (const id of selected) next[id] = bulkPrice;
      return next;
    });
    setModes((current) => {
      const next = { ...current };
      for (const id of selected) next[id] = "paid";
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleIds = filtered.map((tool) => tool.id);
    const allVisible = visibleIds.every((id) => selected.has(id));
    setSelected((current) => {
      const next = new Set(current);
      for (const id of visibleIds) {
        if (allVisible) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <Metric label="Tools" value={counts.all} />
        <Metric label="Paid live" value={counts.paid} />
        <Metric label="Free live" value={counts.free} />
        <Metric label="Draft" value={counts.draft} />
      </section>

      <section className="rounded-lg border border-hairline bg-panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Registered endpoint</div>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className="truncate font-mono text-xs text-ink">{source.endpointUrl}</span>
              <button type="button" onClick={() => copy(source.endpointUrl)} className="shrink-0 text-ink-3 hover:text-ink" aria-label="Copy endpoint">
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/servers/${source.id}`}>Public page <ArrowUpRight className="size-3.5" /></Link>
            </Button>
            <Button onClick={rediscover} disabled={Boolean(busy)} variant="outline" size="sm" className="gap-1.5">
              {busy === "rediscover" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Re-index
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-hairline bg-panel p-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Payout wallet</div>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          Paid calls to these tools settle WCSPR to this Casper account. Defaults to your connected wallet — edit to pay out elsewhere.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={payout}
            onChange={(event) => setPayout(event.target.value)}
            placeholder={identity?.accountHash ?? "Connect your wallet in Account → Wallet"}
            className="flex-1 font-mono text-xs"
            aria-label="Payout wallet account hash"
            spellCheck={false}
          />
          {identity?.accountHash && payout.trim() && payout.trim() !== identity.accountHash ? (
            <Button variant="ghost" size="sm" className="shrink-0 text-ink-3" onClick={() => setPayout("")}>
              Use connected wallet
            </Button>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-hairline bg-panel p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={toggleAllVisible} disabled={!filtered.length || Boolean(busy)} className="gap-2">
              <Check className="size-4" />
              {filtered.every((tool) => selected.has(tool.id)) && filtered.length ? "Clear visible" : "Select visible"}
            </Button>
            <Input value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} className="w-24 text-right tnum" inputMode="decimal" aria-label="Bulk WCSPR price" />
            <Button variant="outline" onClick={applyBulkPrice} disabled={!selected.size || Boolean(busy)}>Apply price</Button>
            <Button onClick={publishSelected} disabled={!selected.size || Boolean(busy)} className="min-w-36">
              {busy === "bulk" ? <Loader2 className="size-4 animate-spin" /> : null}
              Publish selected
            </Button>
          </div>
        </div>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
          {selected.size} selected · paid tools settle in WCSPR, free tools run without x402 payment.
        </div>
      </section>

      <section className="space-y-3">
        {filtered.length ? filtered.map((tool) => (
          <ManageToolRow
            key={tool.id}
            busy={busy === tool.id || busy === "bulk"}
            mode={modes[tool.id] ?? "paid"}
            onModeChange={(mode) => setModes((current) => ({ ...current, [tool.id]: mode }))}
            onPriceChange={(value) => setPrices((current) => ({ ...current, [tool.id]: value }))}
            onPublishFree={() => publishFree(tool)}
            onPublishPaid={() => publishPaid(tool)}
            onSelect={() => setSelected((current) => toggle(current, tool.id))}
            onUnpublish={() => unpublish(tool)}
            price={prices[tool.id] ?? "7.5"}
            selected={selected.has(tool.id)}
            sourceId={source.id}
            tool={tool}
          />
        )) : (
          <div className="rounded-lg border border-dashed border-hairline bg-panel p-8 text-center text-sm text-ink-3">
            No tools match this search.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-signal/30 bg-panel p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal" />
          <div className="min-w-0 flex-1">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink">Delete endpoint</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">
              Permanently delete this server and all its tools. Only the owner can do this — sign in with the
              wallet that owns it (Account → Wallet) if the button is rejected.
            </p>
          </div>
          <Button onClick={deleteSourceNow} disabled={Boolean(busy)} variant="outline" className="gap-1.5 border-signal/40 text-signal hover:bg-signal/10">
            {busy === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
          </Button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-panel p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold text-ink tnum">{value}</div>
    </div>
  );
}

function priceMap(tools: ManageTool[]) {
  return Object.fromEntries(tools.map((tool) => [tool.id, tool.price ? formatTokenAmount(tool.price.amount) : "7.5"]));
}

function modeMap(tools: ManageTool[]): Record<string, ManageMode> {
  return Object.fromEntries(tools.map((tool) => [tool.id, tool.price ? "paid" : "free"] satisfies [string, ManageMode]));
}

function toggle(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function copy(value: string) {
  navigator.clipboard.writeText(value);
  toast.success("Endpoint copied");
}
