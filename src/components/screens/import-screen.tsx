import { Panel, Segmented } from "@/components/screen-primitives";
import { Chip, Field } from "@/components/ui";
import type { Screen, SourcePhase, SourceType, Tool, UpstreamAuth } from "@/lib/types";

export function ImportScreen({
  errorMessage,
  loading,
  onDiscover,
  onLoadRecords,
  onOperatorToken,
  onScreen,
  onSourceName,
  onSourceType,
  onSourceUrl,
  onUpstreamAuth,
  operatorToken,
  sourceName,
  sourcePhase,
  sourceType,
  sourceUrl,
  statusMessage,
  toolRows,
  upstreamAuth,
}: {
  errorMessage: string | null;
  loading: boolean;
  onDiscover: () => void;
  onLoadRecords: () => void;
  onOperatorToken: (token: string) => void;
  onScreen: (screen: Screen) => void;
  onSourceName: (name: string) => void;
  onSourceType: (type: SourceType) => void;
  onSourceUrl: (url: string) => void;
  onUpstreamAuth: (auth: UpstreamAuth) => void;
  operatorToken: string;
  sourceName: string;
  sourcePhase: SourcePhase;
  sourceType: SourceType;
  sourceUrl: string;
  statusMessage: string;
  toolRows: Tool[];
  upstreamAuth: UpstreamAuth;
}) {
  const sourceLabel = sourceType === "mcp" ? "remote mcp url" : sourceType === "manual" ? "upstream route" : "openapi url";
  const sourceDefault =
    sourceType === "mcp"
      ? "https://mcp.example.com/sse"
      : sourceType === "manual"
        ? "GET https://api.example.com/v1/quote"
        : "https://api.example.com/openapi.json";

  return (
    <div className="grid two">
      <Panel title="Provider source">
        <div className="stack">
          <Segmented<SourceType>
            options={[
              ["openapi", "OpenAPI"],
              ["mcp", "Remote MCP"],
              ["manual", "Manual route"],
            ]}
            value={sourceType}
            onChange={onSourceType}
          />
          <div className="formGrid">
            <Field label="operator token">
              <input
                className="input"
                onChange={(event) => onOperatorToken(event.target.value)}
                placeholder="operator token"
                type="password"
                value={operatorToken}
              />
            </Field>
            <Field label="source name">
              <input
                className="input"
                onChange={(event) => onSourceName(event.target.value)}
                value={sourceName}
              />
            </Field>
          </div>
          <Field label="source description">
            <textarea
              className="input"
              defaultValue="CSPR market data tools exposed to agents through a paid Casper x402 gateway."
              rows={3}
            />
          </Field>
          <Field label={sourceLabel}>
            <input
              className="input"
              onChange={(event) => onSourceUrl(event.target.value)}
              value={sourceType === "mcp" ? sourceUrl : sourceDefault}
            />
          </Field>
          <div className="divider" />
          <div>
            <div className="fieldLabel">upstream authentication</div>
            <Segmented<UpstreamAuth>
              options={[
                ["none", "No auth"],
                ["static", "Static header"],
                ["apikey", "API key"],
                ["bearer", "Bearer"],
              ]}
              value={upstreamAuth}
              onChange={onUpstreamAuth}
            />
          </div>
          <div className="notice">
            Provider upstream credentials stay server-side only. They are not MCP client tokens,
            wallet keys, x402 payment payloads, receipt fields, endpoint metadata, or browser logs.
          </div>
          <div className={`notice ${errorMessage ? "danger" : "signal"}`}>
            {errorMessage ?? statusMessage}
          </div>
          <div className="buttonRow">
            <button
              className="primaryButton"
              disabled={loading || sourceType !== "mcp"}
              onClick={onDiscover}
              type="button"
            >
              {loading ? "Discovering..." : "Discover Remote MCP"}
            </button>
            <button className="secondaryButton" disabled={loading} onClick={onLoadRecords} type="button">
              Load provider records
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Tool discovery">
        {sourcePhase === "form" ? (
          <div className="emptyState">Run Remote MCP discovery to normalize operations into paid tool candidates.</div>
        ) : null}
        {sourcePhase === "loading" ? <div className="emptyState">Discovering provider operations...</div> : null}
        {sourcePhase === "error" ? (
          <div className="notice danger">
            {errorMessage ?? "Provider discovery failed. Credential values were not exposed to agent clients."}
          </div>
        ) : null}
        {sourcePhase === "success" ? (
          <div className="stack tight">
            {toolRows.map((tool) => (
              <div className="toolRow" key={tool.id}>
                <div>
                  <strong className="mono">{tool.id}</strong>
                  <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                    {tool.description} - {tool.target}
                  </div>
                </div>
                <Chip tone={tool.enabled ? "signal" : "neutral"}>{tool.enabled ? "enabled" : "disabled"}</Chip>
              </div>
            ))}
            <button className="primaryButton" onClick={() => onScreen("pricing")} type="button">
              Continue to pricing
            </button>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
