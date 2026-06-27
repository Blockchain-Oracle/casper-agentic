import { Fragment } from "react";

import type { KeyValueRow, ReceiptDetail } from "@/lib/types";

const TONE_VAR: Record<NonNullable<KeyValueRow["tone"]>, string> = {
  danger: "--danger-ink",
  neutral: "--ink-2",
  primary: "--primary-ink",
  signal: "--signal-ink",
  warn: "--warn-ink",
};

/**
 * The three-layer Casper receipt proof, rendered as a numbered vertical timeline
 * (gateway context → x402 verify+settle → Casper proof). Single source of truth
 * shared by the public explorer and the public `/receipt/[id]` page. Honesty is
 * inherited from the builders — it never emits a deploy hash or "settled" without a
 * real one. (Spend policy was removed; the gateway no longer gates per-user spend.)
 */
export function ReceiptProofTimeline({ detail }: { detail: ReceiptDetail }) {
  const layers = [
    { color: "var(--ink-2)", note: undefined as string | undefined, num: 1, rows: detail.gateway, title: "Gateway context" },
    { color: "var(--x402)", note: detail.x402Note, num: 2, rows: detail.x402, title: "x402 verify & settle" },
    { color: "var(--brand)", note: detail.casperNote, num: 3, rows: detail.casper, title: "Casper proof" },
  ];

  return (
    <div className="proofTimeline">
      {layers.map((layer) => (
        <div className="proofLayer" key={layer.num}>
          <div className="proofNum" style={{ background: layer.color }}>
            {layer.num}
          </div>
          <div className={layer.num === 3 ? "proofCard casper" : "proofCard"}>
            <div className="proofCardHead">{layer.title}</div>
            {layer.rows.length ? (
              <div className="proofRows">
                {layer.rows.map((row, index) => (
                  <Fragment key={`${row.key}-${index}`}>
                    <span className="proofRowKey">{row.key}</span>
                    <span
                      className={row.mono ? "proofRowVal mono" : "proofRowVal"}
                      style={row.tone ? { color: `var(${TONE_VAR[row.tone]})` } : undefined}
                    >
                      {row.value}
                    </span>
                  </Fragment>
                ))}
              </div>
            ) : null}
            {layer.note ? <div className="proofNote">{layer.note}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export const RECEIPT_PROOF_NOTE =
  "Chain proof covers payment settlement only. Provider, resource URL, pricing rule, client, and policy decision are gateway receipt context.";
