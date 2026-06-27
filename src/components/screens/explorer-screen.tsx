"use client";

import { useState } from "react";

import { ReceiptProofTimeline, RECEIPT_PROOF_NOTE } from "@/components/receipt/receipt-detail-view";
import { Chip, StatusChip } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { ExplorerReceiptTable } from "./explorer-receipt-table";
import { statusMeta } from "@/lib/fixtures";
import { formatAsset, formatTokenAmount } from "@/lib/format-amount";
import { formatAge } from "@/lib/format-time";
import type { ExplorerSearchSource, Receipt, ReceiptDetail, ReceiptStatus } from "@/lib/types";

export type ExplorerFeedTab = "local" | "external";

export type ExplorerFilter = "all" | ReceiptStatus;

export interface ExplorerHistoryControls {
  canNext: boolean;
  canPrevious: boolean;
  from: string;
  loading: boolean;
  onFrom: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onQuery: (value: string) => void;
  onTo: (value: string) => void;
  pageLabel: string;
  query: string;
  to: string;
}

export function ExplorerScreen({
  explorerFilter,
  feedTab,
  filteredReceipts,
  historyControls,
  isSample,
  onFilter,
  onReceipt,
  onSearch,
  onSearchQuery,
  onShowExternal,
  onShowLocal,
  receiptDetail,
  searchMessage,
  searchQuery,
  searchSource,
  searching,
  selectedReceipt,
  selectedReceiptId,
  sourceNote,
}: {
  explorerFilter: ExplorerFilter;
  feedTab: ExplorerFeedTab;
  filteredReceipts: Receipt[];
  historyControls: ExplorerHistoryControls;
  isSample: boolean;
  onFilter: (filter: ExplorerFilter) => void;
  onReceipt: (receiptId: string) => void;
  onSearch: () => void;
  onSearchQuery: (query: string) => void;
  onShowExternal: () => void;
  onShowLocal: () => void;
  receiptDetail: ReceiptDetail;
  searchMessage?: string;
  searchQuery: string;
  searchSource?: ExplorerSearchSource;
  searching: boolean;
  selectedReceipt: Receipt;
  selectedReceiptId: string;
  sourceNote?: string;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const filters: ExplorerFilter[] = ["all", ...(Object.keys(statusMeta) as ReceiptStatus[])];
  const sourceChip = searchSource ? sourceLabel(searchSource) : null;
  const settled = filteredReceipts.filter((receipt) => receipt.status === "settled").length;
  const providers = new Set(filteredReceipts.map((receipt) => receipt.provider)).size;
  const latestProof = filteredReceipts.find((receipt) => receipt.hash)?.time;
  const stats: Array<[string, string, string?]> = [
    ["Receipts", String(filteredReceipts.length)],
    ["Settled", String(settled), "var(--settled)"],
    ["Unsettled", String(filteredReceipts.length - settled), "var(--policy)"],
    ["Providers", String(providers)],
    ["Latest proof", latestProof ? formatAge(latestProof) : "—"],
  ];

  function openReceiptDetail(receiptId: string) {
    onReceipt(receiptId);
    setDetailOpen(true);
  }

  return (
    <div className="stack">
      <form className="explorerSearchBar" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
        <div className="explorerSearchField">
          <span aria-hidden style={{ color: "var(--ink-3)", fontSize: 16 }}>⌕</span>
          <input
            aria-label="Search receipt id, deploy hash, account hash, public key, or CSPR.name"
            onChange={(event) => onSearchQuery(event.target.value)}
            placeholder="Receipt id, deploy hash, account hash, public key, or CSPR.name…"
            value={searchQuery}
          />
        </div>
        <button className="explorerSearchBtn" disabled={searching} type="submit">
          {searching ? "Searching…" : "Search explorer"}
        </button>
      </form>
      {searchMessage ? <div className={`notice ${searchSource === "not_found" ? "danger" : ""}`}>{searchMessage}</div> : null}
      {sourceChip ? <div className="buttonRow"><Chip tone={sourceChip.tone}>{sourceChip.label}</Chip></div> : null}

      <div className="chipRow">
        {filters.map((filter) => (
          <button className="filterPill" data-active={explorerFilter === filter} key={filter} onClick={() => onFilter(filter)} type="button">
            {filter === "all" ? "All" : statusMeta[filter].label}
          </button>
        ))}
      </div>

      <div className="explorerStats">
        {stats.map(([label, value, color]) => (
          <div className="explorerStat" key={label}>
            <div className="statLabel">{label.toUpperCase()}</div>
            <div className="statNum" style={color ? { color } : undefined}>{value}</div>
          </div>
        ))}
      </div>

      <div className="explorerFeedBar">
        <div className="explorerSeg" aria-label="Receipt feed" role="tablist">
          <button aria-selected={feedTab === "local"} className="explorerSegBtn" data-active={feedTab === "local"} onClick={onShowLocal} role="tab" type="button">
            Casper GW receipts
          </button>
          <button aria-selected={feedTab === "external"} className="explorerSegBtn" data-active={feedTab === "external"} onClick={onShowExternal} role="tab" type="button">
            WCSPR token actions
          </button>
        </div>
        {isSample ? <span className="fixtureTag">SAMPLE · FIXTURE</span> : null}
      </div>

      {feedTab === "local" ? (
        <details className="stack tight">
          <summary style={{ cursor: "pointer", font: "600 12px/1 var(--sans)", color: "var(--ink-2)" }}>Filter history</summary>
          <label>
            <div className="fieldLabel">Filter receipt history</div>
            <input className="input" onChange={(event) => historyControls.onQuery(event.target.value)} placeholder="provider, tool, wallet, status, network" value={historyControls.query} />
          </label>
          <div className="formGrid">
            <label><div className="fieldLabel">From</div><input className="input" onChange={(event) => historyControls.onFrom(event.target.value)} type="date" value={historyControls.from} /></label>
            <label><div className="fieldLabel">To</div><input className="input" onChange={(event) => historyControls.onTo(event.target.value)} type="date" value={historyControls.to} /></label>
          </div>
        </details>
      ) : null}

      <ExplorerReceiptTable onReceipt={openReceiptDetail} receipts={filteredReceipts} selectedReceiptId={selectedReceiptId} />
      {sourceNote ? <div className="explorerSourceNote">{sourceNote}</div> : null}

      <div className="buttonRow" style={{ alignItems: "center" }}>
        <button className="secondaryButton" disabled={!historyControls.canPrevious || historyControls.loading} onClick={historyControls.onPrevious} type="button">Previous</button>
        <Chip tone="neutral">{historyControls.loading ? "Loading receipts" : historyControls.pageLabel}</Chip>
        <button className="secondaryButton" disabled={!historyControls.canNext || historyControls.loading} onClick={historyControls.onNext} type="button">Next</button>
      </div>

      <Modal
        maxWidth={760}
        onClose={() => setDetailOpen(false)}
        open={detailOpen}
        subtitle={`${selectedReceipt.tool} · ${selectedReceipt.provider} · ${formatTokenAmount(selectedReceipt.amount)} ${formatAsset(selectedReceipt.asset)}`}
        title={(
          <span className="receiptMeta" style={{ alignItems: "center" }}>
            <span className="mono">{selectedReceipt.id}</span>
            <StatusChip status={selectedReceipt.status} />
            {selectedReceipt.hash ? (
              <a className="mono" href={`https://testnet.cspr.live/deploy/${selectedReceipt.hash}`} rel="noopener noreferrer" style={{ color: "var(--brand)", fontSize: 12 }} target="_blank">
                cspr.live ↗
              </a>
            ) : null}
          </span>
        )}
      >
        <div className="stack">
          <ReceiptProofTimeline detail={receiptDetail} />
          <div className="notice">{RECEIPT_PROOF_NOTE}</div>
        </div>
      </Modal>
    </div>
  );
}

function sourceLabel(source: ExplorerSearchSource) {
  if (source === "casper_gw_account") return { label: "Casper GW account receipts", tone: "signal" };
  if (source === "casper_gw_receipt") return { label: "Casper GW receipt", tone: "signal" };
  if (source === "external_account_proof") return { label: "External account proof", tone: "primary" };
  if (source === "external_casper_proof") return { label: "External Casper proof", tone: "primary" };
  if (source === "upstream_error") return { label: "Lookup unavailable", tone: "warn" };
  if (source === "unconfigured") return { label: "Lookup not configured", tone: "warn" };
  return { label: "Not found", tone: "danger" };
}
