"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatTokenAmount } from "@/lib/format-amount";
import type { ApiKeyView } from "@/lib/gateway-api";

function isPositive(value?: string) {
  try {
    return BigInt(value ?? "0") > BigInt(0);
  } catch {
    return false;
  }
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function DeveloperKeyRow({
  apiKey,
  deleting,
  onDeleteKey,
  onFundKey,
}: {
  apiKey: ApiKeyView;
  deleting?: boolean;
  onDeleteKey: (key: ApiKeyView) => void;
  onFundKey: (keyId: string) => void;
}) {
  return (
    <div className="rounded-md border border-hairline bg-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`truncate text-sm font-medium ${apiKey.revoked ? "text-ink-3 line-through" : "text-ink"}`}>
            {apiKey.name}
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-3">
            {apiKey.prefix}... · created {fmtDate(apiKey.createdAt)}
          </div>
        </div>
        {apiKey.revoked ? (
          <span className="font-mono text-[10px] uppercase text-ink-3">revoked</span>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="xs" variant="outline" onClick={() => onFundKey(apiKey.id)}>
              Fund
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onDeleteKey(apiKey)}
              disabled={deleting}
              className="gap-1 text-signal hover:text-signal"
            >
              {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete
            </Button>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-ink-3">
        <span className="rounded-sm border border-hairline px-1.5 py-0.5">
          {apiKey.scope.allowedTools?.length ? apiKey.scope.allowedTools.join(", ") : "all tools"}
        </span>
        <span className={`rounded-sm border px-1.5 py-0.5 ${isPositive(apiKey.available) ? "border-settled/40 text-settled" : "border-signal/40 text-signal"}`}>
          {formatTokenAmount(apiKey.available ?? "0")} WCSPR available
        </span>
        <span className="rounded-sm border border-hairline px-1.5 py-0.5">
          {formatTokenAmount(apiKey.credited ?? "0")} credited
        </span>
        <span className="rounded-sm border border-hairline px-1.5 py-0.5">
          {formatTokenAmount(apiKey.spent ?? "0")} spent
        </span>
      </div>
    </div>
  );
}
