import { Panel, ProofPanel, TabButton } from "@/components/screen-primitives";
import { StatusChip } from "@/components/ui";
import { statusMeta } from "@/lib/fixtures";
import type { Receipt, ReceiptDetail, ReceiptStatus } from "@/lib/types";

export type ExplorerFilter = "all" | ReceiptStatus;

export function ExplorerScreen({
  explorerFilter,
  filteredReceipts,
  onFilter,
  onReceipt,
  receiptDetail,
  selectedReceipt,
  selectedReceiptId,
}: {
  explorerFilter: ExplorerFilter;
  filteredReceipts: Receipt[];
  onFilter: (filter: ExplorerFilter) => void;
  onReceipt: (receiptId: string) => void;
  receiptDetail: ReceiptDetail;
  selectedReceipt: Receipt;
  selectedReceiptId: string;
}) {
  const filters: ExplorerFilter[] = ["all", ...(Object.keys(statusMeta) as ReceiptStatus[])];

  return (
    <div className="receiptLayout">
      <Panel title="Receipts">
        <div className="stack">
          <div className="codeTabs">
            {filters.map((filter) => (
              <TabButton active={explorerFilter === filter} key={filter} onClick={() => onFilter(filter)}>
                {filter === "all" ? "All" : statusMeta[filter].label}
              </TabButton>
            ))}
          </div>
          <div className="receiptList">
            {filteredReceipts.map((receipt) => (
              <button
                className="receiptRow"
                data-active={receipt.id === selectedReceiptId}
                key={receipt.id}
                onClick={() => onReceipt(receipt.id)}
                type="button"
              >
                <div className="receiptMeta">
                  <strong className="mono">{receipt.id}</strong>
                  <StatusChip status={receipt.status} />
                </div>
                <div className="miniMeta">
                  <span>{receipt.time}</span>
                  <span>{receipt.provider}</span>
                  <span>
                    {receipt.amount} {receipt.asset}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="stack">
        <Panel title={`${selectedReceipt.id} receipt`} action={<StatusChip status={selectedReceipt.status} />}>
          <div className="proofGrid">
            <ProofPanel title="Gateway context" rows={receiptDetail.gateway} />
            <ProofPanel title="Policy decision" note={receiptDetail.policyNote} rows={receiptDetail.policy} />
            <ProofPanel title="x402 verify / settle" note={receiptDetail.x402Note} rows={receiptDetail.x402} />
            <ProofPanel title="Casper proof" note={receiptDetail.casperNote} rows={receiptDetail.casper} />
          </div>
        </Panel>
        <div className="notice">
          Chain proof covers payment settlement only. Provider, resource URL, pricing rule,
          client, and policy decision are gateway receipt context.
        </div>
      </div>
    </div>
  );
}
