import type { ProviderTool, Tool } from "@/lib/types";

export const DEFAULT_PROVIDER_MCP_URL = "https://mcp.cspr.trade/mcp";
export const DEFAULT_PROVIDER_PRICE_AMOUNT = "7500000000";

export async function providerRequest<T>(
  path: string,
  init: { bearerToken?: string; body?: unknown; method?: string; operatorToken?: string } = {},
): Promise<T> {
  const headers = new Headers();
  if (init.operatorToken) headers.set("x-casper-gw-operator-token", init.operatorToken);
  if (init.bearerToken) headers.set("authorization", `Bearer ${init.bearerToken}`);
  if (init.body) headers.set("content-type", "application/json");

  const response = await fetch(path, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    headers,
    method: init.method ?? "GET",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : `Request failed: ${response.status}`);
  }
  return payload as T;
}

export function toToolRow(tool: ProviderTool, providerName = "Provider"): Tool {
  return {
    description: tool.description ?? "No description provided.",
    enabled: ["selected", "priced", "published"].includes(tool.status),
    id: tool.name,
    price: amountToWcspr(tool.price?.amount),
    priceAmount: tool.price?.amount ?? null,
    provider: providerName,
    published: tool.status === "published",
    recordId: tool.id,
    status: tool.status,
    target: tool.upstreamTarget,
  };
}

function amountToWcspr(amount?: string) {
  if (!amount) return null;
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? numeric / 1_000_000_000 : null;
}
