"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { DeveloperKeyRow } from "@/components/account/developer-key-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseTokenToMotes } from "@/lib/format-amount";
import { createApiKeyReq, revokeApiKeyReq, type ApiKeyView } from "@/lib/gateway-api";

type View = "list" | "create" | "created";
type DeveloperKeysTabProps = {
  keys: ApiKeyView[];
  onFundKey: (keyId: string) => void;
  onRefresh: () => Promise<void>;
  tools: string[];
};

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

export function DeveloperKeysTab({ keys, onFundKey, onRefresh, tools }: DeveloperKeysTabProps) {
  const [view, setView] = useState<View>("list");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [maxSpend, setMaxSpend] = useState("");

  async function create() {
    setBusy(true);
    try {
      const res = await createApiKeyReq({
        allowedTools: allowed.size ? [...allowed] : undefined,
        maxSpendMotes: maxSpend.trim() ? parseTokenToMotes(maxSpend) : undefined,
        name: name.trim() || undefined,
      });
      setToken(res.token);
      setView("created");
      setName("");
      setAllowed(new Set());
      setMaxSpend("");
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create key");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await revokeApiKeyReq(id).catch(() => {});
    toast.success("Key revoked");
    await onRefresh();
  }

  function toggleTool(tool: string) {
    setAllowed((prev) => {
      const next = new Set(prev);
      if (next.has(tool)) next.delete(tool);
      else next.add(tool);
      return next;
    });
  }

  if (view === "create") {
    return (
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Key name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My agent" />
        </label>
        <div>
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            Allowed tools <span className="normal-case">(none = all)</span>
          </div>
          <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-hairline bg-well p-2">
            {tools.length === 0 ? <span className="text-xs text-ink-3">No published tools found.</span> : null}
            {tools.map((tool) => {
              const selected = allowed.has(tool);
              return (
	                <button
	                  key={tool}
	                  type="button"
	                  onClick={() => toggleTool(tool)}
                  className={`rounded-sm border px-2 py-1 font-mono text-xs ${
                    selected ? "border-casper bg-casper/10 text-ink" : "border-hairline text-ink-3 hover:text-ink"
                  }`}
                >
                  {tool}
                </button>
              );
            })}
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">
            Spend cap (WCSPR, optional)
          </span>
          <Input value={maxSpend} onChange={(e) => setMaxSpend(e.target.value)} placeholder="7.5" inputMode="decimal" />
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setView("list")} className="gap-1.5">
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button onClick={create} disabled={busy} className="flex-1 gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Create key
          </Button>
        </div>
      </div>
    );
  }

  if (view === "created") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-settled/40 bg-settled/10 p-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3">Copy now: shown once</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 break-all rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">
              {token}
            </code>
            <Button size="icon" variant="outline" onClick={() => copy(token, "Key")}>
              <Copy className="size-3.5" />
            </Button>
          </div>
        </div>
        <Button onClick={() => setView("list")} className="w-full gap-2">
          <Check className="size-4" /> Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-2">
          API keys pay per call. Fund a key with WCSPR credits before using it from Cursor, Claude, Codex,
          or another MCP client.
        </p>
        <Button onClick={() => setView("create")} className="gap-2">
          <Plus className="size-4" /> New key
        </Button>
      </div>
      <div className="max-h-[46dvh] space-y-2 overflow-y-auto pr-1">
        {keys.length === 0 ? (
          <p className="rounded-md border border-dashed border-hairline bg-panel p-4 text-center text-sm text-ink-3">No keys yet.</p>
        ) : (
          keys.map((key) => (
            <DeveloperKeyRow key={key.id} apiKey={key} onFundKey={onFundKey} onRevoke={revoke} />
          ))
        )}
      </div>
    </div>
  );
}
