import { eq } from "drizzle-orm";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { getDb } from "@/db/client";
import { endpointAccessKeys } from "@/db/schema";
import { listPublishedEndpointTools, logProviderEvent } from "./provider-store";
import { getAgentWalletRecord } from "./wallet-store";

export interface EndpointAccessScope {
  sourceId: string;
  toolIds?: string[];
}

interface EndpointAccessScopeInput {
  sourceId: string;
  toolIds?: unknown;
}

export async function createEndpointAccessKey(input: {
  label: string;
  scope: EndpointAccessScopeInput;
  sourceId: string;
  walletId?: string | null;
}) {
  const token = `cgw_test_${randomBytes(24).toString("base64url")}`;
  const scope = await validateEndpointAccessScope(input.sourceId, input.scope);
  if (input.walletId) await assertServerSignableWallet(input.walletId);
  const [row] = await getDb()
    .insert(endpointAccessKeys)
    .values({
      label: requiredText(input.label, "access key label"),
      scope,
      sourceId: input.sourceId,
      tokenHash: hashClientAccessToken(token),
      walletId: input.walletId ?? null,
    })
    .returning();

  await logProviderEvent("info", "Endpoint access key created", {
    accessKeyId: row.id,
    sourceId: input.sourceId,
  });

  return { accessKey: toEndpointAccessKeyView(row), token };
}

export async function requireEndpointAccess(sourceId: string, authorizationHeader: string | null) {
  const token = bearerToken(authorizationHeader);
  if (!token) throw new EndpointAccessError("client access bearer token required", 401);

  const rows = await getDb()
    .select()
    .from(endpointAccessKeys)
    .where(eq(endpointAccessKeys.sourceId, sourceId));
  const match = rows.find((row) => !row.revoked && safeEqual(row.tokenHash, hashClientAccessToken(token)));
  if (!match) throw new EndpointAccessError("client access bearer token rejected", 403);
  return toEndpointAccessKeyView(match);
}

export function hashClientAccessToken(token: string) {
  return `sha256:${createHash("sha256").update(token).digest("hex")}`;
}

export class EndpointAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function isEndpointAccessError(error: unknown): error is EndpointAccessError {
  return error instanceof EndpointAccessError;
}

export function toEndpointAccessKeyView(row: typeof endpointAccessKeys.$inferSelect) {
  const sourceId = requiredText(row.sourceId ?? undefined, "endpoint access source id");
  return {
    id: row.id,
    label: row.label,
    revoked: row.revoked,
    scope: normalizeEndpointAccessScope(sourceId, row.scope),
    sourceId,
    // Bound hosted wallet for the autonomous server-signs path; null = caller-signs.
    walletId: row.walletId ?? null,
  };
}

export function normalizeEndpointAccessScope(
  sourceId: string,
  scope: unknown,
  publishedToolIds?: string[],
): EndpointAccessScope {
  const record = isRecord(scope) ? scope : {};
  const scopeSourceId = requiredText(
    typeof record.sourceId === "string" ? record.sourceId : sourceId,
    "access scope source id",
  );
  if (scopeSourceId !== sourceId) throw new Error("access scope source id must match endpoint source");

  const rawToolIds = record.toolIds;
  if (rawToolIds === undefined) return { sourceId };
  if (!Array.isArray(rawToolIds) || rawToolIds.length === 0) {
    throw new Error("access scope toolIds must be a non-empty string array");
  }

  const toolIds = [...new Set(rawToolIds.map((value) => requiredText(
    typeof value === "string" ? value : undefined,
    "access scope tool id",
  )))];
  if (publishedToolIds) {
    const published = new Set(publishedToolIds);
    const unknown = toolIds.find((toolId) => !published.has(toolId));
    if (unknown) throw new Error("access scope toolIds must reference published tools");
  }
  return { sourceId, toolIds };
}

function bearerToken(header: string | null) {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requiredText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}

async function assertServerSignableWallet(walletId: string) {
  const wallet = await getAgentWalletRecord(walletId);
  if (!wallet) throw new Error("bound wallet not found");
  if (wallet.signingMode !== "hosted" && wallet.signingMode !== "test-signer") {
    throw new Error("bound wallet must support server-side signing (hosted or test-signer)");
  }
}

async function validateEndpointAccessScope(sourceId: string, scope: EndpointAccessScopeInput) {
  const normalized = normalizeEndpointAccessScope(sourceId, scope);
  if (!normalized.toolIds) return normalized;

  const publishedTools = await listPublishedEndpointTools(sourceId);
  return normalizeEndpointAccessScope(
    sourceId,
    normalized,
    publishedTools.map((tool) => tool.id),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
