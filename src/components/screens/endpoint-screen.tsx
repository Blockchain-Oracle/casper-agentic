import { Panel, TabButton, TrustBoundaryGrid } from "@/components/screen-primitives";
import { Chip, Field, KeyValueList } from "@/components/ui";
import { clientConfig, type ConfigTab } from "@/lib/client-config";
import type { Tool, WalletProfile } from "@/lib/types";

export function EndpointScreen({
  accessWalletId,
  clientToken,
  configTab,
  copied,
  discoveryUrl,
  endpointToolCount,
  endpointUrl,
  loading,
  onAccessWalletChange,
  onConfigTab,
  onCopy,
  onCreateAccess,
  publishedTools,
  wallets,
}: {
  accessWalletId: string;
  clientToken: string | null;
  configTab: ConfigTab;
  copied: string | null;
  discoveryUrl: string | null;
  endpointToolCount: number;
  endpointUrl: string;
  loading: boolean;
  onAccessWalletChange: (walletId: string) => void;
  onConfigTab: (tab: ConfigTab) => void;
  onCopy: (value: string) => void;
  onCreateAccess: () => void;
  publishedTools: Tool[];
  wallets: WalletProfile[];
}) {
  const code = clientConfig(configTab, { clientToken, endpointUrl });
  const serverSignable = wallets.filter((wallet) => wallet.signingMode === "hosted" || wallet.signingMode === "test-signer");

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
            separately after the endpoint returns a 402 challenge — unless the token is bound to a
            hosted wallet below, in which case the Gateway server-signs under that wallet&apos;s policy.
          </div>
          <Field label="Autonomous server-signing (optional): bind a hosted wallet">
            <select
              className="input"
              onChange={(event) => onAccessWalletChange(event.target.value)}
              value={accessWalletId}
            >
              <option value="">No wallet — client config token (the caller signs)</option>
              {serverSignable.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.id} · {wallet.signingMode}
                </option>
              ))}
            </select>
          </Field>
          <button
            className="primaryButton"
            disabled={loading || !publishedTools.length}
            onClick={onCreateAccess}
            type="button"
          >
            {loading ? "Generating..." : accessWalletId ? "Generate autonomous agent token" : "Generate client access"}
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
