import { Panel, TabButton, TrustBoundaryGrid } from "@/components/screen-primitives";
import { Chip, KeyValueList } from "@/components/ui";
import { clientConfig, type ConfigTab } from "@/lib/client-config";
import type { Tool } from "@/lib/types";

export function EndpointScreen({
  clientToken,
  configTab,
  copied,
  discoveryUrl,
  endpointToolCount,
  endpointUrl,
  loading,
  onConfigTab,
  onCopy,
  onCreateAccess,
  publishedTools,
}: {
  clientToken: string | null;
  configTab: ConfigTab;
  copied: string | null;
  discoveryUrl: string | null;
  endpointToolCount: number;
  endpointUrl: string;
  loading: boolean;
  onConfigTab: (tab: ConfigTab) => void;
  onCopy: (value: string) => void;
  onCreateAccess: () => void;
  publishedTools: Tool[];
}) {
  const code = clientConfig(configTab, { clientToken, endpointUrl });

  return (
    <div className="stack">
      <Panel
        title="Hosted endpoint"
        action={
          <div className="buttonRow">
            <Chip tone="signal">Published</Chip>
            <Chip tone="signal">Casper Testnet</Chip>
            <Chip tone="primary">MCP + x402</Chip>
          </div>
        }
      >
        <div className="stack">
          <KeyValueList
            rows={[
              { key: "hosted url", value: endpointUrl, mono: true },
              {
                key: "client auth",
                value: clientToken ? "scoped bearer token generated" : "generate scoped bearer token",
                tone: clientToken ? "signal" : "warn",
              },
              { key: "transport", value: "Streamable HTTP / JSON-RPC" },
              { key: "payment auth", value: "PAYMENT-SIGNATURE after x402 challenge" },
              { key: "discovery", value: discoveryUrl ?? "authorized manifest after client access", mono: Boolean(discoveryUrl) },
              { key: "endpoint tools", value: `${endpointToolCount || publishedTools.length} published` },
            ]}
            copiedKey={copied}
            onCopy={onCopy}
          />
          <div className="notice">
            Client access tokens authenticate MCP clients only. They are not provider upstream
            credentials and cannot authorize wallet spending. x402 payment payloads are sent
            separately after the endpoint returns a 402 challenge.
          </div>
          <button
            className="primaryButton"
            disabled={loading || !publishedTools.length}
            onClick={onCreateAccess}
            type="button"
          >
            {loading ? "Generating..." : "Generate client access"}
          </button>
        </div>
      </Panel>

      <Panel title="Separated auth surfaces">
        <TrustBoundaryGrid />
      </Panel>

      <div className="grid two">
        <Panel title="Client configuration">
          <div className="codeTabs">
            <TabButton active={configTab === "cursor"} onClick={() => onConfigTab("cursor")}>
              Cursor
            </TabButton>
            <TabButton active={configTab === "claude"} onClick={() => onConfigTab("claude")}>
              Claude Desktop
            </TabButton>
            <TabButton active={configTab === "curl"} onClick={() => onConfigTab("curl")}>
              Custom / curl
            </TabButton>
          </div>
          <pre className="codeBlock">{code}</pre>
          <div className="buttonRow" style={{ marginTop: 12 }}>
            <button className="secondaryButton" onClick={() => onCopy(code)} type="button">
              {copied === code ? "Copied config" : "Copy config"}
            </button>
            <button className="secondaryButton" onClick={() => onCopy(endpointUrl)} type="button">
              {copied === endpointUrl ? "Copied URL" : "Copy URL"}
            </button>
          </div>
        </Panel>
        <Panel title="Tools on endpoint">
          {publishedTools.map((tool) => (
            <div className="toolRow" key={tool.id}>
              <div>
                <strong className="mono">{tool.id}</strong>
                <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                  {tool.description}
                </div>
              </div>
              <Chip tone="signal">{tool.price === null ? "priced" : `${tool.price.toFixed(2)} WCSPR`}</Chip>
            </div>
          ))}
          {!publishedTools.length ? <div className="emptyState">No published tools available yet.</div> : null}
        </Panel>
      </div>
    </div>
  );
}
