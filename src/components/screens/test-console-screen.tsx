"use client";

import { useState } from "react";
import { Panel } from "@/components/screen-primitives";
import { Field, KeyValueList } from "@/components/ui";
import { inputFieldsForTool } from "./console-schema";
import { TestConsoleApproveModal, type ApproveMethod } from "./test-console-approve-modal";
import { TestConsoleInputFields } from "./test-console-input-fields";
import {
  TestConsoleDiscoveredToolsPanel,
  TestConsoleEndpointTargetPanel,
  type ConsoleTarget,
} from "./test-console-target-panels";
import { isBrowserApprovalRunDisabled } from "./test-console-browser-gate";
import { TestConsoleTimeline } from "./test-console-timeline";
import { TestConsoleWalletActions } from "./test-console-wallet-actions";
import { usePaidCallConsole } from "./use-paid-call-console";
import type { CSPRClickBrowserConnection } from "./use-csprclick-browser-connection";
import type { ConsolePhase, Tool, WalletProfile } from "@/lib/types";

export function TestConsoleScreen({ browserConnection, endpointUrl, operatorToken, sourceId, tools, wallets }: {
  browserConnection: CSPRClickBrowserConnection;
  endpointUrl: string;
  operatorToken: string;
  sourceId?: string;
  tools: Tool[];
  wallets: WalletProfile[];
}) {
  const [target, setTarget] = useState<ConsoleTarget>("hosted");
  const [phase, setPhase] = useState<ConsolePhase>("idle");
  const [endpointInput, setEndpointInput] = useState(endpointUrl);
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id ?? "");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? "");
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<ApproveMethod>(null);
  const [discovering, setDiscovering] = useState(false);
  const { apiMessage, apiReceiptId, apiReceiptStatus, apiTools, browserSigningState, busy, connectBrowserWallet, discover, runAgentWallet, runBrowser } =
    usePaidCallConsole(operatorToken, browserConnection);

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
  const canPayAgentWallet = target === "hosted" && Boolean(sourceId);
  const priceLabel = selectedTool?.price ? `${selectedTool.price.toFixed(2)} WCSPR` : "server-configured WCSPR";
  const browserRunDisabled = isBrowserApprovalRunDisabled({
    baseRunDisabled: runDisabled,
    browserSigningState,
    selectedWallet,
  });

  async function discoverEndpointTools() {
    setDiscovering(true);
    const found = await discover(activeEndpointUrl);
    setDiscovering(false);
    if (!found) return;
    const first = found[0] ?? null;
    setSelectedToolId(first?.name ?? "");
    setToolArgs(defaultArgs(first));
    setPhase("discovered");
  }

  async function payWithAgentWallet() {
    if (!selectedApiTool || !activeWalletId || !sourceId) return;
    const args = Object.fromEntries(inputFields.map((field) => [field.name, toolArgs[field.name] ?? field.defaultValue]));
    setPhase("discovered");
    if (await runAgentWallet({ args, sourceId, toolName: selectedApiTool.name, walletId: activeWalletId })) {
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

  async function confirmAndRun() {
    if (confirm === "agent-wallet") await payWithAgentWallet();
    else if (confirm === "browser") await runBrowserPaidCall();
    setConfirm(null);
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
          loading={discovering}
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
                  { key: "price", value: priceLabel, mono: true },
                ]}
              />
              <TestConsoleInputFields inputFields={inputFields} toolArgs={toolArgs} updateArg={updateArg} />
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
                canPayAgentWallet={canPayAgentWallet}
                onConnectBrowser={connectBrowserWallet}
                onPayAgentWallet={() => setConfirm("agent-wallet")}
                onRunBrowser={() => setConfirm("browser")}
                runDisabled={runDisabled}
                selectedWallet={selectedWallet}
              />
            </div>
          )}
        </Panel>

        <TestConsoleTimeline apiReceiptId={apiReceiptId} completed={completed} discovered={discovered} resultStatus={apiReceiptStatus} />
      </div>

      <TestConsoleApproveModal
        busy={busy}
        method={confirm}
        onApprove={confirmAndRun}
        onCancel={() => setConfirm(null)}
        priceLabel={priceLabel}
        toolName={selectedApiTool?.name ?? "—"}
        walletId={activeWalletId}
      />
    </div>
  );
}

function defaultArgs(tool: { inputSchema?: Record<string, unknown>; name: string } | null) {
  return Object.fromEntries(inputFieldsForTool(tool).map((field) => [field.name, field.defaultValue]));
}
