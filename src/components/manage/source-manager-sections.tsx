"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Check, Copy, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { ManagedSource } from "@/components/manage/manage-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Counts = {
  all: number;
  draft: number;
  free: number;
  paid: number;
};

export function ManageMetrics({ counts }: { counts: Counts }) {
  return (
    <section className="grid gap-3 sm:grid-cols-4">
      <Metric label="Tools" value={counts.all} />
      <Metric label="Paid live" value={counts.paid} />
      <Metric label="Free live" value={counts.free} />
      <Metric label="Draft" value={counts.draft} />
    </section>
  );
}

export function RegisteredEndpointPanel({
  busy,
  onRediscover,
  source,
}: {
  busy: string;
  onRediscover: () => void;
  source: ManagedSource;
}) {
  return (
    <section className="rounded-lg border border-hairline bg-panel p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Registered endpoint</div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span className="truncate font-mono text-xs text-ink">{source.endpointUrl}</span>
            <button
              type="button"
              onClick={() => copy(source.endpointUrl)}
              className="shrink-0 text-ink-3 hover:text-ink"
              aria-label="Copy endpoint"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/servers/${source.id}`}>Public page <ArrowUpRight className="size-3.5" /></Link>
          </Button>
          <Button onClick={onRediscover} disabled={Boolean(busy)} variant="outline" size="sm" className="gap-1.5">
            {busy === "rediscover" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Re-index
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PayoutWalletPanel({
  connectedHash,
  onPayoutChange,
  onUseConnectedWallet,
  payout,
}: {
  connectedHash?: string;
  onPayoutChange: (value: string) => void;
  onUseConnectedWallet: () => void;
  payout: string;
}) {
  return (
    <section className="rounded-lg border border-hairline bg-panel p-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Payout wallet</div>
      <p className="mt-1 text-sm leading-relaxed text-ink-2">
        Paid calls to these tools settle WCSPR to this Casper account. Defaults to your connected wallet — edit to pay out elsewhere.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={payout}
          onChange={(event) => onPayoutChange(event.target.value)}
          placeholder={connectedHash ?? "Connect your wallet in Account → Wallet"}
          className="flex-1 font-mono text-xs"
          aria-label="Payout wallet account hash"
          spellCheck={false}
        />
        {connectedHash && payout.trim() && payout.trim() !== connectedHash ? (
          <Button variant="ghost" size="sm" className="shrink-0 text-ink-3" onClick={onUseConnectedWallet}>
            Use connected wallet
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function BulkToolActionsPanel({
  allVisibleSelected,
  bulkPrice,
  busy,
  onApplyBulkPrice,
  onBulkPriceChange,
  onPublishSelected,
  onQueryChange,
  onToggleAllVisible,
  query,
  selectedCount,
  visibleCount,
}: {
  allVisibleSelected: boolean;
  bulkPrice: string;
  busy: string;
  onApplyBulkPrice: () => void;
  onBulkPriceChange: (value: string) => void;
  onPublishSelected: () => void;
  onQueryChange: (value: string) => void;
  onToggleAllVisible: () => void;
  query: string;
  selectedCount: number;
  visibleCount: number;
}) {
  return (
    <section className="rounded-lg border border-hairline bg-panel p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search tools" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onToggleAllVisible} disabled={!visibleCount || Boolean(busy)} className="gap-2">
            <Check className="size-4" />
            {allVisibleSelected && visibleCount ? "Clear visible" : "Select visible"}
          </Button>
          <Input
            value={bulkPrice}
            onChange={(event) => onBulkPriceChange(event.target.value)}
            className="w-24 text-right tnum"
            inputMode="decimal"
            aria-label="Bulk WCSPR price"
          />
          <Button variant="outline" onClick={onApplyBulkPrice} disabled={!selectedCount || Boolean(busy)}>Apply price</Button>
          <Button onClick={onPublishSelected} disabled={!selectedCount || Boolean(busy)} className="min-w-36">
            {busy === "bulk" ? <Loader2 className="size-4 animate-spin" /> : null}
            Publish selected
          </Button>
        </div>
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">
        {selectedCount} selected · paid tools settle in WCSPR, free tools run without x402 payment.
      </div>
    </section>
  );
}

export function DeleteEndpointPanel({
  busy,
  onDelete,
}: {
  busy: string;
  onDelete: () => void;
}) {
  return (
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
        <Button onClick={onDelete} disabled={Boolean(busy)} variant="outline" className="gap-1.5 border-signal/40 text-signal hover:bg-signal/10">
          {busy === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
        </Button>
      </div>
    </section>
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

function copy(value: string) {
  navigator.clipboard.writeText(value);
  toast.success("Endpoint copied");
}
