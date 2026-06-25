"use client";

import { useState } from "react";

import { runBrowserPaidCallFlow } from "@/lib/browser-paid-call-flow";
import { receiptStatuses, type ReceiptStatus } from "@/lib/types";
import type { CSPRClickBrowserConnection } from "./use-csprclick-browser-connection";

export interface ConsoleTool {
  description?: string;
  inputSchema?: Record<string, unknown>;
  name: string;
}

export interface PaidCallRunInput {
  args: Record<string, unknown>;
  endpointUrl: string;
  toolName: string;
  walletId: string;
}

export function usePaidCallConsole(operatorToken: string, browserConnection: CSPRClickBrowserConnection) {
  const [apiMessage, setApiMessage] = useState("Discovery and paid runs use the server API.");
  const [apiReceiptId, setApiReceiptId] = useState<string | null>(null);
  const [apiReceiptStatus, setApiReceiptStatus] = useState<ReceiptStatus | null>(null);
  const [apiTools, setApiTools] = useState<ConsoleTool[]>([]);
  const [busy, setBusy] = useState(false);

  function operatorHeaders() {
    const headers = new Headers({ "content-type": "application/json" });
    if (operatorToken) headers.set("x-casper-gw-operator-token", operatorToken);
    return headers;
  }

  async function discover(endpointUrl: string) {
    setBusy(true);
    setApiReceiptStatus(null);
    setApiMessage("Discovering endpoint tools...");
    try {
      const response = await fetch("/api/tools/discover", {
        body: JSON.stringify({ endpointUrl }),
        headers: operatorHeaders(),
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "tool_discovery_failed");
      const found = Array.isArray(body.tools) ? (body.tools as ConsoleTool[]) : [];
      setApiTools(found);
      setApiMessage(`Discovered ${found.length} tool${found.length === 1 ? "" : "s"} from endpoint.`);
      return found;
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "Tool discovery failed.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function run(input: PaidCallRunInput) {
    setBusy(true);
    setApiReceiptId(null);
    setApiReceiptStatus(null);
    setApiMessage("Running policy, x402 verify, settlement, and receipt persistence...");
    try {
      const response = await fetch("/api/paid-calls/run", {
        body: JSON.stringify(input),
        headers: operatorHeaders(),
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "paid_call_failed");
      const status = toReceiptStatus(body.status);
      setApiReceiptId(body.attemptId ?? null);
      setApiReceiptStatus(status);
      setApiMessage(`Paid-call result: ${body.status}`);
      return Boolean(status);
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "Paid call failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function runBrowser(input: PaidCallRunInput) {
    const { browserSigningState } = browserConnection;
    if (!browserSigningState.connected) {
      setApiMessage(browserSigningState.message);
      return false;
    }
    setBusy(true);
    setApiReceiptId(null);
    setApiReceiptStatus(null);
    setApiMessage("Running policy pre-check before CSPR.click approval...");
    try {
      const result = await runBrowserPaidCallFlow({ ...input, operatorToken });
      const status = toReceiptStatus(result.status);
      if (result.attemptId && status) {
        setApiReceiptId(result.attemptId);
      }
      setApiReceiptStatus(status);
      setApiMessage(result.message);
      return Boolean(status);
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "Browser signing paid call failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function connectBrowserWallet() {
    setApiMessage(browserConnection.connectBrowserWallet());
  }

  return {
    apiMessage,
    apiReceiptId,
    apiReceiptStatus,
    apiTools,
    browserSigningState: browserConnection.browserSigningState,
    busy,
    connectBrowserWallet,
    discover,
    run,
    runBrowser,
  };
}

function toReceiptStatus(value: unknown): ReceiptStatus | null {
  return typeof value === "string" && (receiptStatuses as readonly string[]).includes(value) ? (value as ReceiptStatus) : null;
}
