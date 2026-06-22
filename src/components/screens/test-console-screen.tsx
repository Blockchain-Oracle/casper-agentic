"use client";

import { useState } from "react";
import { Panel, Segmented } from "@/components/screen-primitives";
import { Chip, Field, KeyValueList } from "@/components/ui";
import { TestConsoleTimeline } from "./test-console-timeline";
import { usePaidCallConsole } from "./use-paid-call-console";
import type { ConsolePhase, Receipt, Tool, WalletProfile } from "@/lib/types";

type ConsoleTarget = "hosted" | "custom";

export function TestConsoleScreen({
  endpointUrl,
  fixtureReceipt,
  onOpenReceipt,
  tools,
  wallets,
}: {
  endpointUrl: string;
  fixtureReceipt: Receipt;
  onOpenReceipt: (receipt: Receipt) => void;
  tools: Tool[];
  wallets: WalletProfile[];
}) {
  const [target, setTarget] = useState<ConsoleTarget>("hosted");
  const [phase, setPhase] = useState<ConsolePhase>("idle");
  const [endpointInput, setEndpointInput] = useState(endpointUrl);
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id ?? "");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? "");
  const { apiMessage, apiReceiptId, apiTools, busy, discover, run } = usePaidCallConsole();

  const selectedTool = tools.find((tool) => tool.id === selectedToolId) ?? tools[0];
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets[0];
  const discovered = phase !== "idle";
  const completed = phase === "complete";
  const toolNeedsInput = selectedTool?.id !== "list_pairs";
  const discoveredTools = apiTools.length ? apiTools : tools.map((tool) => ({ description: tool.description, name: tool.id }));

  async function discoverEndpointTools() {
    if (await discover(endpointInput, setSelectedToolId)) setPhase("discovered");
  }

  async function runPaidCall() {
    if (await run(selectedToolId)) setPhase("complete");
  }

  return (
    <div className="grid two">
      <div className="stack">
        <Panel title="Endpoint target" action={<Chip tone="warn">Design fixture</Chip>}>
          <div className="stack">
            <Segmented<ConsoleTarget>
              options={[
                ["hosted", "My hosted endpoint"],
                ["custom", "Paste MCP/x402 URL"],
              ]}
              value={target}
              onChange={setTarget}
            />
            <Field label={target === "hosted" ? "hosted endpoint" : "mcp/x402 endpoint url"}>
              <input
                className="input"
                readOnly={target === "hosted"}
                onChange={(event) => setEndpointInput(event.target.value)}
                value={target === "hosted" ? endpointUrl : endpointInput}
              />
            </Field>
            <div className="notice">
              This console models the endpoint-first flow. It does not claim a live Casper
              settlement until a real facilitator response and deploy hash are stored.
            </div>
            <button className="primaryButton" disabled={busy} onClick={discoverEndpointTools} type="button">
              Discover endpoint tools
            </button>
            <div className="notice">{apiMessage}</div>
          </div>
        </Panel>

        <Panel title="Discovered tools">
          {!discovered ? (
            <div className="emptyState">Discover tools before selecting inputs.</div>
          ) : (
            <div className="stack tight">
              {discoveredTools.map((tool) => (
                <button
                  className="toolRow"
                  data-active={tool.name === selectedToolId}
                  key={tool.name}
                  onClick={() => setSelectedToolId(tool.name)}
                  type="button"
                >
                  <div>
                    <strong className="mono">{tool.name}</strong>
                    <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                      {tool.description ?? "Remote MCP tool"}
                    </div>
                  </div>
                  <Chip tone={apiTools.length ? "signal" : "neutral"}>
                    {apiTools.length ? "discovered" : "fixture"}
                  </Chip>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="stack">
        <Panel title="Tool input and wallet policy">
          {!discovered || !selectedTool ? (
            <div className="emptyState">Select a discovered tool to continue.</div>
          ) : (
            <div className="stack">
              <KeyValueList
                rows={[
                  { key: "selected tool", value: selectedTool.id, mono: true },
                  { key: "payment asset", value: "CEP-18 WCSPR", mono: true },
                  { key: "network", value: "casper:casper-test", mono: true },
                  { key: "price", value: `${selectedTool.price?.toFixed(2) ?? "0.00"} WCSPR`, mono: true },
                ]}
              />
              {toolNeedsInput ? (
                <div className="formGrid">
                  <Field label="token in">
                    <input className="input" defaultValue="CSPR" />
                  </Field>
                  <Field label="token out">
                    <input className="input" defaultValue="WCSPR" />
                  </Field>
                  <Field label="amount">
                    <input className="input" defaultValue="10" />
                  </Field>
                  <Field label="quote type">
                    <select className="input" defaultValue="exact_in">
                      <option value="exact_in">exact_in</option>
                      <option value="exact_out">exact_out</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <div className="emptyState">No input required for this tool.</div>
              )}
              <Field label="wallet / policy">
                <select
                  className="input"
                  onChange={(event) => setSelectedWalletId(event.target.value)}
                  value={selectedWalletId}
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.id} - {wallet.status}
                    </option>
                  ))}
                </select>
              </Field>
              <div className={selectedWallet?.funded ? "notice signal" : "notice"}>
                {selectedWallet?.funded
                  ? "Policy pre-check can run before wallet signing."
                  : "Wallet is not ready; a real run must stop before signing/payment."}
              </div>
              <button
                className="primaryButton"
                disabled={!selectedTool.published}
                onClick={runPaidCall}
                type="button"
              >
                Run policy and paid call
              </button>
            </div>
          )}
        </Panel>

        <TestConsoleTimeline
          apiReceiptId={apiReceiptId}
          completed={completed}
          discovered={discovered}
          fixtureReceipt={fixtureReceipt}
          onOpenReceipt={onOpenReceipt}
        />
      </div>
    </div>
  );
}
