"use client";

import { Panel, Segmented } from "@/components/screen-primitives";
import { Chip, Field } from "@/components/ui";

export type ConsoleTarget = "hosted" | "custom";

interface DiscoveredTool {
  description?: string | null;
  name: string;
}

export function TestConsoleEndpointTargetPanel({
  activeEndpointUrl,
  apiMessage,
  busy,
  onDiscover,
  onEndpointInputChange,
  onTargetChange,
  target,
}: {
  activeEndpointUrl: string;
  apiMessage: string;
  busy: boolean;
  onDiscover: () => void;
  onEndpointInputChange: (value: string) => void;
  onTargetChange: (target: ConsoleTarget) => void;
  target: ConsoleTarget;
}) {
  return (
    <Panel title="Endpoint target" action={<Chip tone="signal">Testnet signer gate</Chip>}>
      <div className="stack">
        <Segmented<ConsoleTarget>
          options={[
            ["hosted", "My hosted endpoint"],
            ["custom", "Paste MCP/x402 URL"],
          ]}
          value={target}
          onChange={onTargetChange}
        />
        <Field label={target === "hosted" ? "hosted endpoint" : "mcp/x402 endpoint url"}>
          <input
            className="input"
            readOnly={target === "hosted"}
            onChange={(event) => onEndpointInputChange(event.target.value)}
            value={activeEndpointUrl}
          />
        </Field>
        <div className="notice">
          The selected wallet must match the configured Testnet signer until browser
          signing is implemented. Mismatches stop before payment.
        </div>
        <button className="primaryButton" disabled={busy} onClick={onDiscover} type="button">
          Discover endpoint tools
        </button>
        <div className="notice">{apiMessage}</div>
      </div>
    </Panel>
  );
}

export function TestConsoleDiscoveredToolsPanel({
  discovered,
  discoveredTools,
  hasApiTools,
  onToolSelect,
  selectedToolId,
}: {
  discovered: boolean;
  discoveredTools: DiscoveredTool[];
  hasApiTools: boolean;
  onToolSelect: (toolName: string) => void;
  selectedToolId: string;
}) {
  return (
    <Panel title="Discovered tools">
      {!discovered ? (
        <div className="emptyState">Discover tools before selecting inputs.</div>
      ) : (
        <div className="stack tight">
          {discoveredTools.length ? (
            discoveredTools.map((tool) => (
              <button
                className="toolRow"
                data-active={tool.name === selectedToolId}
                key={tool.name}
                onClick={() => onToolSelect(tool.name)}
                type="button"
              >
                <div>
                  <strong className="mono">{tool.name}</strong>
                  <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                    {tool.description ?? "Remote MCP tool"}
                  </div>
                </div>
                <Chip tone={hasApiTools ? "signal" : "neutral"}>{hasApiTools ? "discovered" : "fixture"}</Chip>
              </button>
            ))
          ) : (
            <div className="emptyState">No tools were returned by this endpoint.</div>
          )}
        </div>
      )}
    </Panel>
  );
}
