"use client";

import { useEffect, useMemo, useState } from "react";
import { siClaude, siCursor } from "simple-icons";
import { Check, Code2, Copy, ExternalLink, KeyRound, Loader2, Plug, Terminal } from "lucide-react";
import { toast } from "sonner";

import { ConnectKeyDropdown } from "@/components/connect/connect-key-dropdown";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CONNECT_CLIENTS, type ConnectBuild } from "@/lib/connect-clients";
import { createApiKeyReq, listApiKeys, type ApiKeyView } from "@/lib/gateway-api";
import { readApiKeyToken, rememberApiKeyToken } from "@/lib/browser-api-key-tokens";

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
      <pre className="max-h-72 overflow-auto rounded-md border border-hairline bg-well p-3 pr-10 font-mono text-[10px] leading-relaxed text-ink-2 sm:text-[11px]">{text}</pre>
      <button
        onClick={() => copy(text, copyLabel)}
        className="absolute right-2 top-2 rounded-sm border border-hairline bg-panel p-1.5 text-ink-3 hover:text-ink"
        aria-label="Copy"
      >
        <Copy className="size-3" />
      </button>
    </div>
  );
}

function BuildView({ build, clientName, hasKey }: { build: ConnectBuild; clientName: string; hasKey: boolean }) {
  const title = build.kind === "deeplink" ? "One-click install" : build.kind === "steps" ? "Setup steps" : "Configuration";

  const body = (() => {
  if (!hasKey) {
    return (
      <div className="rounded-md border border-dashed border-hairline bg-well p-3 text-sm leading-relaxed text-ink-3">
        Select a key with a locally saved token to generate this setup.
      </div>
    );
  }
  if (build.kind === "deeplink") {
    return (
      <div className="space-y-2">
        <Button asChild className="w-full gap-2">
          <a href={build.url}><ExternalLink className="size-4" /> {build.label}</a>
        </Button>
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
  })();

  return (
    <div className="rounded-md border border-hairline bg-panel p-3 sm:p-4">
      <div className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{title}</div>
        <div className="mt-1 text-sm font-medium text-ink">{clientName}</div>
      </div>
      {body}
    </div>
  );
}

export function ConnectDialog({ sourceId, serverName }: { sourceId: string; serverName: string }) {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [clientId, setClientId] = useState(CONNECT_CLIENTS[0].id);
  const [tokenVersion, setTokenVersion] = useState(0);
  const activeKeys = useMemo(() => keys.filter((key) => !key.revoked), [keys]);
  const selectedKey = activeKeys.find((key) => key.id === selectedKeyId) ?? activeKeys[0];
  const selectedToken = useMemo(() => {
    void tokenVersion;
    return readApiKeyToken(selectedKey?.id);
  }, [selectedKey?.id, tokenVersion]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mcpUrl = `${origin}/api/mcp/${sourceId}`;
  const slug = serverName.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "casper-gw";
  const key = selectedToken || "<API_KEY>";
  const client = CONNECT_CLIENTS.find((c) => c.id === clientId) ?? CONNECT_CLIENTS[0];
  const build = client.build({ apiKey: key, mcpUrl, slug });

  useEffect(() => {
    if (!open) return;
    void listApiKeys()
      .then((response) => {
        setKeys(response.keys);
        const first = response.keys.find((item) => !item.revoked);
        setSelectedKeyId((current) => current || first?.id || "");
      })
      .catch(() => setKeys([]))
      .finally(() => setKeysLoading(false));
  }, [open]);

  async function createKey() {
    setCreating(true);
    try {
      const r = await createApiKeyReq({ name: `${serverName} connect` });
      rememberApiKeyToken(r.key.id, r.token);
      setTokenVersion((version) => version + 1);
      setSelectedKeyId(r.key.id);
      setKeys((current) => [r.key, ...current]);
      toast.success("Connection key created — fund it in Account → Fund to pay");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create key");
    }
    setCreating(false);
  }

  function setDialogOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setKeysLoading(true);
    if (!nextOpen) {
      setKeysLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-1.5 sm:w-auto"><Plug className="size-3.5" /> Connect</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-4xl overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-hairline px-4 py-4 sm:px-5">
          <DialogTitle className="font-display">Connect {serverName}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(92dvh-73px)] space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
            <div className="rounded-md border border-hairline bg-panel p-3 sm:p-4">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">Connection URL (MCP)</span>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => copy(mcpUrl, "URL")}><Copy className="size-3" /> Copy</Button>
              </div>
              <code className="block overflow-x-auto rounded-md border border-hairline bg-well px-2.5 py-2 font-mono text-xs text-ink">{mcpUrl}</code>
            </div>

            <div className="rounded-md border border-hairline bg-panel p-3 sm:p-4">
              {keysLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : activeKeys.length ? (
                <div className="space-y-1.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <ConnectKeyDropdown
                      keys={activeKeys}
                      selectedKey={selectedKey}
                      onCreate={createKey}
                      onSelect={setSelectedKeyId}
                      creating={creating}
                    />
                    {selectedToken ? (
                      <Button size="sm" variant="ghost" className="h-9 gap-1 text-xs" onClick={() => copy(selectedToken, "Key")}>
                        <Copy className="size-3" /> Copy key
                      </Button>
                    ) : null}
                  </div>
                  <p className={`text-xs leading-relaxed ${selectedToken ? "text-ink-3" : "text-signal"}`}>
                    {selectedToken
                      ? "Selected key is ready for this browser. Fund it in Account -> Fund before paid calls."
                      : "This selected key was created before this browser saved its token. Create a new key once, then reuse it from this selector."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-ink-2">No key yet. Create one to use for this client connection.</span>
                  <Button size="sm" onClick={createKey} disabled={creating} className="w-full gap-1.5 sm:w-auto">
                    {creating ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />} Create key
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">Add to your client</div>
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                {CONNECT_CLIENTS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setClientId(c.id)}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition ${
                      clientId === c.id ? "border-casper bg-casper/10 text-ink" : "border-hairline bg-panel text-ink-3 hover:text-ink"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0">{clientIcon(c.id)}</span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    {clientId === c.id ? <Check className="size-3 shrink-0 text-casper" /> : null}
                  </button>
                ))}
              </div>
              <BuildView build={build} clientName={client.name} hasKey={Boolean(selectedToken)} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
