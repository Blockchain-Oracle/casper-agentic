import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { endpointAccessKeys, providerSources, providerTools } from "@/db/schema";
import { DestructiveActionError, requireDestructiveActionToken } from "./destructive-action-guard";
import { OWNER_SESSION_COOKIE, ownerSessionsEnabled, readOwnerSession, type OwnerIdentity } from "./wallet-session";

// ONE consistent rule for every manage action (publish, price, select, free,
// unpublish, delete, revoke, rediscover, access-keys):
//   - owner sessions enabled (a CASPER_GW_SESSION_SECRET is set):
//       * must be signed in (else 401),
//       * an owned record requires the owner's wallet (else 403),
//       * an unowned record is claimed by the first signed-in wallet to manage it.
//   - owner sessions disabled: fall back to the admin token (ops/scripts).
// No per-action split — if you can publish a server you can delete it, and vice versa.

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function readOwnerFromRequest(request: Request): OwnerIdentity | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  return readOwnerSession(parseCookie(cookie, OWNER_SESSION_COOKIE));
}

// Pure decision: returns "claim" for an unowned record, "allow" for the owner; throws otherwise.
export function ownerDecision(session: OwnerIdentity | null, ownerPublicKey: string | null): "claim" | "allow" {
  if (!session) throw new DestructiveActionError("sign in with your wallet to manage this", 401);
  if (!ownerPublicKey) return "claim";
  if (session.publicKey === ownerPublicKey.toLowerCase()) return "allow";
  throw new DestructiveActionError("you are not the owner of this resource", 403);
}

export async function requireSourceOwner(request: Request, sourceId: string): Promise<OwnerIdentity | null> {
  if (!ownerSessionsEnabled()) {
    requireDestructiveActionToken(request);
    return null;
  }
  const [row] = await getDb()
    .select({ ownerPublicKey: providerSources.ownerPublicKey })
    .from(providerSources)
    .where(eq(providerSources.id, sourceId))
    .limit(1);
  if (!row) throw new DestructiveActionError("provider source not found", 404);
  const session = readOwnerFromRequest(request);
  if (ownerDecision(session, row.ownerPublicKey) === "claim") await assignSourceOwner(sourceId, session!);
  return session;
}

export async function requireToolOwner(request: Request, toolId: string): Promise<OwnerIdentity | null> {
  if (!ownerSessionsEnabled()) {
    requireDestructiveActionToken(request);
    return null;
  }
  const [tool] = await getDb()
    .select({ sourceId: providerTools.sourceId })
    .from(providerTools)
    .where(eq(providerTools.id, toolId))
    .limit(1);
  if (!tool) throw new DestructiveActionError("provider tool not found", 404);
  if (!tool.sourceId) {
    const session = readOwnerFromRequest(request);
    ownerDecision(session, null);
    return session;
  }
  return requireSourceOwner(request, tool.sourceId);
}

export async function requireKeyOwner(request: Request, keyId: string): Promise<OwnerIdentity | null> {
  if (!ownerSessionsEnabled()) {
    requireDestructiveActionToken(request);
    return null;
  }
  const [key] = await getDb()
    .select({ ownerPublicKey: endpointAccessKeys.ownerPublicKey })
    .from(endpointAccessKeys)
    .where(eq(endpointAccessKeys.id, keyId))
    .limit(1);
  if (!key) throw new DestructiveActionError("API key not found", 404);
  const session = readOwnerFromRequest(request);
  ownerDecision(session, key.ownerPublicKey);
  return session;
}

export async function assignSourceOwner(sourceId: string, owner: OwnerIdentity) {
  await getDb()
    .update(providerSources)
    .set({ ownerPublicKey: owner.publicKey, ownerAccountHash: owner.accountHash })
    .where(eq(providerSources.id, sourceId));
}
