"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatTokenAmount, parseTokenToMotes } from "@/lib/format-amount";
import { claimDepositReq, createApiKeyReq, getGatewayBalance, listApiKeys, listTools, revokeApiKeyReq, type ApiKeyView } from "@/lib/gateway-api";

type View = "list" | "create" | "created";

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

export function ApiKeysDialog() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string>("");

  // create form
  const [name, setName] = useState("");
  const [allowed, setAllowed] = useState<Set<string>>(new Set());
  const [maxSpend, setMaxSpend] = useState("");
  const [lang, setLang] = useState<"curl" | "ts" | "python">("curl");

  // fund affordance
  const [depositAddr, setDepositAddr] = useState("");
  const [fundId, setFundId] = useState<string | null>(null);
  const [claimHash, setClaimHash] = useState("");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!open) return;
    listApiKeys().then((r) => setKeys(r.keys)).catch(() => setKeys([]));
    listTools().then((r) => setTools([...new Set(r.tools.filter((t) => t.status === "published").map((t) => t.name))])).catch(() => setTools([]));
    getGatewayBalance().then((b) => setDepositAddr(b.payee)).catch(() => setDepositAddr(""));
  }, [open]);

  async function claim(keyId: string) {
    if (!claimHash.trim()) return toast.error("Paste the deposit deploy hash");
    setClaiming(true);
    try {
      const r = await claimDepositReq({ deployHash: claimHash.trim(), keyId });
      if (r.status === "credited") toast.success(`Credited ${formatTokenAmount(r.amount ?? "0")} WCSPR`);
      else if (r.status === "already_claimed") toast.info("Already claimed");
      else toast.error(r.reason ?? r.status);
      setClaimHash("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    }
    setClaiming(false);
  }

  async function refresh() {
    const r = await listApiKeys().catch(() => ({ keys: [] }));
    setKeys(r.keys);
  }

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
      setName(""); setAllowed(new Set()); setMaxSpend("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create key");
    }
    setBusy(false);
  }

  async function revoke(id: string) {
    await revokeApiKeyReq(id).catch(() => {});
    toast.success("Key revoked");
    refresh();
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const body = `{"endpointUrl":"https://mcp.cspr.trade/mcp","toolName":"get_quote","args":{"amount":"10","token_in":"CSPR","token_out":"WCSPR","type":"exact_in"}}`;
  const snippets: Record<typeof lang, string> = {
    curl: `curl -X POST ${origin}/api/paid-calls/run \\
  -H "x-api-key: ${token}" \\
  -H "content-type: application/json" \\
  -d '${body}'`,
    python: `import requests
r = requests.post("${origin}/api/paid-calls/run",
  headers={"x-api-key": "${token}"},
  json=${body})
print(r.json())  # -> { "status": "settled", "explorerUrl": "...cspr.live/deploy/..." }`,
    ts: `const r = await fetch("${origin}/api/paid-calls/run", {
  method: "POST",
  headers: { "x-api-key": "${token}", "content-type": "application/json" },
  body: JSON.stringify(${body}),
});
console.log(await r.json()); // { status: "settled", explorerUrl: "...cspr.live/deploy/..." }`,
  };
  const snippet = snippets[lang];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setView("list"); setToken(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 font-medium">
          <KeyRound className="size-3.5" /> <span className="max-sm:hidden">API keys</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {view === "create" ? "New agent key" : view === "created" ? "Key created" : "Agent API keys"}
          </DialogTitle>
        </DialogHeader>

        {view === "list" ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-2">
              A <span className="font-mono text-ink">casper_</span> key is an agent&apos;s credential — scope it to specific tools and a spend cap, then pay per call from anywhere.
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {keys.length === 0 ? (
                <p className="rounded-md border border-dashed border-hairline bg-panel p-4 text-center text-sm text-ink-3">No keys yet.</p>
              ) : keys.map((k) => (
                <div key={k.id} className="rounded-md border border-hairline bg-panel px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${k.revoked ? "text-ink-3 line-through" : "text-ink"}`}>{k.name}</span>
                    {!k.revoked ? (
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => setFundId(fundId === k.id ? null : k.id)} className="font-mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-ink">Fund</button>
                        <button onClick={() => revoke(k.id)} className="text-ink-3 hover:text-signal" aria-label="Revoke"><Trash2 className="size-3.5" /></button>
                      </div>
                    ) : <span className="font-mono text-[10px] uppercase text-ink-3">revoked</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[10px] text-ink-3">
                    <span className="rounded-sm border border-hairline px-1.5 py-0.5">{k.scope.allowedTools?.length ? k.scope.allowedTools.join(", ") : "all tools"}</span>
                    {BigInt(k.credited ?? "0") > BigInt(0) ? (
                      <span className="rounded-sm border border-settled/40 px-1.5 py-0.5 text-settled">{formatTokenAmount(k.available ?? "0")} WCSPR available</span>
                    ) : k.scope.maxSpendMotes ? (
                      <span className="rounded-sm border border-hairline px-1.5 py-0.5">{formatTokenAmount(k.scope.maxSpendMotes)} WCSPR cap</span>
                    ) : null}
                  </div>
                  {fundId === k.id ? (
                    <div className="mt-2.5 space-y-2 rounded-md border border-hairline bg-well p-2.5">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Send WCSPR to the gateway, then claim by deploy hash</div>
                      <div className="flex items-center gap-1.5">
                        <code className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-panel px-2 py-1 font-mono text-[11px] text-ink">{depositAddr || "…"}</code>
                        <Button size="icon" variant="outline" onClick={() => copy(depositAddr, "Deposit address")}><Copy className="size-3" /></Button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input value={claimHash} onChange={(e) => setClaimHash(e.target.value)} placeholder="deposit deploy hash" className="font-mono text-xs" />
                        <Button size="sm" onClick={() => claim(k.id)} disabled={claiming}>{claiming ? <Loader2 className="size-3.5 animate-spin" /> : "Claim"}</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <Button onClick={() => setView("create")} className="w-full gap-2"><Plus className="size-4" /> New key</Button>
          </div>
        ) : view === "create" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My agent" />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Allowed tools <span className="normal-case text-ink-3">(none = all)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {tools.length === 0 ? <span className="text-xs text-ink-3">No published tools.</span> : tools.map((t) => {
                  const on = allowed.has(t);
                  return (
                    <button key={t} onClick={() => setAllowed((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; })}
                      className={`rounded-sm border px-2 py-1 font-mono text-xs ${on ? "border-casper bg-casper/10 text-ink" : "border-hairline text-ink-3 hover:text-ink"}`}>{t}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Spend cap (WCSPR) <span className="normal-case text-ink-3">(optional)</span></label>
              <Input value={maxSpend} onChange={(e) => setMaxSpend(e.target.value)} placeholder="e.g. 75" inputMode="decimal" className="tnum" />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setView("list")} className="gap-1.5"><ArrowLeft className="size-4" /> Back</Button>
              <Button onClick={create} disabled={busy} className="flex-1 gap-2">{busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Create key</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-settled/40 bg-settled/10 p-3">
              <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">Your key — copy it now, shown once</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">{token}</code>
                <Button size="icon" variant="outline" onClick={() => copy(token, "Key")}><Copy className="size-3.5" /></Button>
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">Use it anywhere</span>
                <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs" onClick={() => copy(snippet, "Snippet")}><Copy className="size-3" /> Copy</Button>
              </div>
              <div className="mb-1.5 inline-flex rounded-md border border-hairline bg-well p-0.5">
                {([["curl", "cURL"], ["ts", "TypeScript"], ["python", "Python"]] as const).map(([value, label]) => (
                  <button key={value} onClick={() => setLang(value)}
                    className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${lang === value ? "bg-panel text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <pre className="overflow-x-auto rounded-md border border-hairline bg-well p-3 font-mono text-[11px] leading-relaxed text-ink-2">{snippet}</pre>
            </div>
            <Button onClick={() => setView("list")} className="w-full gap-2"><Check className="size-4" /> Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
