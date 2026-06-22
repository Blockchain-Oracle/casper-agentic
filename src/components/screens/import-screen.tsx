import { Panel, Segmented } from "@/components/screen-primitives";
import { Chip, Field } from "@/components/ui";
import type { Screen, SourcePhase, SourceType, Tool, UpstreamAuth } from "@/lib/types";

export function ImportScreen({
  onDiscover,
  onScreen,
  onSourceType,
  onUpstreamAuth,
  sourcePhase,
  sourceType,
  toolRows,
  upstreamAuth,
}: {
  onDiscover: (success: boolean) => void;
  onScreen: (screen: Screen) => void;
  onSourceType: (type: SourceType) => void;
  onUpstreamAuth: (auth: UpstreamAuth) => void;
  sourcePhase: SourcePhase;
  sourceType: SourceType;
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
            <Field label="source name">
              <input className="input" defaultValue="CSPR Trade Quote" />
            </Field>
            <Field label="owner / workspace">
              <input className="input" defaultValue="Make Software Labs" />
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
            <input className="input" defaultValue={sourceDefault} />
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
          <div className="buttonRow">
            <button className="primaryButton" onClick={() => onDiscover(true)} type="button">
              Test upstream connection
            </button>
            <button className="secondaryButton" onClick={() => onDiscover(false)} type="button">
              Show 401 error
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Tool discovery">
        {sourcePhase === "form" ? (
          <div className="emptyState">Run the source test to normalize operations into paid tool candidates.</div>
        ) : null}
        {sourcePhase === "loading" ? <div className="emptyState">Discovering provider operations...</div> : null}
        {sourcePhase === "error" ? (
          <div className="notice danger">
            Upstream returned 401. The gateway stores this as a provider-source error and never
            exposes the credential value to agent clients.
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
