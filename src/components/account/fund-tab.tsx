"use client";

import { useMemo, useState } from "react";
import { Loader2, Send, Wallet } from "lucide-react";
import { toast } from "sonner";

import type { SendCsprDepositInput, SendWcsprTransferResult } from "@/components/csprclick/csprclick-provider";
import { FundKeyDropdown } from "@/components/account/fund-key-dropdown";
import { CopyButton } from "@/components/primitives/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokenAmount, parseTokenToMotes } from "@/lib/format-amount";
import { claimDepositReq, type ApiKeyView } from "@/lib/gateway-api";

type GatewayBalance = {
  accountHash: string;
  balanceUnavailable?: boolean;
  chainName: string;
  depositPaymentAmount: string;
  perCall: string;
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
  onSendCsprDeposit,
  publicKey,
  walletReady,
}: {
  balance: GatewayBalance | null;
  initialKeyId?: string | null;
  keys: ApiKeyView[];
  onConnectWallet: () => void;
  onRefresh: () => Promise<void>;
  onSendCsprDeposit: (input: SendCsprDepositInput) => Promise<SendWcsprTransferResult>;
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

  async function depositCspr() {
    if (!selectedKey) return toast.error("Create a key before funding");
    if (!walletReady) return toast.error("Wallet connector is still loading");
    if (!balance?.accountHash) return toast.error("Gateway account unavailable");
    if (!publicKey) {
      onConnectWallet();
      toast.message("Connect a wallet first, then deposit CSPR from this same Fund tab.");
      return;
    }

    let amountMotes: string;
    try {
      amountMotes = parseTokenToMotes(amountValue);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid CSPR amount");
      return;
    }

    setFunding(true);
    setFundingStatus("Waiting for wallet approval");
    try {
      const result = await onSendCsprDeposit({
        amountMotes,
        chainName: balance.chainName,
        gatewayAccountHash: balance.accountHash,
        onStatusUpdate: (status) => setFundingStatus(statusLabel(status)),
        paymentAmountMotes: balance.depositPaymentAmount,
      });
      if (result.status === "needs_connection") {
        toast.message("Connect a wallet first, then deposit CSPR from this same Fund tab.");
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

      toast.success("CSPR deposit sent. Crediting this key now.");
      await creditTransferHash(result.transactionHash);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not deposit CSPR");
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
      if (result.status === "credited") toast.success(`Credited ${formatTokenAmount(result.amount ?? "0")} to your key`);
      else if (result.status === "already_claimed") toast.info("Deposit already credited");
      else {
        toast.info(result.reason ?? `Deposit is not indexed yet. Deploy hash: ${hash.slice(0, 12)}…`);
        return;
      }
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not credit deposit");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-hairline bg-well p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Gateway deposit address (CSPR)</div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">
            {balance?.accountHash ? shortHash(balance.accountHash) : "..."}
          </code>
          {balance?.accountHash ? <CopyButton value={balance.accountHash} label="Gateway address copied" /> : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          Deposit native CSPR — no WCSPR needed. Use &ldquo;Deposit CSPR&rdquo; below to fund a key from your
          connected wallet; the gateway wraps it and credits the selected key automatically.
        </p>
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
              {publicKey ? `Connected wallet ${publicKey.slice(0, 10)}...${publicKey.slice(-8)}` : "Connect a wallet, then deposit CSPR to fund this key."}
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
                aria-label="CSPR deposit amount"
              />
              <span className="w-16 font-mono text-xs text-ink-3">CSPR</span>
            </label>
            <Button onClick={depositCspr} disabled={!selectedKey || funding} className="gap-2">
              {funding ? <Loader2 className="size-4 animate-spin" /> : publicKey ? <Send className="size-4" /> : <Wallet className="size-4" />}
              {funding ? "Depositing..." : publicKey ? "Deposit CSPR" : "Connect wallet"}
            </Button>
          </div>
        </div>
        {fundingStatus ? <p className="mt-3 text-xs text-ink-3">{fundingStatus}</p> : null}
      </div>
    </div>
  );
}

function shortHash(value: string) {
  return value.length > 22 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
}

function statusLabel(status: string) {
  if (status === "sent") return "Transaction sent to Casper";
  if (status === "processed") return "Transaction processed on Casper";
  if (status === "timeout") return "Still waiting for network confirmation";
  return `Wallet status: ${status}`;
}
