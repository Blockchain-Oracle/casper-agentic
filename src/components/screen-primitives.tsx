import { KeyValueList } from "@/components/ui";
import type { KeyValueRow } from "@/lib/types";

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">{title}</div>
        {action}
      </div>
      <div className="panelBody">{children}</div>
    </section>
  );
}

export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="pillButton" data-active={active} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map(([id, label]) => (
        <button data-active={value === id} key={id} onClick={() => onChange(id)} type="button">
          {label}
        </button>
      ))}
    </div>
  );
}

export function TrustBoundaryGrid() {
  return (
    <div className="boundaryGrid">
      <div className="boundaryBox">
        <span className="boundaryIcon">API</span>
        <strong>Provider upstream credentials</strong>
        <span className="muted" style={{ fontSize: 13 }}>
          Server-side vault references for source APIs. Never returned to clients or receipts.
        </span>
      </div>
      <div className="boundaryBox">
        <span className="boundaryIcon">MCP</span>
        <strong>MCP client access auth</strong>
        <span className="muted" style={{ fontSize: 13 }}>
          Scoped bearer-token MVP with OAuth 2.1 architecture preserved.
        </span>
      </div>
      <div className="boundaryBox">
        <span className="boundaryIcon">402</span>
        <strong>x402 wallet/payment auth</strong>
        <span className="muted" style={{ fontSize: 13 }}>
          Casper payment payload after policy allows a call. Separate from client access.
        </span>
      </div>
    </div>
  );
}

export function ProofPanel({
  title,
  note,
  rows,
}: {
  title: string;
  note?: string;
  rows: KeyValueRow[];
}) {
  return (
    <section className="panel" style={{ boxShadow: "none" }}>
      <div className="panelHeader">
        <div className="panelTitle">{title}</div>
      </div>
      <div className="panelBody">
        {rows.length > 0 ? (
          <KeyValueList rows={rows} />
        ) : (
          <div className="emptyState">No Casper proof for this outcome.</div>
        )}
        {note ? (
          <div className="notice" style={{ marginTop: 12 }}>
            {note}
          </div>
        ) : null}
      </div>
    </section>
  );
}
