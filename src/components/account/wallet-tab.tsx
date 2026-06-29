"use client";

import { OwnerSessionPanel } from "@/components/account/owner-session-panel";
import { CopyButton } from "@/components/primitives/copy-button";
import { TokenIcon } from "@/components/primitives/token-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokenAmount } from "@/lib/format-amount";

type GatewayBalance = {
  accountHash: string;
  balanceUnavailable?: boolean;
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

function Stat({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="rounded-md border border-hairline bg-panel p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{label}</div>
      {loading ? (
        <Skeleton className="mt-1.5 h-4 w-20" />
      ) : (
        <div className="mt-1 font-mono text-sm text-ink tnum">{value}</div>
      )}
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
      <OwnerSessionPanel />

      <div className="rounded-md border border-hairline bg-well p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Connected wallet</div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">
            {short(publicKey)}
          </code>
          {publicKey ? <CopyButton value={publicKey} label="Wallet public key copied" /> : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          This is your CSPR.click wallet. Paid MCP calls use casper_ API keys; the gateway submits
          the on-chain x402 settlement on Casper Testnet.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Gateway WCSPR" loading={loading} value={!balance || balance.balanceUnavailable ? "—" : formatTokenAmount(balance.wcspr)} />
        <Stat label="Gateway CSPR gas" loading={loading} value={!balance || balance.balanceUnavailable ? "—" : formatTokenAmount(balance.csprGas)} />
        <Stat label="Default call price" loading={loading} value={!balance ? "—" : formatTokenAmount(balance.perCall)} />
      </div>

      <div
        className={`rounded-md border p-4 ${
          balance?.ready ? "border-settled/40 bg-settled/10" : balance?.balanceUnavailable ? "border-hairline bg-panel" : "border-signal/40 bg-signal/10"
        }`}
      >
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink">
          <TokenIcon size={16} />
          {loading
            ? "Checking gateway balance"
            : balance?.ready
              ? "Gateway payment account ready"
              : balance?.balanceUnavailable
                ? "Live gateway balance unavailable"
                : "Gateway needs WCSPR or CSPR gas"}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          This is the gateway&apos;s configured Casper Testnet payment account, not your connected wallet.
          It pays Casper x402 settlements after an API key authorizes the call.
        </p>
      </div>
    </div>
  );
}
