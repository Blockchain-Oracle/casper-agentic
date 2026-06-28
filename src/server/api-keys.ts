import { and, eq, inArray, isNull } from "drizzle-orm";
import { createHash, timingSafeEqual } from "node:crypto";
import { customAlphabet } from "nanoid";

import { getDb } from "@/db/client";
import { endpointAccessKeys, paidCallAttempts } from "@/db/schema";

// Consumer/agent API keys: a `casper_` credential anyone can mint to let an agent
// pay per call through the gateway. "Agent sessions with limits" — each key is
// scoped (allowed tools · max spend · expiry). Stored in endpoint_access_keys with
// sourceId=null (gateway-wide, not tied to one provider source). No new table.

const SETTLED = ["settled", "raw_proof_unavailable"];
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 40);

export interface ApiKeyScope {
  allowedTools?: string[];
  maxSpendMotes?: string;
  expiresAt?: string;
}

export interface ApiKeyView {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  createdAt: string;
  scope: ApiKeyScope;
}

export class ApiKeyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function isApiKeyError(error: unknown): error is ApiKeyError {
  return error instanceof ApiKeyError;
}

function hashToken(token: string) {
  return `sha256:${createHash("sha256").update(token).digest("hex")}`;
}

function scopeOf(row: typeof endpointAccessKeys.$inferSelect): ApiKeyScope {
  const s = (row.scope ?? {}) as Record<string, unknown>;
  return {
    allowedTools: Array.isArray(s.allowedTools) ? (s.allowedTools as string[]) : undefined,
    expiresAt: typeof s.expiresAt === "string" ? s.expiresAt : undefined,
    maxSpendMotes: typeof s.maxSpendMotes === "string" ? s.maxSpendMotes : undefined,
  };
}

function toView(row: typeof endpointAccessKeys.$inferSelect): ApiKeyView {
  return { id: row.id, name: row.label, prefix: "casper_", revoked: row.revoked, createdAt: row.createdAt.toISOString(), scope: scopeOf(row) };
}

/** Mint a key. Returns the plaintext token ONCE (only the hash is stored). */
export async function createApiKey(input: { name?: string; scope?: ApiKeyScope }) {
  const token = `casper_${nano()}`;
  const scope: ApiKeyScope = {};
  if (input.scope?.allowedTools?.length) scope.allowedTools = input.scope.allowedTools;
  if (input.scope?.maxSpendMotes) scope.maxSpendMotes = input.scope.maxSpendMotes;
  if (input.scope?.expiresAt) scope.expiresAt = input.scope.expiresAt;

  const [row] = await getDb()
    .insert(endpointAccessKeys)
    .values({
      label: input.name?.trim() || "Agent key",
      scope: { kind: "consumer", ...scope },
      sourceId: null,
      tokenHash: hashToken(token),
      walletId: null,
    })
    .returning();
  return { key: toView(row), token };
}

export async function listApiKeys(): Promise<ApiKeyView[]> {
  const rows = await getDb().select().from(endpointAccessKeys).where(isNull(endpointAccessKeys.sourceId));
  return rows
    .filter((r) => (r.scope as Record<string, unknown>)?.kind === "consumer")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(toView);
}

export async function revokeApiKey(id: string) {
  await getDb().update(endpointAccessKeys).set({ revoked: true, updatedAt: new Date() }).where(eq(endpointAccessKeys.id, id));
}

/** Settled spend (motes) charged to a key — keyed by attempt.client = `key:<id>`. */
export async function spendForKey(id: string): Promise<bigint> {
  const rows = await getDb()
    .select()
    .from(paidCallAttempts)
    .where(and(eq(paidCallAttempts.client, `key:${id}`), inArray(paidCallAttempts.status, SETTLED)));
  return rows.reduce((sum, r) => sum + BigInt(r.amount || "0"), BigInt(0));
}

/** Verify a key for a specific call. Enforces revoke/expiry/tool-allowlist/spend-cap. Returns the key id. */
export async function verifyApiKey(token: string, ctx: { toolName: string; amountMotes: string }): Promise<string> {
  const rows = await getDb().select().from(endpointAccessKeys).where(isNull(endpointAccessKeys.sourceId));
  const hash = hashToken(token);
  const match = rows.find((r) => (r.scope as Record<string, unknown>)?.kind === "consumer" && safeEqual(r.tokenHash, hash));
  if (!match) throw new ApiKeyError("invalid API key", 401);
  if (match.revoked) throw new ApiKeyError("API key revoked", 403);

  const scope = scopeOf(match);
  if (scope.expiresAt && Date.parse(scope.expiresAt) < Date.now()) throw new ApiKeyError("API key expired", 403);
  if (scope.allowedTools?.length && !scope.allowedTools.includes(ctx.toolName)) {
    throw new ApiKeyError(`API key is not scoped to call ${ctx.toolName}`, 403);
  }
  if (scope.maxSpendMotes) {
    const spent = await spendForKey(match.id);
    if (spent + BigInt(ctx.amountMotes) > BigInt(scope.maxSpendMotes)) {
      throw new ApiKeyError("API key spend cap reached", 402);
    }
  }
  return match.id;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
