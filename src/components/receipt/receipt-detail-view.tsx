import { Fragment } from "react";

import { ProofStamp } from "@/components/site/proof-stamp";
import type { KeyValueRow, ReceiptDetail, ReceiptStatus } from "@/lib/types";

const TONE: Record<NonNullable<KeyValueRow["tone"]>, string> = {
  danger: "text-signal",
  neutral: "text-ink-3",
  primary: "text-ink",
  signal: "text-settled",
  warn: "text-signal",
};

const STATUS: Record<string, { label: string; tone: string }> = {
  auth_failed: { label: "Auth failed", tone: "text-signal" },
  blocked: { label: "Blocked", tone: "text-signal" },
  external_proof: { label: "External proof", tone: "text-ink-2" },
  policy_pending: { label: "Pending", tone: "text-ink-3" },
  raw_proof_unavailable: { label: "Settled · proof indexing", tone: "text-signal" },
  settle_failed: { label: "Settle failed", tone: "text-signal" },
  settled: { label: "Settled", tone: "text-settled" },
  upstream_failed: { label: "Upstream failed", tone: "text-signal" },
  verify_failed: { label: "Verify failed", tone: "text-signal" },
};

export function StatusBadge({ status }: { status: ReceiptStatus }) {
  const s = STATUS[status] ?? { label: status, tone: "text-ink-3" };
  const settled = status === "settled";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${s.tone}`}>
      <span className={`size-1.5 rounded-full ${settled ? "bg-settled" : status === "policy_pending" ? "bg-ink-3" : "bg-signal"}`} />
      {s.label}
    </span>
  );
}

/**
 * Three-layer Casper receipt proof (gateway context → x402 verify+settle → Casper
 * proof). The settle terminus stamps the proof seal with the deploy hash. Shared by
 * the public explorer-linked receipt page. Honesty inherited from the builders —
 * never a deploy hash or "settled" without a real one.
 */
export function ReceiptProofTimeline({ detail }: { detail: ReceiptDetail }) {
  const settled = detail.receipt.status === "settled" && Boolean(detail.receipt.hash);
  const layers = [
    { num: 1, title: "Gateway context", rows: detail.gateway, note: undefined as string | undefined, accent: "bg-ink-3" },
    { num: 2, title: "x402 verify & settle", rows: detail.x402, note: detail.x402Note, accent: "bg-ink" },
    { num: 3, title: "Casper proof", rows: detail.casper, note: detail.casperNote, accent: "bg-casper" },
  ];

  return (
    <div className="space-y-3">
      {layers.map((layer) => (
        <div key={layer.num} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold text-white ${layer.accent}`}>
              {layer.num}
            </span>
            {layer.num < 3 ? <span className="mt-1 w-px flex-1 bg-hairline" /> : null}
          </div>
          <div className={`flex-1 rounded-lg border bg-panel p-4 ${layer.num === 3 ? "border-casper/40" : "border-hairline"}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">{layer.title}</span>
              {layer.num === 3 && settled ? <ProofStamp size={48} hash={detail.receipt.hash ?? undefined} /> : null}
            </div>
            {layer.rows.length ? (
              <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
                {layer.rows.map((row, i) => (
                  <Fragment key={`${row.key}-${i}`}>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">{row.key}</span>
                    <span className={`min-w-0 break-all text-sm ${row.mono ? "font-mono text-xs" : ""} ${row.tone ? TONE[row.tone] : "text-ink"}`}>
                      {row.value}
                    </span>
                  </Fragment>
                ))}
              </div>
            ) : null}
            {layer.note ? <p className="mt-3 border-t border-hairline pt-2.5 text-xs leading-relaxed text-ink-3">{layer.note}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export const RECEIPT_PROOF_NOTE =
  "Chain proof covers payment settlement only. Provider, tool, resource, price, and client are gateway receipt context.";
