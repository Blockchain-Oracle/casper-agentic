"use client";

import { useState } from "react";
import { Panel } from "@/components/screen-primitives";
import { Field, KeyValueList } from "@/components/ui";
import { inputFieldsForTool } from "./console-schema";
import {
  TestConsoleDiscoveredToolsPanel,
  TestConsoleEndpointTargetPanel,
  type ConsoleTarget,
} from "./test-console-target-panels";
import { TestConsoleTimeline } from "./test-console-timeline";
import { TestConsoleWalletActions } from "./test-console-wallet-actions";
import { usePaidCallConsole } from "./use-paid-call-console";
import type { ConsolePhase, Tool, WalletProfile } from "@/lib/types";

export function TestConsoleScreen({ endpointUrl, operatorToken, tools, wallets }: {
  endpointUrl: string;
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
  const { apiMessage, apiReceiptId, apiReceiptStatus, apiTools, browserSigningState, busy, connectBrowserWallet, discover, run, runBrowser } =
    usePaidCallConsole(operatorToken);

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
  const browserRunDisabled = runDisabled || !browserSigningState.connected || selectedWallet?.signingMode !== "browser-wallet";

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
    setPhase("discovered");
    if (await run({ args, endpointUrl: activeEndpointUrl, toolName: selectedApiTool.name, walletId: activeWalletId })) {
      setPhase("complete");
    }
  }

  async function runBrowserPaidCall() {
    if (!selectedApiTool || !activeWalletId) return;
    const args = Object.fromEntries(inputFields.map((field) => [field.name, toolArgs[field.name] ?? field.defaultValue]));
    setPhase("discovered");
    if (await runBrowser({ args, endpointUrl: activeEndpointUrl, toolName: selectedApiTool.name, walletId: activeWalletId })) {
      setPhase("complete");
    }
  }

  function updateArg(name: string, value: string) {
    setToolArgs((current) => ({ ...current, [name]: value }));
  }

  return (
    <div className="grid two">
      <div className="stack">
        <TestConsoleEndpointTargetPanel
          activeEndpointUrl={activeEndpointUrl}
          apiMessage={apiMessage}
          busy={busy}
          onDiscover={discoverEndpointTools}
          onEndpointInputChange={setEndpointInput}
          onTargetChange={setTarget}
          target={target}
        />

        <TestConsoleDiscoveredToolsPanel
          discovered={discovered}
          discoveredTools={discoveredTools}
          hasApiTools={Boolean(apiTools.length)}
          onToolSelect={setSelectedToolId}
          selectedToolId={selectedToolId}
        />
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
              <TestConsoleWalletActions
                activeWalletId={activeWalletId}
                browserRunDisabled={browserRunDisabled}
                browserSigningState={browserSigningState}
                busy={busy}
                onConnectBrowser={connectBrowserWallet}
                onRunBrowser={runBrowserPaidCall}
                onRunSigner={runPaidCall}
                runDisabled={runDisabled}
                selectedWallet={selectedWallet}
              />
            </div>
          )}
        </Panel>

        <TestConsoleTimeline apiReceiptId={apiReceiptId} completed={completed} discovered={discovered} resultStatus={apiReceiptStatus} />
      </div>
    </div>
  );
}

function defaultArgs(tool: { inputSchema?: Record<string, unknown>; name: string } | null) {
  return Object.fromEntries(inputFieldsForTool(tool).map((field) => [field.name, field.defaultValue]));
}
