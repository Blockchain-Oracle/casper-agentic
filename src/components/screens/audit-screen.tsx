"use client";

import { useState } from "react";

import { ReceiptProofTimeline } from "@/components/receipt/receipt-detail-view";
import { Panel } from "@/components/screen-primitives";
import { Chip, StatusChip } from "@/components/ui";
import { receipts } from "@/lib/fixtures";
import { formatAddress } from "@/lib/format-address";
import { buildReceiptDetail } from "@/lib/receipt-detail";
import type { Receipt } from "@/lib/types";
import { Modal } from "@/components/ui/modal";

// Standalone audit log. Each row opens a detail modal — the one gap Abu flagged:
// a clickable cspr.live deploy link plus the four-layer breakdown that explains
// WHY a call settled, was blocked, or failed.
export function AuditScreen() {
  const [selected, setSelected] = useState<Receipt | null>(null);
  const detail = selected ? buildReceiptDetail(selected) : null;

  return (
    <div className="stack">
      <Panel title="Audit log" action={<Chip tone="warn">Sample · fixture</Chip>}>
        {receipts.map((receipt) => (
          <button
            className="auditRow"
            key={receipt.id}
            onClick={() => setSelected(receipt)}
            type="button"
            style={{ textAlign: "left", width: "100%", background: "transparent" }}
          >
            <div className="receiptMeta">
              <strong className="mono">{receipt.id}</strong>
              <StatusChip status={receipt.status} />
            </div>
            <div className="miniMeta">
              <span>{receipt.time}</span>
              <span>{receipt.tool}</span>
              <span>
                {receipt.amount} {receipt.asset}
              </span>
              <span className="mono">{receipt.hash ? formatAddress(receipt.hash, { lead: 6, trail: 4 }) : "no tx"}</span>
            </div>
          </button>
        ))}
      </Panel>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.id}
        subtitle={selected ? `${selected.tool} · ${selected.amount} ${selected.asset}` : undefined}
        maxWidth={920}
        footer={
          selected?.hash ? (
            <a
              className="mono"
              href={`https://testnet.cspr.live/deploy/${selected.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--brand)", fontSize: 13 }}
            >
              Open raw proof on testnet.cspr.live ↗
            </a>
          ) : (
            <span style={{ color: "var(--ink-3)", fontSize: 13 }}>No Casper transaction for this outcome.</span>
          )
        }
      >
        {detail ? <ReceiptProofTimeline detail={detail} /> : null}
      </Modal>
    </div>
  );
}
