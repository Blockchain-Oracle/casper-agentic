"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/primitives/copy-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatTokenAmount } from "@/lib/format-amount";
import { claimDepositReq, type ApiKeyView } from "@/lib/gateway-api";

type GatewayBalance = { payee: string; ready: boolean; wcspr: string; csprGas: string };

function keyLabel(key?: ApiKeyView) {
  if (!key) return "Select key";
  return key.name || `${key.prefix}...`;
}

export function FundTab({
  balance,
  initialKeyId,
  keys,
  onRefresh,
}: {
  balance: GatewayBalance | null;
  initialKeyId?: string | null;
  keys: ApiKeyView[];
  onRefresh: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState(initialKeyId ?? "");
  const [deployHash, setDeployHash] = useState("");
  const [claiming, setClaiming] = useState(false);
  const activeKeys = useMemo(() => keys.filter((key) => !key.revoked), [keys]);
  const selectedKey = activeKeys.find((key) => key.id === selectedId) ?? activeKeys[0];

  async function claim() {
    const keyId = selectedKey?.id;
    if (!keyId) return toast.error("Create a key before claiming funds");
    if (!deployHash.trim()) return toast.error("Paste the deposit deploy hash");
    setClaiming(true);
    try {
      const result = await claimDepositReq({ deployHash: deployHash.trim(), keyId });
      if (result.status === "credited") toast.success(`Credited ${formatTokenAmount(result.amount ?? "0")} WCSPR`);
      else if (result.status === "already_claimed") toast.info("Deposit already claimed");
      else toast.error(result.reason ?? result.status);
      setDeployHash("");
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-hairline bg-well p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Gateway WCSPR deposit address</div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">
            {balance?.payee ?? "..."}
          </code>
          {balance?.payee ? <CopyButton value={balance.payee} label="Deposit address copied" /> : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          Send WCSPR to this gateway address, then claim the transfer by deploy hash into one API key.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-hairline bg-panel p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Gateway WCSPR</div>
          <div className="mt-1 font-mono text-sm text-ink tnum">{balance ? formatTokenAmount(balance.wcspr) : "..."}</div>
        </div>
        <div className="rounded-md border border-hairline bg-panel p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">CSPR gas</div>
          <div className="mt-1 font-mono text-sm text-ink tnum">{balance ? formatTokenAmount(balance.csprGas) : "..."}</div>
        </div>
      </div>

      <div className="rounded-md border border-hairline bg-panel p-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">Claim deposit into key</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between sm:w-52">
                <span className="truncate">{keyLabel(selectedKey)}</span>
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {activeKeys.length === 0 ? (
                <DropdownMenuItem disabled>No active keys</DropdownMenuItem>
              ) : (
                activeKeys.map((key) => (
                  <DropdownMenuItem key={key.id} onClick={() => setSelectedId(key.id)}>
                    <span className="truncate">{keyLabel(key)}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            value={deployHash}
            onChange={(e) => setDeployHash(e.target.value)}
            placeholder="deposit deploy hash"
            className="font-mono text-xs"
          />
          <Button onClick={claim} disabled={claiming || !selectedKey} className="gap-2">
            {claiming ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />} Claim
          </Button>
        </div>
      </div>
    </div>
  );
}
