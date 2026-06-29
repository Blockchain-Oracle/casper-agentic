"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { casperExplorerUrl, truncateHash } from "@/lib/casper-explorer";
import { getCSPRClickBrowserState, getCSPRClickPublicConfig, prepareCSPRClickRuntime, type CSPRClickBrowserWindow } from "@/lib/csprclick-browser";

/**
 * Casper wallet identity via CSPR.click (Casper Wallet / Ledger / MetaMask-Snap).
 * Identity ONLY — read the connected public key for attribution; it is NOT wired to
 * any payment path (browser x402 signing does not settle on Casper; the gateway
 * signs). Fully defensive: every SDK call is optional-chained + try/caught so a
 * missing wallet / blocked CDN never crashes the app — the button just stays inert.
 */
export function WalletConnectButton() {
  const [pk, setPk] = useState<string | null>(null);

  useEffect(() => {
    const w = window as unknown as CSPRClickBrowserWindow;
    try {
      prepareCSPRClickRuntime(w, getCSPRClickPublicConfig());
    } catch {
      /* CDN/SDK unavailable — button degrades to inert */
    }
    let active = true;
    const poll = async () => {
      try {
        const state = await getCSPRClickBrowserState(w);
        if (active) setPk(state.connected ? state.activePublicKey ?? null : null);
      } catch {
        /* ignore */
      }
    };
    poll();
    const timer = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const client = () => (window as unknown as CSPRClickBrowserWindow).csprclick;
  const signIn = () => {
    try {
      const c = client();
      if (c?.signIn) c.signIn();
      else toast.error("No Casper wallet detected — install Casper Wallet to connect.");
    } catch {
      toast.error("Wallet connect unavailable");
    }
  };
  const signOut = () => {
    try {
      (client() as { signOut?: () => void } | undefined)?.signOut?.();
    } catch {
      /* ignore */
    }
    setPk(null);
  };

  if (!pk) {
    return (
      <Button size="sm" variant="outline" className="gap-1.5 font-medium" onClick={signIn}>
        <Wallet className="size-3.5" /> <span className="max-sm:hidden">Connect wallet</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 font-mono text-xs">
          <Wallet className="size-3.5" /> {truncateHash(pk, 4, 4)} <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(pk); toast.success("Public key copied"); }}>
          <Copy className="size-3.5" /> Copy public key
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={casperExplorerUrl(pk, "account")} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" /> View on cspr.live
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="size-3.5" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
