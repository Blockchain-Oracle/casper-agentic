import type { KeyValueRow, ReceiptStatus } from "@/lib/types";
import { statusMeta } from "@/lib/fixtures";

export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`chip ${tone}`}>{children}</span>;
}

export function StatusChip({ status }: { status: ReceiptStatus }) {
  const meta = statusMeta[status];
  return <Chip tone={meta.tone}>{meta.label}</Chip>;
}

export function CopyButton({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <button className="copyButton" onClick={() => onCopy(value)} type="button">
      {copied ? "copied" : "copy"}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <div className="fieldLabel">{label}</div>
      {children}
    </label>
  );
}

export function KeyValueList({
  rows,
  onCopy,
  copiedKey,
}: {
  rows: KeyValueRow[];
  onCopy?: (value: string) => void;
  copiedKey?: string | null;
}) {
  return (
    <div>
      {rows.map((row) => (
        <div className="row" key={row.key}>
          <span className="fieldLabel" style={{ margin: 0 }}>
            {row.key}
          </span>
          <span style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
            <span
              className={row.mono ? "mono" : undefined}
              style={{
                color: row.tone ? `var(--${row.tone})` : "var(--ink)",
                textAlign: "right",
                overflowWrap: "anywhere",
              }}
            >
              {row.value}
            </span>
            {onCopy ? (
              <CopyButton
                value={row.value}
                copied={copiedKey === row.value}
                onCopy={onCopy}
              />
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
