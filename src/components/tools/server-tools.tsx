"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, KeyRound, Loader2, Play, Wallet } from "lucide-react";
import { toast } from "sonner";

import { ExistingKeyDropdown, KeySelectorSkeleton, PaymentMethodMenu } from "@/components/tools/payment-key-selector";
import { SchemaForm } from "@/components/tools/schema-form";
import { ToolRunnerResultPanel, type ToolRunResult } from "@/components/tools/tool-runner-result";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokenAmount } from "@/lib/format-amount";
import { createApiKeyReq, getGatewayBalance, listApiKeys, runPaidCall, type ApiKeyView } from "@/lib/gateway-api";
import { rememberApiKeyToken } from "@/lib/browser-api-key-tokens";

export interface ServerTool {
  id: string;
  name: string;
  description: string | null;
  inputSchema: unknown;
  price: { amount: string; asset?: string; network?: string; payTo?: string } | null;
}

type GatewayBalance = Awaited<ReturnType<typeof getGatewayBalance>>;

/** Searchable, expandable tools list for a server detail — modelled on MCPay's tools accordion. */
export function ServerTools({ endpointUrl, tools }: { endpointUrl: string; tools: ServerTool[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
  }, [query, tools]);

  return (
    <div>
      <Input placeholder="Search tools" value={query} onChange={(e) => setQuery(e.target.value)} className="mb-3" />
      <Accordion type="single" collapsible className="overflow-hidden rounded-lg border border-hairline bg-panel">
        {filtered.map((tool) => (
          <AccordionItem key={tool.id} value={tool.id} className="border-hairline px-4 last:border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-mono text-sm text-ink">{tool.name}</span>
                {tool.price ? (
                  <span className="rounded-sm border border-hairline px-2 py-0.5 font-mono text-xs text-ink tnum">
                    {formatTokenAmount(tool.price.amount)} WCSPR
                  </span>
                ) : (
                  <span className="rounded-sm border border-settled/40 px-2 py-0.5 font-mono text-xs text-settled">
                    Free
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ToolRunner tool={tool} endpointUrl={endpointUrl} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function ToolRunner({ tool, endpointUrl }: { tool: ServerTool; endpointUrl: string }) {
  const [args, setArgs] = useState<Record<string, unknown>>({});
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<ToolRunResult | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [gatewayBalance, setGatewayBalance] = useState<GatewayBalance | null>(null);
  const [gatewayBalanceError, setGatewayBalanceError] = useState("");
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"api-key" | "wallet">("api-key");
  const paid = Boolean(tool.price);
  const activeKeys = useMemo(
    () => keys.filter((key) => !key.revoked && (!key.scope.allowedTools?.length || key.scope.allowedTools.includes(tool.name))),
    [keys, tool.name],
  );
  const selectedKey = activeKeys.find((key) => key.id === selectedKeyId) ?? activeKeys[0];
  const selectedKeyTooLow = paid && selectedKey ? BigInt(selectedKey.available ?? "0") < BigInt(tool.price?.amount ?? "0") : false;
  const selectedBalanceCanBlock = paid && paymentMethod === "api-key" && selectedKeyTooLow;
  const gatewayPaymentNotReady = paid && gatewayBalance ? !gatewayBalance.ready && !gatewayBalance.balanceUnavailable : false;

  useEffect(() => {
    void listApiKeys()
      .then((res) => {
        setKeys(res.keys);
        const firstUsable = res.keys.find((key) => !key.revoked && (!key.scope.allowedTools?.length || key.scope.allowedTools.includes(tool.name)));
        setSelectedKeyId((current) => current || firstUsable?.id || "");
      })
      .catch(() => setKeys([]))
      .finally(() => setLoadingKeys(false));
  }, [tool.name]);

  useEffect(() => {
    if (!paid) return;
    let alive = true;
    void getGatewayBalance()
      .then((balance) => {
        if (alive) setGatewayBalance(balance);
      })
      .catch((error) => {
        if (alive) setGatewayBalanceError(error instanceof Error ? error.message : "could not load gateway payment readiness");
      });
    return () => {
      alive = false;
    };
  }, [paid]);

  async function run() {
    if (paid && paymentMethod === "wallet") return toast.error("Direct wallet x402 signing is not available for Casper settlement yet.");
    if (paid && !selectedKey) return toast.error("Choose or create an API key before running a paid tool.");
    if (selectedBalanceCanBlock) return toast.error("Selected key does not have enough WCSPR for this call.");
    if (gatewayPaymentNotReady) return toast.error("The gateway's settlement wallet isn't funded yet (separate from your key) — operator must fund it.");
    setPhase("running");
    try {
      setResult(await runPaidCall({ apiKeyId: paid ? selectedKey?.id : undefined, args, client: "server-console", endpointUrl, toolName: tool.name }));
    } catch (error) {
      setResult({ reason: error instanceof Error ? error.message : "request failed", status: "error" });
    }
    setPhase("done");
  }

  async function createRunKey() {
    setCreatingKey(true);
    try {
      const response = await createApiKeyReq({ allowedTools: [tool.name], name: `${tool.name} runner` });
      rememberApiKeyToken(response.key.id, response.token);
      setSelectedKeyId(response.key.id);
      setKeys((current) => [response.key, ...current]);
      toast.success("Key created and selected. Fund it before paid calls will settle.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create key");
    } finally {
      setCreatingKey(false);
    }
  }

  function copy(value: string, label: string) {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  if (phase === "done" && result) {
    return (
      <ToolRunnerResultPanel result={result} onRunAgain={() => { setPhase("idle"); setResult(null); }} />
    );
  }

  return (
    <div className="pb-2">
      {tool.description ? <p className="mb-3 text-sm leading-relaxed text-ink-2">{tool.description}</p> : null}
      <SchemaForm schema={tool.inputSchema} values={args} onChange={setArgs} />

      <div className="mt-4 rounded-md border border-hairline bg-well p-3">
        {tool.price ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <PaymentDatum label="Amount" value={`${formatTokenAmount(tool.price.amount)} WCSPR`} />
              <PaymentDatum label="Network" value={tool.price.network ?? "casper:casper-test"} />
              <PaymentDatum label="Paid to" value={short(tool.price.payTo)} copyValue={tool.price.payTo} onCopy={copy} />
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-hairline bg-panel p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Payment method</div>
                  <p className="mt-1 text-sm text-ink-2">
                    Use a funded agent key. Direct wallet signing is shown as a future path until Casper x402 browser settlement is live.
                  </p>
                </div>
                <PaymentMethodMenu value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {paymentMethod === "wallet" ? (
                <div className="flex items-start gap-2 rounded-md border border-hairline bg-well p-3 text-sm text-ink-2">
                  <Wallet className="mt-0.5 size-4 shrink-0 text-casper" />
                  Wallet-direct pay will connect through CSPR.click once browser-signed Casper x402 settlement is accepted by the provider.
                </div>
              ) : loadingKeys ? (
                <KeySelectorSkeleton />
              ) : activeKeys.length ? (
                <div className="max-w-xl">
                  <ExistingKeyDropdown
                    keys={activeKeys}
                    selectedKey={selectedKey}
                    amount={tool.price.amount}
                    onCreate={createRunKey}
                    onSelect={setSelectedKeyId}
                    creating={creatingKey}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-md border border-dashed border-hairline bg-well p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-ink">No usable key for this tool</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-3">Create one key, fund it, then reuse it here and in your MCP client.</p>
                  </div>
                  <Button type="button" onClick={createRunKey} disabled={creatingKey} className="gap-2 sm:min-w-32">
                    {creatingKey ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Create key
                  </Button>
                </div>
              )}
            </div>

            {selectedBalanceCanBlock ? (
              <div className="flex items-start gap-2 rounded-md border border-signal/40 bg-signal/10 p-3 text-sm text-signal">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                This call needs {formatTokenAmount(tool.price.amount)} WCSPR. The selected saved key has {formatTokenAmount(selectedKey?.available ?? "0")} WCSPR.
                {" "}Fund it before using this token.
              </div>
            ) : null}
            {gatewayPaymentNotReady ? (
              <div className="flex items-start gap-2 rounded-md border border-signal/40 bg-signal/10 p-3 text-sm text-signal">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                The gateway&apos;s own settlement wallet isn&apos;t funded yet — separate from your API key, it
                needs WCSPR + CSPR gas to submit the on-chain payment. (Operator action, not yours.)
              </div>
            ) : gatewayBalance?.ready ? (
              <div className="rounded-md border border-settled/40 bg-settled/10 p-3 text-sm text-settled">
                Gateway settlement wallet is funded and ready to settle this paid call.
              </div>
            ) : gatewayBalance?.balanceUnavailable ? (
              <div className="rounded-md border border-hairline bg-panel p-3 text-sm text-ink-3">
                Live gateway balance is temporarily unavailable. The deposit address is still available, and settlement will be checked when a paid call runs.
              </div>
            ) : gatewayBalanceError ? (
              <div className="rounded-md border border-hairline bg-panel p-3 text-sm text-ink-3">
                Live gateway balance is temporarily unavailable.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-settled">Free tool</div>
              <p className="mt-1 text-sm text-ink-2">No x402 payment or API key is required for this call.</p>
            </div>
            <span className="rounded-sm border border-settled/40 px-2 py-1 font-mono text-xs text-settled">0 WCSPR</span>
          </div>
        )}
      </div>

      <Button onClick={run} disabled={phase === "running" || (paid && (paymentMethod === "wallet" || !selectedKey || selectedBalanceCanBlock || gatewayPaymentNotReady))} className="mt-4 w-full gap-2">
        {phase === "running" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        {phase === "running" ? "Signing & settling on Casper…" : tool.price ? `Pay & run · ${formatTokenAmount(tool.price.amount)} WCSPR` : "Run free"}
      </Button>
    </div>
  );
}

function short(value?: string) {
  if (!value) return "n/a";
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

function PaymentDatum({
  copyValue,
  label,
  onCopy,
  value,
}: {
  copyValue?: string;
  label: string;
  onCopy?: (value: string, label: string) => void;
  value: string;
}) {
  return (
    <div className="rounded-md border border-hairline bg-panel p-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="min-w-0 truncate font-mono text-xs text-ink">{value}</span>
        {copyValue && onCopy ? (
          <button type="button" onClick={() => onCopy(copyValue, label)} className="shrink-0 text-ink-3 hover:text-ink" aria-label={`Copy ${label}`}>
            <Copy className="size-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
