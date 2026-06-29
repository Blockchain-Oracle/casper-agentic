"use client";

import { useMemo, useState } from "react";
import { Loader2, Send, Wallet } from "lucide-react";
import { toast } from "sonner";

import type { SendWcsprTransferInput, SendWcsprTransferResult } from "@/components/csprclick/csprclick-provider";
import { FundKeyDropdown } from "@/components/account/fund-key-dropdown";
import { CopyButton } from "@/components/primitives/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokenAmount, parseTokenToMotes } from "@/lib/format-amount";
import { claimDepositReq, type ApiKeyView } from "@/lib/gateway-api";

type GatewayBalance = {
  asset: string;
  assetSymbol: string;
  balanceUnavailable?: boolean;
  chainName: string;
  csprGas: string;
  depositPaymentAmount: string;
  payee: string;
  perCall: string;
  ready: boolean;
  wcspr: string;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-hairline bg-panel p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-1 font-mono text-sm text-ink tnum">{value}</div>
    </div>
  );
}

export function FundTab({
  balance,
  initialKeyId,
  keys,
  onConnectWallet,
  onRefresh,
  onSendWcsprTransfer,
  publicKey,
  walletReady,
}: {
  balance: GatewayBalance | null;
  initialKeyId?: string | null;
  keys: ApiKeyView[];
  onConnectWallet: () => void;
  onRefresh: () => Promise<void>;
  onSendWcsprTransfer: (input: SendWcsprTransferInput) => Promise<SendWcsprTransferResult>;
  publicKey?: string;
  walletReady: boolean;
}) {
  const [selectedId, setSelectedId] = useState(initialKeyId ?? "");
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [fundingStatus, setFundingStatus] = useState("");
  const activeKeys = useMemo(() => keys.filter((key) => !key.revoked), [keys]);
  const selectedKey = activeKeys.find((key) => key.id === selectedId) ?? activeKeys[0];
  const suggestedAmount = balance?.perCall ? formatTokenAmount(balance.perCall) : "7.5";
  const amountValue = amount || suggestedAmount;

  async function openWalletFunding() {
    if (!selectedKey) return toast.error("Create a key before funding");
    if (!walletReady) return toast.error("Wallet connector is still loading");
    if (!balance?.payee) return toast.error("Gateway payment account unavailable");
    if (!publicKey) {
      onConnectWallet();
      toast.message("Connect a wallet first, then send WCSPR from this same Fund tab.");
      return;
    }

    let amountMotes: string;
    try {
      amountMotes = parseTokenToMotes(amountValue);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid WCSPR amount");
      return;
    }

    setFunding(true);
    setFundingStatus("Waiting for wallet approval");
    try {
      const result = await onSendWcsprTransfer({
        amountMotes,
        assetPackageHash: balance.asset,
        chainName: balance.chainName,
        onStatusUpdate: (status) => setFundingStatus(statusLabel(status)),
        payeeAccountHash: balance.payee,
        paymentAmountMotes: balance.depositPaymentAmount,
      });
      if (result.status === "needs_connection") {
        toast.message("Connect a wallet first, then send WCSPR from this same Fund tab.");
        return;
      }
      if (result.status === "cancelled") {
        toast.info("Wallet transaction cancelled");
        return;
      }
      if (result.status === "error") {
        toast.error(result.error);
        return;
      }

      toast.success("WCSPR transfer sent. Crediting this key now.");
      await creditTransferHash(result.transactionHash);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send WCSPR");
    } finally {
      setFunding(false);
      setFundingStatus("");
    }
  }

  async function creditTransferHash(hash: string) {
    const keyId = selectedKey?.id;
    if (!keyId) return toast.error("Create a key before funding");
    try {
      const result = await claimDepositReq({ deployHash: hash, keyId });
      if (result.status === "credited") toast.success(`Credited ${formatTokenAmount(result.amount ?? "0")} WCSPR`);
      else if (result.status === "already_claimed") toast.info("Transfer already credited");
      else {
        toast.info(result.reason ?? `Transfer is not indexed yet. Deploy hash: ${hash.slice(0, 12)}…`);
        return;
      }
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not credit transfer");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-hairline bg-well p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">WCSPR deposit address</div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">
            {balance?.payee ?? "..."}
          </code>
          {balance?.payee ? <CopyButton value={balance.payee} label="Deposit address copied" /> : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          The gateway&apos;s WCSPR payment account. Use &ldquo;Send WCSPR&rdquo; below to fund a key from your
          connected wallet — it credits the selected key automatically.
        </p>
        {balance?.balanceUnavailable ? (
          <p className="mt-2 rounded-sm border border-hairline bg-panel px-2 py-1.5 text-xs text-ink-3">
            Live gateway balance is temporarily unavailable, but the configured deposit address is available.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Key available" value={selectedKey ? formatTokenAmount(selectedKey.available ?? "0") : "..."} />
        <Metric label="Key credited" value={selectedKey ? formatTokenAmount(selectedKey.credited ?? "0") : "..."} />
        <Metric label="Key spent" value={selectedKey ? formatTokenAmount(selectedKey.spent ?? "0") : "..."} />
      </div>

      <div className="rounded-md border border-hairline bg-panel p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">Fund key</div>
        {activeKeys.length === 0 ? (
          <div className="rounded-md border border-dashed border-hairline bg-well p-4 text-sm text-ink-3">
            Create a casper_ key before funding.
          </div>
        ) : (
          <FundKeyDropdown keys={activeKeys} selectedKey={selectedKey} onSelect={setSelectedId} />
        )}
      </div>

      <div className="rounded-md border border-hairline bg-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Fund selected key</div>
            <p className="text-sm leading-relaxed text-ink-2">
              {publicKey ? `Connected wallet ${publicKey.slice(0, 10)}...${publicKey.slice(-8)}` : "Connect a wallet, then send WCSPR to the deposit address."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:w-64">
            <label className="flex items-center gap-2">
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                placeholder={suggestedAmount}
                className="text-right tnum"
                aria-label="WCSPR funding amount"
              />
              <span className="w-16 font-mono text-xs text-ink-3">{balance?.assetSymbol ?? "WCSPR"}</span>
            </label>
            <Button onClick={openWalletFunding} disabled={!selectedKey || funding} className="gap-2">
              {funding ? <Loader2 className="size-4 animate-spin" /> : publicKey ? <Send className="size-4" /> : <Wallet className="size-4" />}
              {funding ? "Sending..." : publicKey ? "Send WCSPR" : "Connect wallet"}
            </Button>
          </div>
        </div>
        {fundingStatus ? <p className="mt-3 text-xs text-ink-3">{fundingStatus}</p> : null}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "sent") return "Transaction sent to Casper";
  if (status === "processed") return "Transaction processed on Casper";
  if (status === "timeout") return "Still waiting for network confirmation";
  return `Wallet status: ${status}`;
}
