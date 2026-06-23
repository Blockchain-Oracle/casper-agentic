"use client";

import { useState } from "react";
import { Panel, Segmented } from "@/components/screen-primitives";
import { Chip, Field, KeyValueList } from "@/components/ui";
import { inputFieldsForTool } from "./console-schema";
import { TestConsoleTimeline } from "./test-console-timeline";
import { usePaidCallConsole } from "./use-paid-call-console";
import type { ConsolePhase, Receipt, Tool, WalletProfile } from "@/lib/types";

type ConsoleTarget = "hosted" | "custom";

export function TestConsoleScreen({
  endpointUrl,
  fixtureReceipt,
  onOpenReceipt,
  operatorToken,
  tools,
  wallets,
}: {
  endpointUrl: string;
  fixtureReceipt: Receipt;
  onOpenReceipt: (receipt: Receipt) => void;
  operatorToken: string;
  tools: Tool[];
  wallets: WalletProfile[];
}) {
  const [target, setTarget] = useState<ConsoleTarget>("hosted");
  const [phase, setPhase] = useState<ConsolePhase>("idle");
  const [endpointInput, setEndpointInput] = useState(endpointUrl);
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id ?? "");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? "");
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const { apiMessage, apiReceiptId, apiTools, busy, discover, run } = usePaidCallConsole(operatorToken);

  const activeEndpointUrl = target === "hosted" ? endpointUrl : endpointInput;
  const activeToolId = selectedToolId || tools[0]?.id || "";
  const activeWalletId = selectedWalletId || wallets[0]?.id || "";
  const discovered = phase !== "idle";
  const discoveredTools = apiTools.length
    ? apiTools
    : discovered
      ? []
      : tools.map((tool) => ({ description: tool.description, name: tool.id }));
  const selectedApiTool = discoveredTools.find((tool) => tool.name === activeToolId) ?? discoveredTools[0] ?? null;
  const selectedTool = tools.find((tool) => tool.id === activeToolId) ?? tools.find((tool) => tool.id === selectedApiTool?.name) ?? null;
  const selectedWallet = wallets.find((wallet) => wallet.id === activeWalletId) ?? wallets[0];
  const completed = phase === "complete";
  const inputFields = inputFieldsForTool(selectedApiTool);
  const runDisabled = busy || !selectedApiTool || !activeWalletId || !operatorToken;

  async function discoverEndpointTools() {
    const found = await discover(activeEndpointUrl);
    if (!found) return;
    const first = found[0] ?? null;
    setSelectedToolId(first?.name ?? "");
    setToolArgs(defaultArgs(first));
    setPhase("discovered");
  }

  async function runPaidCall() {
    if (!selectedApiTool || !activeWalletId) return;
    const args = Object.fromEntries(inputFields.map((field) => [field.name, toolArgs[field.name] ?? field.defaultValue]));
    if (await run({ args, endpointUrl: activeEndpointUrl, toolName: selectedApiTool.name, walletId: activeWalletId })) {
      setPhase("complete");
    }
  }

  function updateArg(name: string, value: string) {
    setToolArgs((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="grid two">
      <div className="stack">
        <Panel title="Endpoint target" action={<Chip tone="signal">Testnet signer gate</Chip>}>
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
                value={activeEndpointUrl}
              />
            </Field>
            <div className="notice">
              The selected wallet must match the configured Testnet signer until browser
              signing is implemented. Mismatches stop before payment.
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
              {discoveredTools.length ? (
                discoveredTools.map((tool) => (
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
                ))
              ) : (
                <div className="emptyState">No tools were returned by this endpoint.</div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <div className="stack">
        <Panel title="Tool input and wallet policy">
          {!discovered || !selectedApiTool ? (
            <div className="emptyState">Select a discovered tool to continue.</div>
          ) : (
            <div className="stack">
              <KeyValueList
                rows={[
                  { key: "selected tool", value: selectedApiTool.name, mono: true },
                  { key: "payment asset", value: "CEP-18 WCSPR", mono: true },
                  { key: "network", value: "casper:casper-test", mono: true },
                  {
                    key: "price",
                    value: selectedTool?.price ? `${selectedTool.price.toFixed(2)} WCSPR` : "server-configured WCSPR",
                    mono: true,
                  },
                ]}
              />
              {inputFields.length ? (
                <div className="formGrid">
                  {inputFields.map((field) => (
                    <Field key={field.name} label={field.required ? `${field.name} *` : field.name}>
                      {field.options.length ? (
                        <select
                          className="input"
                          onChange={(event) => updateArg(field.name, event.target.value)}
                          value={toolArgs[field.name] ?? field.defaultValue}
                        >
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input"
                          onChange={(event) => updateArg(field.name, event.target.value)}
                          value={toolArgs[field.name] ?? field.defaultValue}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              ) : (
                <div className="emptyState">No input required for this tool.</div>
              )}
              <Field label="wallet / policy">
                <select
                  className="input"
                  onChange={(event) => setSelectedWalletId(event.target.value)}
                  value={activeWalletId}
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.id} - {wallet.status}
                    </option>
                  ))}
                </select>
              </Field>
              <div className={selectedWallet?.funded ? "notice signal" : "notice"}>
                {activeWalletId
                  ? selectedWallet?.funded
                    ? "Policy pre-check can run before wallet signing."
                    : "Wallet is not ready; a real run must stop before signing/payment."
                  : "Select a real wallet profile before running a paid call."}
              </div>
              <button
                className="primaryButton"
                disabled={runDisabled}
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

function defaultArgs(tool: { inputSchema?: Record<string, unknown>; name: string } | null) {
  return Object.fromEntries(inputFieldsForTool(tool).map((field) => [field.name, field.defaultValue]));
}
