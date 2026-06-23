import { eq } from "drizzle-orm";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { getDb } from "@/db/client";
import { endpointAccessKeys } from "@/db/schema";
import { logProviderEvent } from "./provider-store";

export interface EndpointAccessScope {
  sourceId: string;
  toolIds?: string[];
}

export async function createEndpointAccessKey(input: { label: string; scope: EndpointAccessScope; sourceId: string }) {
  const token = `cgw_test_${randomBytes(24).toString("base64url")}`;
  const [row] = await getDb()
    .insert(endpointAccessKeys)
    .values({
      label: requiredText(input.label, "access key label"),
      scope: input.scope,
      sourceId: input.sourceId,
      tokenHash: hashClientAccessToken(token),
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
  return {
    id: row.id,
    label: row.label,
    revoked: row.revoked,
    scope: row.scope,
    sourceId: row.sourceId,
  };
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

function requiredText(value: string, label: string) {
  const text = value.trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}
