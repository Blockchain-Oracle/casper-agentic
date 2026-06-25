import { Panel } from "@/components/screen-primitives";
import { StatusChip } from "@/components/ui";
import type { ReceiptStatus } from "@/lib/types";
import { testConsoleTimelineRows } from "./test-console-timeline-model";

export function TestConsoleTimeline({
  apiReceiptId,
  completed,
  discovered,
  resultStatus,
}: {
  apiReceiptId: string | null;
  completed: boolean;
  discovered: boolean;
  resultStatus: ReceiptStatus | null;
}) {
  const rows = testConsoleTimelineRows({ discovered, receiptId: completed ? apiReceiptId : null, resultStatus });

  return (
    <Panel title="Result timeline" action={completed && resultStatus ? <StatusChip status={resultStatus} /> : undefined}>
      <div className="stack">
        {rows.map((row, index) => (
          <div className="timelineItem" key={row.label}>
            <span className={`timelineDot ${row.done ? "done" : ""}`}>
              {index + 1}
            </span>
            <div>
              <strong>{row.label}</strong>
              <div className="muted" style={{ marginTop: 3, fontSize: 13 }}>
                {row.note}
              </div>
            </div>
          </div>
        ))}
        {completed && apiReceiptId ? (
          <button
            className="secondaryButton"
            onClick={() => {
              window.location.href = `/explorer?receipt=${encodeURIComponent(apiReceiptId)}`;
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
