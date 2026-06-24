"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ExternalAccountHistoryBar } from "@/components/explorer/external-account-history-bar";
import { ExternalActionFeedBar } from "@/components/explorer/external-action-feed-bar";
import { PublicExplorerHeader } from "@/components/explorer/public-explorer-header";
import { useExternalActionFeed } from "@/components/explorer/use-external-action-feed";
import { useReceiptDeepLink } from "@/components/explorer/use-receipt-deep-link";
import { useExplorerSearch } from "@/components/explorer/use-explorer-search";
import { useReceiptHistory } from "@/components/explorer/use-receipt-history";
import { ExplorerScreen, type ExplorerFilter } from "@/components/screens/explorer-screen";
import { receipts } from "@/lib/fixtures";
import { buildReceiptDetail, receiptById } from "@/lib/receipt-detail";

const RECEIPT_HISTORY_PAGE_SIZE = 4, EXTERNAL_ACCOUNT_PAGE_SIZE = 4, EXTERNAL_FEED_PAGE_SIZE = 4;
type ExplorerViewMode = "history" | "search" | "external-feed";
export function PublicExplorerApp() {
  const searchParams = useSearchParams();
  const receiptParam = searchParams.get("receipt");
  const deepLink = useReceiptDeepLink(receiptParam);
  const explorerSearch = useExplorerSearch(EXTERNAL_ACCOUNT_PAGE_SIZE);
  const externalFeed = useExternalActionFeed(EXTERNAL_FEED_PAGE_SIZE);
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
  const feedResult = viewMode === "external-feed" ? externalFeed.result : null;
  const feedDetails = feedResult?.matches ?? (feedResult?.detail ? [feedResult.detail] : []);
  const activeDetails = searchResult
    ? [...localSearchDetails, ...externalDetails]
    : feedResult
      ? feedDetails
      : receiptHistory.receipts;
  const activeReceiptRows = activeDetails.map((detail) => detail.receipt);
  const selectedReceiptId =
    selectedReceiptOverride ??
    searchResult?.detail?.receipt.id ??
    feedResult?.detail?.receipt.id ??
    receiptParam ??
    activeReceiptRows[0]?.id ??
    receiptRows[0]?.id ??
    receipts[0].id;
  const feedReceiptDetail =
    activeDetails.find((detail) => detail.receipt.id === selectedReceiptId) ??
    (deepLink.detail?.receipt.id === selectedReceiptId ? deepLink.detail : undefined) ??
    activeDetails[0] ??
    buildReceiptDetail(receiptById(selectedReceiptId));
  const receiptDetail = selectedReceiptOverride ? feedReceiptDetail : searchResult?.detail ?? feedReceiptDetail;
  const selectedReceipt = receiptDetail.receipt;
  const filteredReceipts =
    !searchResult || explorerFilter === "all"
      ? activeReceiptRows
      : activeReceiptRows.filter((receipt) => receipt.status === explorerFilter);

  function selectReceipt(receiptId: string) {
    setSelectedReceiptOverride(receiptId);
  }

  function searchExplorerFirstPage() {
    setViewMode("search");
    setSelectedReceiptOverride(null);
    externalFeed.clear();
    explorerSearch.searchFirstPage();
  }

  function nextExternalPage() { setSelectedReceiptOverride(null); explorerSearch.nextExternalPage(); }

  function previousExternalPage() { setSelectedReceiptOverride(null); explorerSearch.previousExternalPage(); }

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
    externalFeed.clear();
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

  function openExternalFeed() {
    setViewMode("external-feed");
    setExplorerFilter("all");
    setSelectedReceiptOverride(null);
    explorerSearch.clear();
    deepLink.clear();
    externalFeed.loadFirstPage();
  }

  function nextExternalFeedPage() { setSelectedReceiptOverride(null); externalFeed.nextPage(); }

  function previousExternalFeedPage() { setSelectedReceiptOverride(null); externalFeed.previousPage(); }

  return (
    <main className="app">
      <PublicExplorerHeader receiptSource={receiptHistory.source} />
      <section className="page">
        <ExternalAccountHistoryBar
          history={searchResult?.externalAccount}
          loading={explorerSearch.searching}
          onNext={nextExternalPage}
          onPrevious={previousExternalPage}
        />
        <ExternalActionFeedBar
          active={viewMode === "external-feed"}
          feed={feedResult}
          loading={externalFeed.loading}
          onNext={nextExternalFeedPage}
          onOpen={openExternalFeed}
          onPrevious={previousExternalFeedPage}
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
