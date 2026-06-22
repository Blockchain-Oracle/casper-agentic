import { Panel, TabButton, TrustBoundaryGrid } from "@/components/screen-primitives";
import { Chip, KeyValueList } from "@/components/ui";
import { clientConfig, endpointUrl, type ConfigTab } from "@/lib/client-config";
import type { Tool } from "@/lib/types";

export function EndpointScreen({
  configTab,
  copied,
  onConfigTab,
  onCopy,
  publishedTools,
}: {
  configTab: ConfigTab;
  copied: string | null;
  onConfigTab: (tab: ConfigTab) => void;
  onCopy: (value: string) => void;
  publishedTools: Tool[];
}) {
  const code = clientConfig(configTab);

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
              { key: "client auth", value: "Scoped bearer token MVP; OAuth 2.1 target" },
              { key: "wallet auth", value: "separate x402 payment payload" },
            ]}
            copiedKey={copied}
            onCopy={onCopy}
          />
          <div className="notice">
            Client access tokens authenticate MCP clients only. They are not provider upstream
            credentials and cannot authorize wallet spending.
          </div>
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
              <Chip tone="signal">{tool.price?.toFixed(2)} TUSDC</Chip>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
