import { Panel, ProofPanel, TabButton } from "@/components/screen-primitives";
import { Chip, StatusChip } from "@/components/ui";
import { statusMeta } from "@/lib/fixtures";
import type { ExplorerSearchSource, Receipt, ReceiptDetail, ReceiptStatus } from "@/lib/types";

export type ExplorerFilter = "all" | ReceiptStatus;

export interface ExplorerHistoryControls {
  canNext: boolean;
  canPrevious: boolean;
  from: string;
  loading: boolean;
  onFrom: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onQuery: (value: string) => void;
  onTo: (value: string) => void;
  pageLabel: string;
  query: string;
  to: string;
}

export function ExplorerScreen({
  explorerFilter,
  filteredReceipts,
  historyControls,
  onFilter,
  onReceipt,
  onSearch,
  onSearchQuery,
  receiptDetail,
  searchMessage,
  searchQuery,
  searchSource,
  searching,
  selectedReceipt,
  selectedReceiptId,
}: {
  explorerFilter: ExplorerFilter;
  filteredReceipts: Receipt[];
  historyControls: ExplorerHistoryControls;
  onFilter: (filter: ExplorerFilter) => void;
  onReceipt: (receiptId: string) => void;
  onSearch: () => void;
  onSearchQuery: (query: string) => void;
  receiptDetail: ReceiptDetail;
  searchMessage?: string;
  searchQuery: string;
  searchSource?: ExplorerSearchSource;
  searching: boolean;
  selectedReceipt: Receipt;
  selectedReceiptId: string;
}) {
  const filters: ExplorerFilter[] = ["all", ...(Object.keys(statusMeta) as ReceiptStatus[])];
  const sourceChip = searchSource ? sourceLabel(searchSource) : null;

  return (
    <div className="receiptLayout">
      <Panel title="Receipts">
        <div className="stack">
          <form
            className="stack tight"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
            }}
          >
            <label>
              <div className="fieldLabel">Search receipt id, deploy hash, or account hash</div>
              <input
                className="input"
                onChange={(event) => onSearchQuery(event.target.value)}
                placeholder="receipt uuid, deploy hash, account:hash, or wallet:hash"
                value={searchQuery}
              />
            </label>
            <div className="buttonRow">
              <button className="primaryButton" disabled={searching} type="submit">
                {searching ? "Searching..." : "Search explorer"}
              </button>
              {sourceChip ? <Chip tone={sourceChip.tone}>{sourceChip.label}</Chip> : null}
            </div>
            {searchMessage ? <div className={`notice ${searchSource === "not_found" ? "danger" : ""}`}>{searchMessage}</div> : null}
          </form>
          <div className="stack tight">
            <label>
              <div className="fieldLabel">Filter receipt history</div>
              <input
                className="input"
                onChange={(event) => historyControls.onQuery(event.target.value)}
                placeholder="provider, tool, wallet, status, network"
                value={historyControls.query}
              />
            </label>
            <div className="formGrid">
              <label>
                <div className="fieldLabel">From</div>
                <input
                  className="input"
                  onChange={(event) => historyControls.onFrom(event.target.value)}
                  type="date"
                  value={historyControls.from}
                />
              </label>
              <label>
                <div className="fieldLabel">To</div>
                <input
                  className="input"
                  onChange={(event) => historyControls.onTo(event.target.value)}
                  type="date"
                  value={historyControls.to}
                />
              </label>
            </div>
          </div>
          <div className="codeTabs">
            {filters.map((filter) => (
              <TabButton active={explorerFilter === filter} key={filter} onClick={() => onFilter(filter)}>
                {filter === "all" ? "All" : statusMeta[filter].label}
              </TabButton>
            ))}
          </div>
          <div className="buttonRow">
            <button
              className="secondaryButton"
              disabled={!historyControls.canPrevious || historyControls.loading}
              onClick={historyControls.onPrevious}
              type="button"
            >
              Previous
            </button>
            <Chip tone="neutral">{historyControls.loading ? "Loading receipts" : historyControls.pageLabel}</Chip>
            <button
              className="secondaryButton"
              disabled={!historyControls.canNext || historyControls.loading}
              onClick={historyControls.onNext}
              type="button"
            >
              Next
            </button>
          </div>
          <div className="receiptList">
            {filteredReceipts.length ? (
              filteredReceipts.map((receipt) => (
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
              ))
            ) : (
              <div className="emptyState">No receipts match this filter.</div>
            )}
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

function sourceLabel(source: ExplorerSearchSource) {
  if (source === "casper_gw_account") return { label: "Casper GW account receipts", tone: "signal" };
  if (source === "casper_gw_receipt") return { label: "Casper GW receipt", tone: "signal" };
  if (source === "external_account_proof") return { label: "External account proof", tone: "primary" };
  if (source === "external_casper_proof") return { label: "External Casper proof", tone: "primary" };
  if (source === "unconfigured") return { label: "Lookup not configured", tone: "warn" };
  return { label: "Not found", tone: "danger" };
}
