"use client";

import { useCallback, useEffect, useState } from "react";

import type { SignOwnerMessageResult } from "@/components/csprclick/csprclick-provider";

export type OwnerIdentity = { publicKey: string; accountHash: string };

type MeResponse = { enabled: boolean; identity: OwnerIdentity | null };

export async function fetchOwnerSession(): Promise<MeResponse> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return { enabled: false, identity: null };
    return (await res.json()) as MeResponse;
  } catch {
    return { enabled: false, identity: null };
  }
}

export async function signOutOwner(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
}

export type SignInOutcome =
  | { status: "ok"; identity: OwnerIdentity }
  | { status: "disabled" }
  | { status: "cancelled" }
  | { status: "needs_connection" }
  | { status: "error"; error: string };

// Orchestrate the wallet sign-in: server nonce -> wallet signs -> server session cookie.
export async function signInOwner(
  signFn: (message: string) => Promise<SignOwnerMessageResult>,
): Promise<SignInOutcome> {
  const nonceRes = await fetch("/api/auth/nonce", { method: "POST" });
  if (nonceRes.status === 503) return { status: "disabled" };
  if (!nonceRes.ok) return { status: "error", error: "could not request a sign-in nonce" };
  const { nonceToken, message } = (await nonceRes.json()) as { nonceToken: string; message: string };

  const signed = await signFn(message);
  if (signed.status === "cancelled") return { status: "cancelled" };
  if (signed.status === "needs_connection") return { status: "needs_connection" };
  if (signed.status !== "signed") return { status: "error", error: signed.error };

  const sessionRes = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nonceToken, publicKey: signed.publicKey, signatureHex: signed.signatureHex }),
  });
  if (!sessionRes.ok) {
    const body = (await sessionRes.json().catch(() => ({}))) as { error?: string };
    return { status: "error", error: body.error || "sign-in failed" };
  }
  const { identity } = (await sessionRes.json()) as { identity: OwnerIdentity };
  return { status: "ok", identity };
}

/** Loads the current owner session on mount and exposes sign-in/out helpers. */
export function useOwnerSession() {
  const [enabled, setEnabled] = useState(false);
  const [identity, setIdentity] = useState<OwnerIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const me = await fetchOwnerSession();
    setEnabled(me.enabled);
    setIdentity(me.identity);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Async data fetch on mount: state is set only after the awaited /api/auth/me
    // response, not synchronously — the acceptable "subscribe to external system" case.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  const signOut = useCallback(async () => {
    await signOutOwner();
    setIdentity(null);
  }, []);

  return { enabled, identity, loading, reload, setIdentity, signOut };
}
