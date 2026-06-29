import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { endpointAccessKeys, providerSources, providerTools } from "@/db/schema";
import { DestructiveActionError, requireDestructiveActionToken } from "./destructive-action-guard";
import { OWNER_SESSION_COOKIE, readOwnerSession, type OwnerIdentity } from "./wallet-session";

// Owner enforcement is additive and per-record:
//   - Owned records (owner_public_key set) ALWAYS require a matching wallet session.
//   - Legacy owner-null records keep today's behavior: "admin" fallback gates
//     destructive ops (delete/revoke), "allow" leaves mutations (price/publish) open.
// This keeps the live app working until the sign-in UI lands and sources get stamped.

type RecordOwner = { ownerPublicKey: string | null; ownerAccountHash?: string | null };
type LegacyMode = "admin" | "allow";

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

/** Pure access decision — unit-testable without a database. */
export function assertOwnerAccess(
  request: Request,
  record: RecordOwner,
  legacy: LegacyMode = "allow",
): OwnerIdentity | null {
  if (!record.ownerPublicKey) {
    if (legacy === "admin") requireDestructiveActionToken(request);
    return null;
  }
  const session = readOwnerFromRequest(request);
  if (!session || session.publicKey !== record.ownerPublicKey.toLowerCase()) {
    throw new DestructiveActionError("you are not the owner of this resource");
  }
  return session;
}

export async function requireSourceOwner(request: Request, sourceId: string, legacy: LegacyMode = "allow") {
  const [row] = await getDb()
    .select({ ownerPublicKey: providerSources.ownerPublicKey })
    .from(providerSources)
    .where(eq(providerSources.id, sourceId))
    .limit(1);
  if (!row) throw new DestructiveActionError("provider source not found", 404);
  return assertOwnerAccess(request, row, legacy);
}

export async function requireToolOwner(request: Request, toolId: string, legacy: LegacyMode = "allow") {
  const [tool] = await getDb()
    .select({ sourceId: providerTools.sourceId })
    .from(providerTools)
    .where(eq(providerTools.id, toolId))
    .limit(1);
  if (!tool) throw new DestructiveActionError("provider tool not found", 404);
  if (!tool.sourceId) return assertOwnerAccess(request, { ownerPublicKey: null }, legacy);
  return requireSourceOwner(request, tool.sourceId, legacy);
}

export async function requireKeyOwner(request: Request, keyId: string, legacy: LegacyMode = "admin") {
  const [key] = await getDb()
    .select({ ownerPublicKey: endpointAccessKeys.ownerPublicKey })
    .from(endpointAccessKeys)
    .where(eq(endpointAccessKeys.id, keyId))
    .limit(1);
  if (!key) throw new DestructiveActionError("API key not found", 404);
  return assertOwnerAccess(request, key, legacy);
}

export async function assignSourceOwner(sourceId: string, owner: OwnerIdentity) {
  await getDb()
    .update(providerSources)
    .set({ ownerPublicKey: owner.publicKey, ownerAccountHash: owner.accountHash })
    .where(eq(providerSources.id, sourceId));
}
