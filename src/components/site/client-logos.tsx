import { siClaude, siCursor, siGithub, siGooglegemini, siOllama, siPerplexity, siReplit } from "simple-icons";

import { BrandMark } from "@/components/site/proof-stamp";

// "Connect from any MCP client" showcase (MCPay-style logo strip). Monochrome —
// brand logos rendered in ink, not brand colors, to keep the Proof-Print restraint.
// Honest: a casper_ key authenticates over plain HTTP, so any of these (and any
// other MCP/HTTP agent) can pay per call through the gateway.
const CLIENTS = [siClaude, siCursor, siGooglegemini, siOllama, siPerplexity, siReplit, siGithub];

function Glyph({ icon }: { icon: { path: string; title: string } }) {
  return (
    <span className="flex items-center gap-2 text-ink-3 transition-colors hover:text-ink-2">
      <svg viewBox="0 0 24 24" className="size-[18px] fill-current" aria-hidden="true">
        <path d={icon.path} />
      </svg>
      <span className="font-mono text-xs">{icon.title}</span>
    </span>
  );
}

export function ClientLogos() {
  return (
    <section className="border-t border-hairline py-12">
      <div className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
        Connect your key from any MCP client or HTTP agent
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {CLIENTS.map((icon) => (
          <Glyph key={icon.title} icon={icon} />
        ))}
        <span className="font-mono text-xs text-ink-3">+ any HTTP agent</span>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-ink-3">
        <span>Built on</span>
        <span className="flex items-center gap-1.5 text-ink-2"><BrandMark size={13} /> Casper</span>
        <span className="text-ink-3">·</span>
        <span className="text-ink-2">x402</span>
        <span className="text-ink-3">·</span>
        <span className="text-ink-2">MCP</span>
        <span className="text-ink-3">·</span>
        <span className="text-ink-2">CSPR.cloud</span>
      </div>
    </section>
  );
}
