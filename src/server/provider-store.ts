import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db/client";
import { auditEvents, providerSources, providerTools, toolPrices } from "@/db/schema";
import type { DiscoveredMcpTool } from "./mcp-client";
import {
  assertToolStatus,
  normalizeDiscoveredTool,
  normalizeProviderSourceInput,
  normalizeToolPriceInput,
  toProviderSourceView,
  toProviderToolView,
  toToolPriceView,
  type CreateProviderSourceInput,
  type ProviderToolStatus,
  type ToolPriceInput,
} from "./provider-model";

export async function createProviderSource(input: CreateProviderSourceInput) {
  const values = normalizeProviderSourceInput(input);
  const [source] = await getDb()
    .insert(providerSources)
    .values({ id: randomUUID(), ...values })
    .returning();

  await logProviderAudit("info", "Provider source created", {
    authMode: source.authMode,
    credentialConfigured: Boolean(source.credentialRef),
    sourceId: source.id,
    sourceType: source.sourceType,
  });
  return toProviderSourceView(source);
}

export async function listProviderSources() {
  const rows = await getDb().select().from(providerSources).orderBy(desc(providerSources.createdAt));
  return rows.map(toProviderSourceView);
}

export async function getProviderSourceRecord(sourceId: string) {
  const [source] = await getDb().select().from(providerSources).where(eq(providerSources.id, sourceId)).limit(1);
  return source ?? null;
}

export async function persistDiscoveredMcpTools(sourceId: string, endpointUrl: string, tools: DiscoveredMcpTool[]) {
  if (!tools.length) {
    await logProviderAudit("warn", "Provider source discovery returned no tools", { sourceId });
    return [];
  }

  const rows = tools.map((tool) => normalizeDiscoveredTool(sourceId, endpointUrl, tool));
  const inserted = await getDb().insert(providerTools).values(rows).returning();
  await logProviderAudit("info", "Provider tools discovered", {
    count: inserted.length,
    sourceId,
  });
  return inserted.map(toProviderToolView);
}

export async function listProviderTools(sourceId?: string) {
  let rows: Array<typeof providerTools.$inferSelect>;
  if (sourceId) {
    rows = await getDb()
      .select()
      .from(providerTools)
      .where(eq(providerTools.sourceId, sourceId))
      .orderBy(desc(providerTools.createdAt));
  } else {
    rows = await getDb().select().from(providerTools).orderBy(desc(providerTools.createdAt));
  }
  if (!rows.length) return [];

  const prices = await getDb()
    .select()
    .from(toolPrices)
    .where(inArray(toolPrices.toolId, rows.map((tool) => tool.id)))
    .orderBy(desc(toolPrices.createdAt));

  return rows.map((tool) => ({
    ...toProviderToolView(tool),
    price: priceForTool(prices, tool.id),
  }));
}

export async function listPublishedEndpointTools(sourceId: string) {
  const tools = await getDb()
    .select()
    .from(providerTools)
    .where(and(eq(providerTools.sourceId, sourceId), eq(providerTools.status, "published")))
    .orderBy(desc(providerTools.createdAt));
  if (!tools.length) return [];

  const prices = await getDb()
    .select()
    .from(toolPrices)
    .where(inArray(toolPrices.toolId, tools.map((tool) => tool.id)))
    .orderBy(desc(toolPrices.createdAt));

  return tools.map((tool) => ({
    ...toProviderToolView(tool),
    price: priceForTool(prices, tool.id),
  }));
}

export async function setProviderToolStatus(toolId: string, status: ProviderToolStatus) {
  assertToolStatus(status);
  const [tool] = await getDb()
    .update(providerTools)
    .set({ status, updatedAt: new Date() })
    .where(eq(providerTools.id, toolId))
    .returning();
  if (!tool) throw new Error("provider tool not found");
  await logProviderAudit("info", "Provider tool status updated", { status, toolId });
  return toProviderToolView(tool);
}

export async function publishProviderTool(toolId: string) {
  const [price] = await getDb().select().from(toolPrices).where(eq(toolPrices.toolId, toolId)).limit(1);
  if (!price) throw new Error("provider tool must be priced before publishing");
  return setProviderToolStatus(toolId, "published");
}

export async function saveToolPrice(input: ToolPriceInput) {
  const values = normalizeToolPriceInput(input);
  const [price] = await getDb()
    .insert(toolPrices)
    .values({ id: randomUUID(), ...values })
    .returning();
  await setProviderToolStatus(input.toolId, "priced");
  await logProviderAudit("info", "Provider tool price saved", {
    amount: price.amount,
    asset: price.asset,
    network: price.network,
    toolId: input.toolId,
  });
  return price;
}

async function logProviderAudit(kind: string, label: string, metadata: Record<string, unknown>) {
  await getDb().insert(auditEvents).values({ kind, label, metadata });
}

export async function logProviderEvent(kind: string, label: string, metadata: Record<string, unknown>) {
  await logProviderAudit(kind, label, metadata);
}

function priceForTool(prices: Array<typeof toolPrices.$inferSelect>, toolId: string) {
  const price = prices.find((row) => row.toolId === toolId);
  return price ? toToolPriceView(price) : null;
}
