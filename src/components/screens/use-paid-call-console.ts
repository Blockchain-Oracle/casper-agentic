"use client";

import { useState } from "react";

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

export function usePaidCallConsole(operatorToken: string) {
  const [apiMessage, setApiMessage] = useState("Discovery and paid runs use the server API.");
  const [apiReceiptId, setApiReceiptId] = useState<string | null>(null);
  const [apiTools, setApiTools] = useState<ConsoleTool[]>([]);
  const [busy, setBusy] = useState(false);

  function operatorHeaders() {
    const headers = new Headers({ "content-type": "application/json" });
    if (operatorToken) headers.set("x-casper-gw-operator-token", operatorToken);
    return headers;
  }

  async function discover(endpointUrl: string) {
    setBusy(true);
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
    setApiMessage("Running policy, x402 verify, settlement, and receipt persistence...");
    try {
      const response = await fetch("/api/paid-calls/run", {
        body: JSON.stringify(input),
        headers: operatorHeaders(),
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "paid_call_failed");
      setApiReceiptId(body.attemptId ?? null);
      setApiMessage(`Paid-call result: ${body.status}`);
      return true;
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "Paid call failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { apiMessage, apiReceiptId, apiTools, busy, discover, run };
}
