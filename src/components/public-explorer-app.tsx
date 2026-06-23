"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useReceiptDeepLink } from "@/components/explorer/use-receipt-deep-link";
import { useReceiptHistory } from "@/components/explorer/use-receipt-history";
import { ExplorerScreen, type ExplorerFilter } from "@/components/screens/explorer-screen";
import { Chip } from "@/components/ui";
import { receipts } from "@/lib/fixtures";
import { buildReceiptDetail, receiptById } from "@/lib/receipt-detail";
import type { ExplorerSearchResult } from "@/lib/types";

const RECEIPT_HISTORY_PAGE_SIZE = 4;

export function PublicExplorerApp() {
  const searchParams = useSearchParams();
  const receiptParam = searchParams.get("receipt");
  const deepLink = useReceiptDeepLink(receiptParam);
  const [selectedReceiptOverride, setSelectedReceiptOverride] = useState<string | null>(null);
  const [explorerFilter, setExplorerFilter] = useState<ExplorerFilter>("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ExplorerSearchResult | null>(null);
  const receiptHistory = useReceiptHistory({
    from: historyFrom,
    page: historyPage,
    pageSize: RECEIPT_HISTORY_PAGE_SIZE,
    q: historyQuery,
    status: explorerFilter === "all" ? undefined : explorerFilter,
    to: historyTo,
  });

  const receiptRows = receiptHistory.receipts.map((detail) => detail.receipt);
  const activeDetails = searchResult?.matches ?? receiptHistory.receipts;
  const activeReceiptRows = activeDetails.map((detail) => detail.receipt);
  const selectedReceiptId =
    selectedReceiptOverride ?? searchResult?.detail?.receipt.id ?? receiptParam ?? receiptRows[0]?.id ?? receipts[0].id;
  const feedReceiptDetail =
    activeDetails.find((detail) => detail.receipt.id === selectedReceiptId) ??
    (deepLink.detail?.receipt.id === selectedReceiptId ? deepLink.detail : undefined) ??
    activeDetails[0] ??
    buildReceiptDetail(receiptById(selectedReceiptId));
  const receiptDetail = searchResult?.detail ?? feedReceiptDetail;
  const selectedReceipt = receiptDetail.receipt;
  const filteredReceipts = useMemo(() => {
    if (!searchResult?.matches || explorerFilter === "all") return activeReceiptRows;
    return activeReceiptRows.filter((receipt) => receipt.status === explorerFilter);
  }, [activeReceiptRows, explorerFilter, searchResult?.matches]);

  async function runSearch() {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResult(null);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`/api/explorer/search?q=${encodeURIComponent(query)}`);
      const body = (await response.json()) as ExplorerSearchResult;
      setSearchResult(body);
      if (body.detail) setSelectedReceiptOverride(body.detail.receipt.id);
    } catch {
      setSearchResult({ message: "Explorer search failed before a result was returned.", query, source: "not_found" });
    } finally {
      setSearching(false);
    }
  }

  function selectReceipt(receiptId: string) {
    setSearchResult(null);
    setSelectedReceiptOverride(receiptId);
  }

  function changeFilter(filter: ExplorerFilter) {
    beginHistoryBrowse();
    setExplorerFilter(filter);
    setHistoryPage(1);
  }

  function changeHistoryQuery(value: string) {
    beginHistoryBrowse();
    setHistoryQuery(value);
    setHistoryPage(1);
  }

  function changeHistoryFrom(value: string) {
    beginHistoryBrowse();
    setHistoryFrom(value);
    setHistoryPage(1);
  }

  function changeHistoryTo(value: string) {
    beginHistoryBrowse();
    setHistoryTo(value);
    setHistoryPage(1);
  }

  function beginHistoryBrowse() {
    setSearchResult(null);
    deepLink.clear();
    setSelectedReceiptOverride(receiptRows[0]?.id ?? receipts[0].id);
  }

  function nextHistoryPage() {
    beginHistoryBrowse();
    setHistoryPage((page) => page + 1);
  }

  function previousHistoryPage() {
    beginHistoryBrowse();
    setHistoryPage((page) => Math.max(1, page - 1));
  }

  return (
    <main className="app">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brandMark" />
          <span>
            casper<span className="brandHyphen">-</span>gw
          </span>
        </Link>
        <nav className="nav" aria-label="Public">
          <Link className="navButton" data-active="true" href="/explorer">
            <span className="dot" />
            Explorer
          </Link>
          <Link className="navButton" href="/app">
            <span className="dot" />
            App
          </Link>
        </nav>
        <span className="networkPill">
          <span className="dot" style={{ background: "var(--signal)", opacity: 1 }} />
          Testnet
        </span>
      </header>
      <section className="page">
        <header className="pageHeader">
          <div className="eyebrow">Public infrastructure</div>
          <h1>Casper x402 Explorer</h1>
          <p className="subhead">
            Public receipt inspection for rich Casper GW records plus external deploy and account
            proof lookup. External proofs show chain facts only.
          </p>
          <div className="buttonRow" style={{ marginTop: 14 }}>
            <Chip tone={receiptHistory.source === "postgres" ? "primary" : "warn"}>
              {receiptHistory.source === "postgres" ? "Gateway receipts" : "Sample receipts"}
            </Chip>
            <Chip tone="warn">External proof is limited</Chip>
            <Chip tone="signal">No sign-in required</Chip>
          </div>
        </header>
        <ExplorerScreen
          explorerFilter={explorerFilter}
          filteredReceipts={filteredReceipts}
          historyControls={{
            canNext: receiptHistory.pagination.hasNextPage,
            canPrevious: receiptHistory.pagination.hasPreviousPage,
            from: historyFrom,
            loading: receiptHistory.loading,
            onFrom: changeHistoryFrom,
            onNext: nextHistoryPage,
            onPrevious: previousHistoryPage,
            onQuery: changeHistoryQuery,
            onTo: changeHistoryTo,
            pageLabel: `${receiptHistory.pagination.totalCount} result${
              receiptHistory.pagination.totalCount === 1 ? "" : "s"
            } - page ${receiptHistory.pagination.page} of ${receiptHistory.pagination.totalPages}`,
            query: historyQuery,
            to: historyTo,
          }}
          onFilter={changeFilter}
          onReceipt={selectReceipt}
          onSearch={runSearch}
          onSearchQuery={setSearchQuery}
          receiptDetail={receiptDetail}
          searchMessage={searchResult?.message}
          searchQuery={searchQuery}
          searchSource={searchResult?.source}
          searching={searching}
          selectedReceipt={selectedReceipt}
          selectedReceiptId={selectedReceipt.id}
        />
      </section>
    </main>
  );
}
