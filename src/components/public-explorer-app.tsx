"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalAccountHistoryBar } from "@/components/explorer/external-account-history-bar";
import { useReceiptDeepLink } from "@/components/explorer/use-receipt-deep-link";
import { useExplorerSearch } from "@/components/explorer/use-explorer-search";
import { useReceiptHistory } from "@/components/explorer/use-receipt-history";
import { ExplorerScreen, type ExplorerFilter } from "@/components/screens/explorer-screen";
import { Chip } from "@/components/ui";
import { receipts } from "@/lib/fixtures";
import { buildReceiptDetail, receiptById } from "@/lib/receipt-detail";

const RECEIPT_HISTORY_PAGE_SIZE = 4, EXTERNAL_ACCOUNT_PAGE_SIZE = 4;
type ExplorerViewMode = "history" | "search";
export function PublicExplorerApp() {
  const searchParams = useSearchParams();
  const receiptParam = searchParams.get("receipt");
  const deepLink = useReceiptDeepLink(receiptParam);
  const explorerSearch = useExplorerSearch(EXTERNAL_ACCOUNT_PAGE_SIZE);
  const [selectedReceiptOverride, setSelectedReceiptOverride] = useState<string | null>(null);
  const [explorerFilter, setExplorerFilter] = useState<ExplorerFilter>("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [viewMode, setViewMode] = useState<ExplorerViewMode>("history");
  const receiptHistory = useReceiptHistory({
    from: historyFrom,
    page: historyPage,
    pageSize: RECEIPT_HISTORY_PAGE_SIZE,
    q: historyQuery,
    status: explorerFilter === "all" ? undefined : explorerFilter,
    to: historyTo,
  });

  const receiptRows = receiptHistory.receipts.map((detail) => detail.receipt);
  const searchResult = viewMode === "search" ? explorerSearch.result : null;
  const localSearchDetails = searchResult?.matches ?? (searchResult?.detail ? [searchResult.detail] : []);
  const externalDetails =
    searchResult?.source === "casper_gw_account" ? searchResult.externalAccount?.matches ?? [] : [];
  const activeDetails = searchResult ? [...localSearchDetails, ...externalDetails] : receiptHistory.receipts;
  const activeReceiptRows = activeDetails.map((detail) => detail.receipt);
  const selectedReceiptId =
    selectedReceiptOverride ?? searchResult?.detail?.receipt.id ?? receiptParam ?? receiptRows[0]?.id ?? receipts[0].id;
  const feedReceiptDetail =
    activeDetails.find((detail) => detail.receipt.id === selectedReceiptId) ??
    (deepLink.detail?.receipt.id === selectedReceiptId ? deepLink.detail : undefined) ??
    activeDetails[0] ??
    buildReceiptDetail(receiptById(selectedReceiptId));
  const receiptDetail = selectedReceiptOverride ? feedReceiptDetail : searchResult?.detail ?? feedReceiptDetail;
  const selectedReceipt = receiptDetail.receipt;
  const filteredReceipts = useMemo(() => {
    if (!searchResult || explorerFilter === "all") return activeReceiptRows;
    return activeReceiptRows.filter((receipt) => receipt.status === explorerFilter);
  }, [activeReceiptRows, explorerFilter, searchResult]);

  function selectReceipt(receiptId: string) {
    setSelectedReceiptOverride(receiptId);
  }

  function searchExplorerFirstPage() {
    setViewMode("search");
    setSelectedReceiptOverride(null);
    explorerSearch.searchFirstPage();
  }

  function nextExternalPage() {
    setSelectedReceiptOverride(null);
    explorerSearch.nextExternalPage();
  }

  function previousExternalPage() {
    setSelectedReceiptOverride(null);
    explorerSearch.previousExternalPage();
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
    setViewMode("history");
    explorerSearch.clear();
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
            Public receipt inspection for rich Casper GW records plus external deploy and account proof lookup. External proofs show chain facts only.
          </p>
          <div className="buttonRow" style={{ marginTop: 14 }}>
            <Chip tone={receiptHistory.source === "postgres" ? "primary" : "warn"}>
              {receiptHistory.source === "postgres" ? "Gateway receipts" : "Sample receipts"}
            </Chip>
            <Chip tone="warn">External proof is limited</Chip>
            <Chip tone="signal">No sign-in required</Chip>
          </div>
        </header>
        <ExternalAccountHistoryBar
          history={searchResult?.externalAccount}
          loading={explorerSearch.searching}
          onNext={nextExternalPage}
          onPrevious={previousExternalPage}
        />
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
          onSearch={searchExplorerFirstPage}
          onSearchQuery={explorerSearch.setQuery}
          receiptDetail={receiptDetail}
          searchMessage={searchResult?.message}
          searchQuery={explorerSearch.query}
          searchSource={searchResult?.source}
          searching={explorerSearch.searching}
          selectedReceipt={selectedReceipt}
          selectedReceiptId={selectedReceipt.id}
        />
      </section>
    </main>
  );
}
