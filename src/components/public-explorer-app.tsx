"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ExplorerScreen, type ExplorerFilter } from "@/components/screens/explorer-screen";
import { Chip } from "@/components/ui";
import { receipts } from "@/lib/fixtures";
import { buildReceiptDetail, receiptById } from "@/lib/receipt-detail";
import type { ExplorerSearchResult, ReceiptDetail } from "@/lib/types";

type ReceiptFeedSource = "fixture" | "postgres";

export function PublicExplorerApp() {
  const searchParams = useSearchParams();
  const [selectedReceiptOverride, setSelectedReceiptOverride] = useState<string | null>(null);
  const [explorerFilter, setExplorerFilter] = useState<ExplorerFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ExplorerSearchResult | null>(null);
  const [receiptFeedSource, setReceiptFeedSource] = useState<ReceiptFeedSource>("fixture");
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetail[]>(
    receipts.map((receipt) => buildReceiptDetail(receipt)),
  );

  useEffect(() => {
    let active = true;
    fetch("/api/receipts")
      .then((response) => (response.ok ? response.json() : undefined))
      .then((body) => {
        if (!active || !Array.isArray(body?.receipts)) return;
        setReceiptDetails(body.receipts);
        setReceiptFeedSource(body.source === "postgres" ? "postgres" : "fixture");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const receiptRows = receiptDetails.map((detail) => detail.receipt);
  const selectedReceiptId = selectedReceiptOverride ?? searchParams.get("receipt") ?? receiptRows[0]?.id ?? receipts[0].id;
  const feedReceiptDetail =
    receiptDetails.find((detail) => detail.receipt.id === selectedReceiptId) ?? buildReceiptDetail(receiptById(selectedReceiptId));
  const receiptDetail = searchResult?.detail ?? feedReceiptDetail;
  const selectedReceipt = receiptDetail.receipt;
  const filteredReceipts = useMemo(() => {
    if (explorerFilter === "all") return receiptRows;
    return receiptRows.filter((receipt) => receipt.status === explorerFilter);
  }, [explorerFilter, receiptRows]);

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
            Public receipt inspection for rich Casper GW records plus external deploy-hash
            proof lookup. External proofs show chain facts only.
          </p>
          <div className="buttonRow" style={{ marginTop: 14 }}>
            <Chip tone={receiptFeedSource === "postgres" ? "primary" : "warn"}>
              {receiptFeedSource === "postgres" ? "Gateway receipts" : "Sample receipts"}
            </Chip>
            <Chip tone="warn">External proof is limited</Chip>
            <Chip tone="signal">No sign-in required</Chip>
          </div>
        </header>
        <ExplorerScreen
          explorerFilter={explorerFilter}
          filteredReceipts={filteredReceipts}
          onFilter={setExplorerFilter}
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
