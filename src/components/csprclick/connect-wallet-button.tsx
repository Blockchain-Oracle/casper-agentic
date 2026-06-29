"use client";

import { LogOut, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCsprClick } from "./csprclick-provider";

function shortKey(publicKey: string) {
  return `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { connect, disconnect, disabled, publicKey, ready } = useCsprClick();

  // No appId configured -> CSPR.click is off; render nothing (or a disabled hint).
  if (disabled) return null;

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="rounded-md border border-hairline bg-well px-2.5 py-1 font-mono text-xs text-ink"
          title={publicKey}
        >
          {shortKey(publicKey)}
        </span>
        <Button
          type="button"
          onClick={disconnect}
          size="icon-xs"
          variant="ghost"
          aria-label="Disconnect wallet"
          title="Disconnect wallet"
        >
          <LogOut className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={connect}
      disabled={!ready}
      size="sm"
      className="gap-1.5"
      aria-label={ready ? "Connect wallet" : "Loading wallet"}
    >
      <Wallet className="size-3.5" />
      <span className="max-sm:hidden" aria-hidden="true">{ready ? "Connect wallet" : "Loading..."}</span>
    </Button>
  );
}
