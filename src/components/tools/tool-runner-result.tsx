"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { ProofStamp } from "@/components/site/proof-stamp";
import { Button } from "@/components/ui/button";

const SETTLED = new Set(["settled", "raw_proof_unavailable"]);

export type ToolRunResult = {
  attemptId?: string;
  explorerUrl?: string;
  reason?: string;
  result?: unknown;
  status: string;
};

export function ToolRunnerResultPanel({
  onRunAgain,
  result,
}: {
  onRunAgain: () => void;
  result: ToolRunResult;
}) {
  const [pretty, setPretty] = useState(true);
  const settled = SETTLED.has(result.status);
  const free = result.status === "free";
  const hash = result.explorerUrl?.split("/deploy/")[1];
  // Unwrap the MCP payload once; decide JSON vs markdown/text so Formatted mode can
  // pretty-print JSON OR render markdown (tools return different shapes).
  const payload = useMemo(() => analyzePayload(result.result), [result.result]);
  const output = useMemo(() => formatOutput(result.result, pretty), [pretty, result.result]);
  const showMarkdown = pretty && !payload.isJson;

  async function copyResult() {
    await navigator.clipboard.writeText(formatOutput(result.result, true));
    toast.success("Result copied");
  }

  return (
    <div className="pb-2">
      <div className="text-center">
        {settled ? (
          <ProofStamp size={84} hash={hash} className="mx-auto" />
        ) : free ? (
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-settled/15 text-settled">
            <Check className="size-5" />
          </span>
        ) : (
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-signal/15 font-mono text-signal">x</span>
        )}
        <div className="mt-2 font-display text-base font-semibold text-ink">
          {free ? "Ran free" : settled ? statusLabel(result.status) : result.status === "blocked" ? "Blocked" : "Not settled"}
        </div>
        {result.reason ? <p className="mt-1 text-sm text-signal">{result.reason}</p> : null}
        {hash ? <p className="mt-1 break-all font-mono text-xs text-ink-3">{hash}</p> : null}
      </div>

      {result.result !== undefined ? (
        <div className="mt-4 rounded-md border border-hairline bg-well p-3 text-left">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Tool result</span>
            <div className="flex items-center gap-1">
              <Button type="button" size="xs" variant="ghost" onClick={() => setPretty((value) => !value)}>
                {pretty ? "Raw" : "Formatted"}
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={copyResult} className="gap-1">
                <Copy className="size-3" /> Copy
              </Button>
            </div>
          </div>
          {showMarkdown ? (
            <div className="markdown-body max-h-72 overflow-auto rounded-md border border-hairline bg-panel p-3 text-sm leading-relaxed text-ink-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{payload.text}</ReactMarkdown>
            </div>
          ) : (
            <pre className="max-h-72 overflow-auto rounded-md border border-hairline bg-panel p-3 font-mono text-[11px] leading-relaxed text-ink-2">
              {output}
            </pre>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {result.explorerUrl ? (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">cspr.live <ArrowUpRight className="size-3.5" /></a>
          </Button>
        ) : null}
        {result.attemptId ? (
          <Button asChild size="sm"><Link href={`/receipt/${result.attemptId}`}>Receipt</Link></Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onRunAgain}>Run again</Button>
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  return status === "raw_proof_unavailable" ? "Settled · proof indexing" : "Settled";
}

// MCP tool results wrap the real payload as a string in content[].text, so the raw
// object prints as an escaped blob. Unwrap that text, then pretty-print it as JSON
// when it parses (the common case), otherwise show it as-is (e.g. markdown/plain text).
function extractMcpText(value: unknown): string | null {
  if (value && typeof value === "object" && Array.isArray((value as { content?: unknown }).content)) {
    const parts = (value as { content: Array<{ text?: unknown }> }).content
      .map((part) => (typeof part?.text === "string" ? part.text : null))
      .filter((text): text is string => text !== null);
    if (parts.length) return parts.join("\n");
  }
  return null;
}

// Unwrap the payload and classify it: JSON (pretty-print) vs text/markdown (render).
function analyzePayload(value: unknown): { text: string; isJson: boolean } {
  const base = extractMcpText(value) ?? (typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2));
  try {
    JSON.parse(base);
    return { text: base, isJson: true };
  } catch {
    return { text: base, isJson: false };
  }
}

function formatOutput(value: unknown, pretty: boolean) {
  // Raw = the full tool response exactly as returned (the MCP envelope). Formatted =
  // the unwrapped payload, pretty-printed if JSON. This makes the toggle visibly change
  // even when the tool already returned pretty JSON inside content[].text.
  if (!pretty) {
    return typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2);
  }
  const base = extractMcpText(value) ?? (typeof value === "string" ? value : null);
  if (base !== null) {
    try {
      return JSON.stringify(JSON.parse(base), null, 2);
    } catch {
      return base;
    }
  }
  return JSON.stringify(value ?? null, null, 2);
}
