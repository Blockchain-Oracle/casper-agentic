import { Panel } from "@/components/screen-primitives";
import { StatusChip } from "@/components/ui";
import type { Receipt } from "@/lib/types";

export function TestConsoleTimeline({
  apiReceiptId,
  completed,
  discovered,
  fixtureReceipt,
  onOpenReceipt,
}: {
  apiReceiptId: string | null;
  completed: boolean;
  discovered: boolean;
  fixtureReceipt: Receipt;
  onOpenReceipt: (receipt: Receipt) => void;
}) {
  const rows = [
    ["Endpoint discovery", discovered ? "Tools discovered from endpoint metadata." : "Waiting for discovery."],
    ["Policy pre-check", completed ? "Allowed path reached x402." : "Runs before signing/payment."],
    ["x402 verify / settle", completed ? "Requires facilitator success for a deploy hash." : "Requires facilitator response."],
    ["Receipt", completed ? apiReceiptId ?? fixtureReceipt.id : "Created for every meaningful attempt."],
  ];

  return (
    <Panel title="Result timeline" action={completed ? <StatusChip status={fixtureReceipt.status} /> : undefined}>
      <div className="stack">
        {rows.map(([label, note], index) => (
          <div className="timelineItem" key={label}>
            <span className={`timelineDot ${completed || index === 0 && discovered ? "done" : ""}`}>
              {index + 1}
            </span>
            <div>
              <strong>{label}</strong>
              <div className="muted" style={{ marginTop: 3, fontSize: 13 }}>
                {note}
              </div>
            </div>
          </div>
        ))}
        {completed ? (
          <button
            className="secondaryButton"
            onClick={() => {
              if (apiReceiptId) window.location.href = `/explorer?receipt=${encodeURIComponent(apiReceiptId)}`;
              else onOpenReceipt(fixtureReceipt);
            }}
            type="button"
          >
            Open public receipt
          </button>
        ) : null}
      </div>
    </Panel>
  );
}
