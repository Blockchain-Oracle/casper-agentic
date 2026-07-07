import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { ReceiptProofTimeline, RECEIPT_PROOF_NOTE, StatusBadge } from "@/components/receipt/receipt-detail-view";
import { SiteNav } from "@/components/site/site-nav";
import { casperExplorerUrl, getCasperNetwork } from "@/lib/casper-networks";
import { getReceiptDetail } from "@/server/receipt-store";

export const dynamic = "force-dynamic";

// Public, no-sign-in Casper x402 payment proof. A genuinely unknown id is a 404.
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getReceiptDetail(id);
  if (!detail) notFound();
  const deployHash = detail.receipt.hash;

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <Link href="/explorer" className="font-mono text-xs text-ink-3 hover:text-ink">← Explorer</Link>
        <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-3">Public receipt · no sign-in</div>
        <h1 className="mt-1.5 break-all font-mono text-lg text-ink">{detail.receipt.id}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          Casper x402 payment proof. Anyone can verify this — no wallet or account required.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={detail.receipt.status} />
          {deployHash ? (
            <a
              className="inline-flex items-center gap-1 font-mono text-xs text-casper hover:underline"
              href={casperExplorerUrl(deployHash, "deploy", detail.receipt.network)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open raw proof on {getCasperNetwork(detail.receipt.network).explorerBaseUrl.replace("https://", "")} <ArrowUpRight className="size-3.5" />
            </a>
          ) : null}
        </div>

        <div className="mt-8">
          <ReceiptProofTimeline detail={detail} />
        </div>
        <p className="mt-4 rounded-lg border border-hairline bg-well px-4 py-3 text-xs leading-relaxed text-ink-3">
          {RECEIPT_PROOF_NOTE}
        </p>
      </main>
    </div>
  );
}
