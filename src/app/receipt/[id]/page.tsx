import Link from "next/link";
import { notFound } from "next/navigation";

import { ReceiptProofTimeline, RECEIPT_PROOF_NOTE } from "@/components/receipt/receipt-detail-view";
import { Panel } from "@/components/screen-primitives";
import { StatusChip } from "@/components/ui";
import { getReceiptDetail } from "@/server/receipt-store";

export const dynamic = "force-dynamic";

// Public, no-sign-in receipt proof page. Resolves a real receipt server-side
// (falls back to labeled fixture data only when DATABASE_URL is unset, inside
// getReceiptDetail); a genuinely unknown id is a 404, never a stand-in receipt.
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getReceiptDetail(id);
  if (!detail) notFound();

  const deployHash = detail.receipt.hash;

  return (
    <main className="app">
      <section className="page">
        <header className="pageHeader">
          <div className="eyebrow">Public receipt · no sign-in</div>
          <h1 className="mono">{detail.receipt.id}</h1>
          <p className="subhead">Casper x402 payment proof. Anyone can verify this — no wallet or account required.</p>
          <div className="buttonRow" style={{ marginTop: 14, alignItems: "center", gap: 12 }}>
            <StatusChip status={detail.receipt.status} />
            <Link className="mono" href="/explorer" style={{ color: "var(--ink-2)", fontSize: 13 }}>
              ← Explorer
            </Link>
            {deployHash ? (
              <a
                className="mono"
                href={`https://testnet.cspr.live/deploy/${deployHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--brand)", fontSize: 13 }}
              >
                Open raw proof on testnet.cspr.live ↗
              </a>
            ) : null}
          </div>
        </header>

        <div className="stack">
          <Panel title={`${detail.receipt.id} receipt`} action={<StatusChip status={detail.receipt.status} />}>
            <ReceiptProofTimeline detail={detail} />
          </Panel>
          <div className="notice">{RECEIPT_PROOF_NOTE}</div>
        </div>
      </section>
    </main>
  );
}
