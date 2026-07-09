"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ManageToolRow } from "@/components/manage/manage-tool-row";
import {
  BulkToolActionsPanel,
  DeleteEndpointPanel,
  ManageMetrics,
  PayoutWalletPanel,
  RegisteredEndpointPanel,
} from "@/components/manage/source-manager-sections";
import type { ManageMode, ManagedSource, ManageTool } from "@/components/manage/manage-types";
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
      <ManageMetrics counts={counts} />
      <RegisteredEndpointPanel busy={busy} onRediscover={rediscover} source={source} />
      <PayoutWalletPanel
        connectedHash={identity?.accountHash}
        onPayoutChange={setPayout}
        onUseConnectedWallet={() => setPayout("")}
        payout={payout}
      />
      <BulkToolActionsPanel
        allVisibleSelected={filtered.every((tool) => selected.has(tool.id))}
        bulkPrice={bulkPrice}
        busy={busy}
        onApplyBulkPrice={applyBulkPrice}
        onBulkPriceChange={setBulkPrice}
        onPublishSelected={publishSelected}
        onQueryChange={setQuery}
        onToggleAllVisible={toggleAllVisible}
        query={query}
        selectedCount={selected.size}
        visibleCount={filtered.length}
      />

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

      <DeleteEndpointPanel busy={busy} onDelete={deleteSourceNow} />
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
