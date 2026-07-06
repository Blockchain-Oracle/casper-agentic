"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { NETWORK_ORDER, CASPER_NETWORKS } from "@/lib/casper-networks";
import { cn } from "@/lib/utils";

// Segmented All / Testnet / Mainnet control. SSR-friendly: it drives a ?network=
// query param the server page reads, so the filtered view is shareable by URL.
export function NetworkFilter({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("network");

  const options = [{ id: null, label: "All" }, ...NETWORK_ORDER.map((id) => ({ id, label: CASPER_NETWORKS[id].label }))];

  function hrefFor(id: string | null) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("network", id);
    else next.delete("network");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className={cn("inline-flex items-center rounded-md border border-hairline bg-well p-0.5", className)}>
      {options.map((option) => {
        const selected = (option.id ?? null) === (active ?? null);
        return (
          <Link
            key={option.label}
            href={hrefFor(option.id)}
            scroll={false}
            className={cn(
              "rounded-[5px] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
              selected ? "bg-panel text-ink shadow-sm" : "text-ink-3 hover:text-ink",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
