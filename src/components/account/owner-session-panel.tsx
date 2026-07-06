"use client";

import { useState } from "react";
import { BadgeCheck, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useCsprClick } from "@/components/csprclick/csprclick-provider";
import { CopyButton } from "@/components/primitives/copy-button";
import { Button } from "@/components/ui/button";
import { signInOwner, useOwnerSession } from "@/lib/owner-session";

function shortHash(value: string) {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

// Establishes the wallet-signed owner session that gates managing your own sources
// and keys. Identity only — this signature never authorizes an x402 payment.
// useOwnerSession state is per-component: onSessionChange lets siblings with their
// own hook instance reload after a sign-in/out that happened here.
export function OwnerSessionPanel({ onSessionChange }: { onSessionChange?: () => void }) {
  const { connect, publicKey, signOwnerMessage } = useCsprClick();
  const { enabled, identity, loading, setIdentity, signOut } = useOwnerSession();
  const [signingIn, setSigningIn] = useState(false);

  if (loading || !enabled) return null;

  async function handleSignIn() {
    setSigningIn(true);
    try {
      const result = await signInOwner(signOwnerMessage);
      if (result.status === "ok") {
        setIdentity(result.identity);
        onSessionChange?.();
        toast.success("Owner verified — you can now manage your servers and keys");
      } else if (result.status === "needs_connection") {
        connect();
        toast.message("Connect a wallet first, then sign in.");
      } else if (result.status === "cancelled") {
        toast.info("Sign-in cancelled");
      } else if (result.status === "disabled") {
        toast.error("Owner sessions are not configured on this gateway");
      } else {
        toast.error(result.error || "Sign-in failed");
      }
    } finally {
      setSigningIn(false);
    }
  }

  if (identity) {
    return (
      <div className="rounded-md border border-settled/40 bg-settled/10 p-4">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink">
          <BadgeCheck className="size-4 text-settled" /> Owner verified
        </div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-panel px-2 py-1.5 font-mono text-xs text-ink">
            {shortHash(identity.accountHash)}
          </code>
          <CopyButton value={identity.accountHash} label="Owner account hash copied" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs leading-relaxed text-ink-3">
            You can manage the servers and keys you own from this wallet.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-ink-3"
            onClick={() => void signOut().then(() => onSessionChange?.())}
          >
            <LogOut className="size-3.5" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-hairline bg-panel p-4">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink">
        <ShieldCheck className="size-4 text-casper" /> Prove ownership
      </div>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-ink-3">
          Sign a message with your wallet to manage the servers and keys you own. No payment, no gas.
        </p>
        <Button size="sm" onClick={handleSignIn} disabled={signingIn} className="gap-1.5 shrink-0">
          {signingIn ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
          {signingIn ? "Check your wallet..." : publicKey ? "Sign in with wallet" : "Connect & sign in"}
        </Button>
      </div>
    </div>
  );
}
