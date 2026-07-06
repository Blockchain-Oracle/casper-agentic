"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { DeveloperKeyRow } from "@/components/account/developer-key-row";
import { OwnerSessionPanel } from "@/components/account/owner-session-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseTokenToMotes } from "@/lib/format-amount";
import { createApiKeyReq, revokeApiKeyReq, type ApiKeyView } from "@/lib/gateway-api";
import { forgetApiKeyToken, readApiKeyToken, rememberApiKeyToken } from "@/lib/browser-api-key-tokens";
import { useOwnerSession } from "@/lib/owner-session";

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
  const [deletingKeyId, setDeletingKeyId] = useState("");
  const [confirmKey, setConfirmKey] = useState<ApiKeyView | null>(null);
  const session = useOwnerSession();
  // Keys are listed per owner: creating one while signed out would make it vanish
  // from the list, so gate creation behind the wallet sign-in.
  const needsSignIn = session.enabled && !session.identity;

  async function create() {
    setBusy(true);
    try {
      const res = await createApiKeyReq({
        allowedTools: allowed.size ? [...allowed] : undefined,
        maxSpendMotes: maxSpend.trim() ? parseTokenToMotes(maxSpend) : undefined,
        name: name.trim() || undefined,
      });
      rememberApiKeyToken(res.key.id, res.token);
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

  async function deleteKey(key: ApiKeyView) {
    setConfirmKey(null);
    setDeletingKeyId(key.id);
    try {
      await revokeApiKeyReq(key.id, readApiKeyToken(key.id));
      forgetApiKeyToken(key.id);
      toast.success("Key deleted");
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete key");
    } finally {
      setDeletingKeyId("");
    }
  }

  function toggleTool(tool: string) {
    setAllowed((prev) => {
      const next = new Set(prev);
      if (next.has(tool)) next.delete(tool);
      else next.add(tool);
      return next;
    });
  }

  if (!session.loading && needsSignIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-2">
          API keys pay per call and belong to your wallet. Sign in once to create, fund, and
          manage yours — no payment, no gas.
        </p>
        <OwnerSessionPanel
          onSessionChange={() => {
            void session.reload();
            void onRefresh();
          }}
        />
      </div>
    );
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
        {keys.filter((key) => !key.revoked).length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-hairline bg-panel px-4 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-md bg-well text-ink-3">
              <KeyRound className="size-5" />
            </span>
            <p className="max-w-xs text-sm text-ink-3">
              No keys yet. Create a casper_ key, fund it, and agents can pay per call with it.
            </p>
            <Button size="sm" onClick={() => setView("create")} className="gap-1.5">
              <Plus className="size-3.5" /> Create your first key
            </Button>
          </div>
        ) : (
          keys.filter((key) => !key.revoked).map((key) => (
            <DeveloperKeyRow
              key={key.id}
              apiKey={key}
              deleting={deletingKeyId === key.id}
              onDeleteKey={setConfirmKey}
              onFundKey={onFundKey}
            />
          ))
        )}
      </div>

      <AlertDialog open={confirmKey !== null} onOpenChange={(open) => { if (!open) setConfirmKey(null); }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete {confirmKey?.name ?? "this key"}?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-3">
              This revokes the key for future paid calls. Agents using it will start getting payment
              errors immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep key</AlertDialogCancel>
            <AlertDialogAction
              className="bg-casper text-white hover:bg-casper/90"
              onClick={() => { if (confirmKey) void deleteKey(confirmKey); }}
            >
              Delete key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
