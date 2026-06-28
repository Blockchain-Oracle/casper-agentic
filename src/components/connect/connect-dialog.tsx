"use client";

import { useState } from "react";
import { siClaude, siCursor } from "simple-icons";
import { Check, Code2, Copy, ExternalLink, KeyRound, Loader2, Plug, Terminal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CONNECT_CLIENTS, type ConnectBuild } from "@/lib/connect-clients";
import { createApiKeyReq } from "@/lib/gateway-api";

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function SiGlyph({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function clientIcon(id: string) {
  if (id.startsWith("claude")) return <SiGlyph path={siClaude.path} />;
  if (id === "cursor") return <SiGlyph path={siCursor.path} />;
  if (id === "chatgpt") return <Code2 className="size-4" />;
  return <Terminal className="size-4" />;
}

function CodeBox({ text, copyLabel }: { text: string; copyLabel: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-hairline bg-well p-3 pr-10 font-mono text-[11px] leading-relaxed text-ink-2">{text}</pre>
      <button onClick={() => copy(text, copyLabel)} className="absolute right-2 top-2 rounded-sm border border-hairline bg-panel p-1.5 text-ink-3 hover:text-ink" aria-label="Copy">
        <Copy className="size-3" />
      </button>
    </div>
  );
}

function BuildView({ build, hasKey }: { build: ConnectBuild; hasKey: boolean }) {
  if (build.kind === "deeplink") {
    return (
      <div className="space-y-2">
        <Button asChild={hasKey} disabled={!hasKey} className="w-full gap-2">
          {hasKey ? (
            <a href={build.url}><ExternalLink className="size-4" /> {build.label}</a>
          ) : (
            <span><ExternalLink className="size-4" /> {build.label}</span>
          )}
        </Button>
        {!hasKey ? <p className="text-xs text-signal">Create a key first — the deeplink embeds it.</p> : null}
      </div>
    );
  }
  if (build.kind === "command") return <CodeBox text={build.command} copyLabel="Command" />;
  if (build.kind === "config") return <CodeBox text={build.json} copyLabel="Config" />;
  return (
    <div className="space-y-2">
      <ol className="space-y-1.5 text-sm text-ink-2">
        {build.steps.map((step, i) => (
          <li key={i}><span className="font-mono text-ink-3">{i + 1}.</span> {step}</li>
        ))}
      </ol>
      <CodeBox text={build.url} copyLabel="Server URL" />
    </div>
  );
}

export function ConnectDialog({ sourceId, serverName }: { sourceId: string; serverName: string }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [clientId, setClientId] = useState(CONNECT_CLIENTS[0].id);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mcpUrl = `${origin}/api/mcp/${sourceId}`;
  const slug = serverName.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "casper-gw";
  const key = apiKey || "<API_KEY>";
  const client = CONNECT_CLIENTS.find((c) => c.id === clientId) ?? CONNECT_CLIENTS[0];
  const build = client.build({ apiKey: key, mcpUrl, slug });

  async function createKey() {
    setCreating(true);
    try {
      const r = await createApiKeyReq({ name: `${serverName} connect` });
      setApiKey(r.token);
      toast.success("Connection key created — fund it in Account → Fund to pay");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create key");
    }
    setCreating(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setApiKey(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5"><Plug className="size-3.5" /> Connect</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Connect {serverName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">Connection URL (MCP)</span>
              <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs" onClick={() => copy(mcpUrl, "URL")}><Copy className="size-3" /> Copy</Button>
            </div>
            <code className="block overflow-x-auto rounded-md border border-hairline bg-panel px-2.5 py-1.5 font-mono text-xs text-ink">{mcpUrl}</code>
          </div>

          <div className="rounded-md border border-hairline bg-panel p-3">
            {apiKey ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">Your key — shown once</span>
                  <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs" onClick={() => copy(apiKey, "Key")}><Copy className="size-3" /> Copy</Button>
                </div>
                <code className="block break-all font-mono text-xs text-ink">{apiKey}</code>
                <p className="text-xs text-signal">Sensitive — it settles via the gateway signer. Fund it in Account → Fund.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-2">Create a key to embed in the connection.</span>
                <Button size="sm" onClick={createKey} disabled={creating} className="gap-1.5">
                  {creating ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />} Create key
                </Button>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">Add to your client</div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {CONNECT_CLIENTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClientId(c.id)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${clientId === c.id ? "border-casper bg-casper/10 text-ink" : "border-hairline text-ink-3 hover:text-ink"}`}
                >
                  {clientIcon(c.id)} {c.name}
                  {clientId === c.id ? <Check className="size-3 text-casper" /> : null}
                </button>
              ))}
            </div>
            <BuildView build={build} hasKey={Boolean(apiKey)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
