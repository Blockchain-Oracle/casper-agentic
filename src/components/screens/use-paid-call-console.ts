"use client";

import { useEffect, useState } from "react";

import { runBrowserPaidCallFlow } from "@/lib/browser-paid-call-flow";
import { getCSPRClickPublicConfig, prepareCSPRClickRuntime, type CSPRClickBrowserWindow } from "@/lib/csprclick-browser";
import { receiptStatuses, type ReceiptStatus } from "@/lib/types";

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
  const [apiReceiptStatus, setApiReceiptStatus] = useState<ReceiptStatus | null>(null);
  const [apiTools, setApiTools] = useState<ConsoleTool[]>([]);
  const [browserSigningReady, setBrowserSigningReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const runtime = prepareCSPRClickRuntime(window as unknown as CSPRClickBrowserWindow, getCSPRClickPublicConfig());
    const timer = window.setTimeout(() => {
      setBrowserSigningReady(runtime.status === "script_appended" || runtime.status === "script_present");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    if (!browserSigningReady) {
      setApiMessage("CSPR.click not enabled.");
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

  return { apiMessage, apiReceiptId, apiReceiptStatus, apiTools, browserSigningReady, busy, discover, run, runBrowser };
}

function toReceiptStatus(value: unknown): ReceiptStatus | null {
  return typeof value === "string" && (receiptStatuses as readonly string[]).includes(value) ? (value as ReceiptStatus) : null;
}
