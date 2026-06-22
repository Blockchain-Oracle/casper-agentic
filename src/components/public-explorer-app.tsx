"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ExplorerScreen, type ExplorerFilter } from "@/components/screens/explorer-screen";
import { Chip } from "@/components/ui";
import { receipts } from "@/lib/fixtures";
import { buildReceiptDetail, receiptById } from "@/lib/receipt-detail";

export function PublicExplorerApp() {
  const searchParams = useSearchParams();
  const [selectedReceiptOverride, setSelectedReceiptOverride] = useState<string | null>(null);
  const [explorerFilter, setExplorerFilter] = useState<ExplorerFilter>("all");

  const selectedReceiptId = selectedReceiptOverride ?? searchParams.get("receipt") ?? receipts[0].id;
  const selectedReceipt = receiptById(selectedReceiptId);
  const receiptDetail = buildReceiptDetail(selectedReceipt);
  const filteredReceipts = useMemo(() => {
    if (explorerFilter === "all") return receipts;
    return receipts.filter((receipt) => receipt.status === explorerFilter);
  }, [explorerFilter]);

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
            Public receipt inspection for gateway context, policy decision, x402 state,
            and Casper proof. Fixture rows are labeled and do not claim a deploy hash.
          </p>
          <div className="buttonRow" style={{ marginTop: 14 }}>
            <Chip tone="warn">Fixture receipts</Chip>
            <Chip tone="signal">No sign-in required</Chip>
          </div>
        </header>
        <ExplorerScreen
          explorerFilter={explorerFilter}
          filteredReceipts={filteredReceipts}
          onFilter={setExplorerFilter}
          onReceipt={setSelectedReceiptOverride}
          receiptDetail={receiptDetail}
          selectedReceipt={selectedReceipt}
          selectedReceiptId={selectedReceiptId}
        />
      </section>
    </main>
  );
}
