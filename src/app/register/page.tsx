import { RegisterFlow } from "@/components/register/register-flow";
import { SiteNav } from "@/components/site/site-nav";

export const metadata = { title: "Register a tool — Casper GW" };

export default function RegisterPage() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Register a tool</h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-2">
          Point the gateway at an MCP endpoint. It discovers the tools; you price each one in WCSPR
          and publish a paid x402 endpoint that agents can call with an API key.
        </p>
        <div className="mt-8">
          <RegisterFlow />
        </div>
      </main>
    </div>
  );
}
