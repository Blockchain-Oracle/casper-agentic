"use client";

import Link from "next/link";
import { Check, EyeOff, Gift, Loader2, Radio, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAsset, formatTokenAmount } from "@/lib/format-amount";
import type { ManageMode, ManageTool } from "./manage-types";

type Props = {
  busy: boolean;
  mode: ManageMode;
  onModeChange: (mode: ManageMode) => void;
  onPriceChange: (value: string) => void;
  onPublishFree: () => void;
  onPublishPaid: () => void;
  onSelect: () => void;
  onUnpublish: () => void;
  price: string;
  selected: boolean;
  sourceId: string;
  tool: ManageTool;
};

export function ManageToolRow({
  busy,
  mode,
  onModeChange,
  onPriceChange,
  onPublishFree,
  onPublishPaid,
  onSelect,
  onUnpublish,
  price,
  selected,
  sourceId,
  tool,
}: Props) {
  const isPublished = tool.status === "published";
  const priceLabel = tool.price ? `${formatTokenAmount(tool.price.amount)} ${formatAsset(tool.price.asset)}` : "Free";
  const actionLabel = mode === "paid" ? (isPublished ? "Update paid" : "Publish paid") : "Publish free";

  return (
    <div className={`rounded-lg border p-3 ${selected ? "border-casper/60 bg-casper/5" : "border-hairline bg-panel"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <button
          type="button"
          onClick={onSelect}
          className={`grid size-8 shrink-0 place-items-center rounded-md border ${selected ? "border-casper bg-casper/10 text-casper" : "border-hairline text-ink-3"}`}
          aria-label={selected ? "Unselect tool" : "Select tool"}
        >
          {selected ? <Check className="size-4" /> : <span className="size-3 rounded-sm border border-current" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate font-mono text-sm font-medium text-ink">{tool.name}</h3>
            <StatusBadge status={tool.status} paid={Boolean(tool.price)} />
            {isPublished ? (
              <Badge variant="outline" className="rounded-sm border-hairline font-mono text-[10px] text-ink-2">
                {priceLabel}
              </Badge>
            ) : null}
          </div>
          {tool.description ? <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">{tool.description}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            <span>{tool.inputSchema && hasProperties(tool.inputSchema) ? "Inputs configured" : "No inputs"}</span>
            <span>Target {short(tool.upstreamTarget)}</span>
          </div>
        </div>

        <div className="grid w-full gap-2 md:w-[21rem]">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-hairline bg-well p-0.5 font-mono text-[11px] uppercase tracking-wider">
            <button
              type="button"
              onClick={() => onModeChange("paid")}
              className={`rounded px-2 py-1.5 ${mode === "paid" ? "bg-panel text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => onModeChange("free")}
              className={`rounded px-2 py-1.5 ${mode === "free" ? "bg-panel text-settled shadow-sm" : "text-ink-3 hover:text-ink"}`}
            >
              Free
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={mode === "free" ? "0" : price}
              onChange={(event) => onPriceChange(event.target.value)}
              disabled={mode === "free" || busy}
              className="h-9 text-right tnum"
              inputMode="decimal"
              aria-label={`WCSPR price for ${tool.name}`}
            />
            <span className="w-14 font-mono text-xs text-ink-3">WCSPR</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={mode === "paid" ? onPublishPaid : onPublishFree} disabled={busy} className="flex-1 gap-2">
              {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "paid" ? <ReceiptText className="size-4" /> : <Gift className="size-4" />}
              {busy ? "Saving..." : actionLabel}
            </Button>
            {isPublished ? (
              <Button variant="outline" onClick={onUnpublish} disabled={busy} className="gap-2 sm:w-32">
                <EyeOff className="size-4" />
                Unpublish
              </Button>
            ) : (
              <Button asChild variant="outline" className="gap-2 sm:w-32">
                <Link href={`/servers/${sourceId}`}>
                  <Radio className="size-4" />
                  Public
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ paid, status }: { paid: boolean; status: string }) {
  const className =
    status === "published"
      ? paid
        ? "border-casper/40 bg-casper/10 text-casper"
        : "border-settled/40 bg-settled/10 text-settled"
      : "border-hairline bg-well text-ink-3";
  return (
    <Badge variant="outline" className={`rounded-sm font-mono text-[10px] uppercase tracking-wider ${className}`}>
      {status === "published" ? (paid ? "Paid live" : "Free live") : status}
    </Badge>
  );
}

function hasProperties(value: unknown) {
  return typeof value === "object" && value !== null && "properties" in value;
}

function short(value: string) {
  return value.length > 28 ? `${value.slice(0, 14)}...${value.slice(-10)}` : value;
}
