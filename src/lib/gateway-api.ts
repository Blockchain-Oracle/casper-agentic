// Thin client for the public gateway endpoints (no auth — single-operator demo).
// Used by the register flow, the tool catalogue, and the Run/Pay modal.

import type { ProviderToolPrice, ProviderToolStatus } from "@/lib/types";

export interface DiscoveredTool {
  id: string;
  name: string;
  description: string | null;
  inputSchema: unknown;
  price?: ProviderToolPrice | null;
  sourceId: string;
  status: ProviderToolStatus;
  upstreamTarget: string;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `request failed (${res.status})`);
  return json as T;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `request failed (${res.status})`);
  return json as T;
}

export function createSource(input: { name: string; endpointUrl: string; sourceType?: "mcp" | "openapi" }) {
  return post<{ source: { id: string; name: string; endpointUrl: string } }>("/api/provider/sources", {
    sourceType: "mcp",
    ...input,
  });
}

export function listSources() {
  return get<{
    sources: Array<{ endpointUrl: string; id: string; name: string; sourceType: string; ownerPublicKey: string | null }>;
  }>("/api/provider/sources");
}

export function deleteSource(sourceId: string) {
  return fetch(`/api/provider/sources/${sourceId}`, { method: "DELETE" }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? `request failed (${res.status})`);
    return json as { deleted: boolean; sourceId: string; toolCount: number };
  });
}

export function discoverSource(sourceId: string) {
  return post<{ tools: DiscoveredTool[] }>(`/api/provider/sources/${sourceId}/discover`);
}

export function priceTool(toolId: string, amountMotes: string) {
  return post<{ price: unknown }>(`/api/provider/tools/${toolId}/price`, { amount: amountMotes });
}

export function publishTool(toolId: string) {
  return post<{ tool: DiscoveredTool }>(`/api/provider/tools/${toolId}/publish`);
}

export function publishFreeTool(toolId: string) {
  return post<{ tool: DiscoveredTool }>(`/api/provider/tools/${toolId}/free`);
}

export function unpublishTool(toolId: string) {
  return post<{ tool: DiscoveredTool }>(`/api/provider/tools/${toolId}/unpublish`);
}

export function listTools(sourceId?: string) {
  const qs = sourceId ? `?sourceId=${encodeURIComponent(sourceId)}` : "";
  return get<{ tools: DiscoveredTool[] }>(`/api/provider/tools${qs}`);
}

export function runPaidCall(input: {
  apiKey?: string;
  apiKeyId?: string;
  endpointUrl: string;
  toolName: string;
  args: Record<string, unknown>;
  client?: string;
}) {
  return post<{ attemptId?: string; status: string; explorerUrl?: string; reason?: string; result?: unknown }>(
    "/api/paid-calls/run",
    input,
  );
}

export interface ApiKeyView {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  createdAt: string;
  scope: { allowedTools?: string[]; maxSpendMotes?: string; expiresAt?: string };
  credited?: string;
  spent?: string;
  available?: string;
}

export function claimDepositReq(input: { keyId: string; deployHash: string }) {
  return fetch("/api/fund/claim", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok && !json?.status) throw new Error(json?.error ?? `request failed (${res.status})`);
    return json as { status: string; amount?: string; fromHash?: string; reason?: string; deployHash: string };
  });
}

export function getGatewayBalance() {
  return get<{
    accountHash: string;
    asset: string;
    assetSymbol: string;
    balanceUnavailable?: boolean;
    balanceUnavailableReason?: string;
    chainName: string;
    csprGas: string;
    depositPaymentAmount: string;
    payee: string;
    perCall: string;
    ready: boolean;
    wcspr: string;
  }>("/api/gateway/balance");
}

export function listApiKeys() {
  return get<{ keys: ApiKeyView[] }>("/api/keys");
}

export function createApiKeyReq(input: { name?: string; allowedTools?: string[]; maxSpendMotes?: string; expiresAt?: string }) {
  return post<{ token: string; key: ApiKeyView }>("/api/keys", input);
}

export function revokeApiKeyReq(id: string, apiKeyToken?: string) {
  return fetch(`/api/keys/${id}/revoke`, {
    headers: apiKeyToken ? { "x-api-key": apiKeyToken } : undefined,
    method: "POST",
  }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? `request failed (${res.status})`);
    return json as { ok: boolean };
  });
}
