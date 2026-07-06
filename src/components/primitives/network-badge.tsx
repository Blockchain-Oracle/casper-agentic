import { getCasperNetwork } from "@/lib/casper-networks";

/** Small Testnet/Mainnet pill. Mainnet gets the brand accent; Testnet stays muted. */
export function NetworkBadge({ network, className = "" }: { network?: string; className?: string }) {
  const net = getCasperNetwork(network);
  const tone = net.isTestnet
    ? "border-hairline bg-well text-ink-3"
    : "border-casper/40 bg-casper/10 text-casper";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${tone} ${className}`}
      title={net.id}
    >
      {net.label}
    </span>
  );
}
