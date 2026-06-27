import { StatusChip } from "@/components/ui";
import { formatAsset, formatTokenAmount } from "@/lib/format-amount";
import { formatReceiptId } from "@/lib/format-address";
import { formatAge } from "@/lib/format-time";
import type { Receipt } from "@/lib/types";

// Receipt list rendered as the v3 prototype's table (Status / Receipt / Tool·Provider
// / Amount / Age). Rows are clickable and drive the detail timeline below.
export function ExplorerReceiptTable({
  onReceipt,
  receipts,
  selectedReceiptId,
}: {
  onReceipt: (receiptId: string) => void;
  receipts: Receipt[];
  selectedReceiptId: string;
}) {
  if (!receipts.length) {
    return <div className="emptyState">No receipts match this filter.</div>;
  }
  return (
    <div className="explorerTable">
      <div className="explorerHead">
        <div>Status</div>
        <div>Receipt</div>
        <div>Tool · Provider</div>
        <div style={{ textAlign: "right" }}>Amount</div>
        <div style={{ textAlign: "right" }}>Age</div>
      </div>
      {receipts.map((receipt) => (
        <button
          className="explorerRow"
          data-active={receipt.id === selectedReceiptId}
          key={receipt.id}
          onClick={() => onReceipt(receipt.id)}
          type="button"
        >
          <StatusChip status={receipt.status} />
          <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis", color: "var(--primary)", fontSize: 12.5 }}>
            {formatReceiptId(receipt.id)}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600, fontSize: 13 }}>
            {receipt.tool} <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>· {receipt.provider}</span>
          </span>
          <span className="mono" style={{ textAlign: "right", fontSize: 12.5, whiteSpace: "nowrap" }}>
            {formatTokenAmount(receipt.amount)} {formatAsset(receipt.asset)}
          </span>
          <span
            className="mono"
            style={{ textAlign: "right", fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}
            title={receipt.time}
          >
            {formatAge(receipt.time)}
          </span>
        </button>
      ))}
    </div>
  );
}
