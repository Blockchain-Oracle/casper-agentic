import { Panel } from "@/components/screen-primitives";
import { Chip, KeyValueList } from "@/components/ui";
import type { Screen, Tool } from "@/lib/types";

export function PricingScreen({
  onConfigure,
  onScreen,
  pricedCount,
  publishedCount,
  toolRows,
}: {
  onConfigure: (tool: Tool) => void;
  onScreen: (screen: Screen) => void;
  pricedCount: number;
  publishedCount: number;
  toolRows: Tool[];
}) {
  return (
    <div className="stack">
      <Panel
        title="Tools"
        action={
          <div className="buttonRow">
            <Chip tone="primary">{pricedCount} priced</Chip>
            <Chip tone="signal">{publishedCount} published</Chip>
          </div>
        }
      >
        {toolRows.length ? (
          <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Target</th>
                <th>Price</th>
                <th>Status</th>
                <th className="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {toolRows.map((tool) => (
                <tr key={tool.id}>
                  <td>
                    <strong className="mono">{tool.id}</strong>
                    <div className="muted" style={{ marginTop: 3 }}>
                      {tool.description}
                    </div>
                  </td>
                  <td className="mono">{tool.target}</td>
                  <td>{tool.price === null ? "not priced" : `${tool.price.toFixed(2)} WCSPR`}</td>
                  <td>
                    <div className="buttonRow">
                      <Chip tone={tool.enabled ? "signal" : "neutral"}>
                        {tool.status ?? (tool.enabled ? "selected" : "draft")}
                      </Chip>
                      <Chip tone={tool.published ? "signal" : "neutral"}>
                        {tool.published ? "published" : "draft"}
                      </Chip>
                    </div>
                  </td>
                  <td className="right">
                    <button className="secondaryButton" onClick={() => onConfigure(tool)} type="button">
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="emptyState">No provider tools loaded from Postgres yet.</div>
        )}
      </Panel>

      <div className="grid two">
        <Panel title="Casper x402 validation">
          <KeyValueList
            rows={[
              { key: "network", value: "casper:casper-test", mono: true, tone: "signal" },
              { key: "scheme", value: "exact", mono: true, tone: "signal" },
              { key: "asset", value: "CEP-18 WCSPR", mono: true, tone: "signal" },
              { key: "payee account", value: "server-side CASPER_PAYEE_ACCOUNT_HASH", mono: true, tone: "signal" },
              { key: "timeout", value: "900 seconds", mono: true, tone: "signal" },
            ]}
          />
        </Panel>
        <Panel title="Endpoint readiness">
          <div className="stack">
            <div className="notice signal">
              Endpoint/provider publication is separate from settlement proof. A published endpoint
              still needs a real paid call before any Casper proof can be claimed.
            </div>
            <button className="primaryButton" onClick={() => onScreen("endpoint")} type="button">
              Review hosted endpoint
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
