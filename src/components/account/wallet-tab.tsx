"use client";

import { CopyButton } from "@/components/primitives/copy-button";
import { TokenIcon } from "@/components/primitives/token-icon";
import { formatTokenAmount } from "@/lib/format-amount";

type GatewayBalance = {
  accountHash: string;
  csprGas: string;
  payee: string;
  perCall: string;
  ready: boolean;
  wcspr: string;
};

function short(value?: string) {
  if (!value) return "Not connected";
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-hairline bg-panel p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-1 font-mono text-sm text-ink tnum">{value}</div>
    </div>
  );
}

export function WalletTab({
  balance,
  loading,
  publicKey,
}: {
  balance: GatewayBalance | null;
  loading: boolean;
  publicKey?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-hairline bg-well p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Connected wallet identity</div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">
            {short(publicKey)}
          </code>
          {publicKey ? <CopyButton value={publicKey} label="Wallet public key copied" /> : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          Wallet connect is identity only. Paid calls still use casper_ API keys and the gateway signer
          that settles WCSPR on Casper Testnet.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Gateway WCSPR" value={loading || !balance ? "..." : formatTokenAmount(balance.wcspr)} />
        <Stat label="CSPR gas" value={loading || !balance ? "..." : formatTokenAmount(balance.csprGas)} />
        <Stat label="Per paid call" value={loading || !balance ? "..." : formatTokenAmount(balance.perCall)} />
      </div>

      <div
        className={`rounded-md border p-4 ${
          balance?.ready ? "border-settled/40 bg-settled/10" : "border-signal/40 bg-signal/10"
        }`}
      >
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink">
          <TokenIcon size={16} />
          {loading ? "Checking gateway signer" : balance?.ready ? "Gateway ready to settle" : "Gateway needs WCSPR or gas"}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          These are live CSPR.cloud reads for the gateway signer. If readiness is low, fund the gateway
          before expecting paid calls to settle.
        </p>
      </div>
    </div>
  );
}
