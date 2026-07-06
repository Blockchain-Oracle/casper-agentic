import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db/client";
import { auditEvents, endpointAccessKeys, keyCredits, providerSources, providerTools, toolPrices } from "@/db/schema";
import { discoverMcpTools, type DiscoveredMcpTool } from "./mcp-client";
import { discoverOpenApiTools } from "./openapi-discovery";
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

export async function deleteProviderSource(sourceId: string) {
  const source = await getProviderSourceRecord(sourceId);
  if (!source) throw new Error("provider source not found");
  const db = getDb();
  const tools = await db.select().from(providerTools).where(eq(providerTools.sourceId, sourceId));
  const sourceKeys = await db.select().from(endpointAccessKeys).where(eq(endpointAccessKeys.sourceId, sourceId));
  await db.transaction(async (tx) => {
    if (tools.length) {
      await tx.delete(toolPrices).where(inArray(toolPrices.toolId, tools.map((tool) => tool.id)));
      await tx.delete(providerTools).where(eq(providerTools.sourceId, sourceId));
    }
    if (sourceKeys.length) {
      await tx.delete(keyCredits).where(inArray(keyCredits.keyId, sourceKeys.map((key) => key.id)));
      await tx.delete(endpointAccessKeys).where(eq(endpointAccessKeys.sourceId, sourceId));
    }
    await tx.delete(providerSources).where(eq(providerSources.id, sourceId));
  });
  await logProviderAudit("warn", "Provider source deleted", { sourceId, toolCount: tools.length });
  return { deleted: true, sourceId, toolCount: tools.length };
}

export async function getProviderSourceRecord(sourceId: string) {
  const [source] = await getDb().select().from(providerSources).where(eq(providerSources.id, sourceId)).limit(1);
  return source ?? null;
}

export async function getSourceByEndpoint(endpointUrl: string) {
  const [source] = await getDb().select().from(providerSources).where(eq(providerSources.endpointUrl, endpointUrl)).limit(1);
  return source ?? null;
}

export async function getToolByName(sourceId: string, name: string) {
  const [tool] = await getDb()
    .select()
    .from(providerTools)
    .where(and(eq(providerTools.sourceId, sourceId), eq(providerTools.name, name)))
    .limit(1);
  if (!tool) return null;
  const prices = await getDb()
    .select()
    .from(toolPrices)
    .where(eq(toolPrices.toolId, tool.id))
    .orderBy(desc(toolPrices.createdAt));
  return { ...toProviderToolView(tool), price: priceForTool(prices, tool.id) };
}

export async function persistOpenApiTools(
  sourceId: string,
  tools: Array<{
    name: string;
    description?: string;
    inputSchema?: unknown;
    method: string;
    baseUrl?: string;
    pathTemplate: string;
    executionParameters?: Array<{ name: string; in: string }>;
    requestBodyContentType?: string;
  }>,
) {
  if (!tools.length) {
    await logProviderAudit("warn", "OpenAPI discovery returned no tools", { sourceId });
    return [];
  }
  const rows = tools.map((tool) => ({
    description: tool.description ?? null,
    inputSchema: tool.inputSchema && typeof tool.inputSchema === "object" ? tool.inputSchema : {},
    name: tool.name,
    sourceId,
    status: "draft" as const,
    upstreamTarget: JSON.stringify({
      baseUrl: tool.baseUrl ?? "",
      executionParameters: tool.executionParameters ?? [],
      method: tool.method,
      pathTemplate: tool.pathTemplate,
      requestBodyContentType: tool.requestBodyContentType,
    }),
  }));
  const inserted = await getDb().insert(providerTools).values(rows).returning();
  await logProviderAudit("info", "OpenAPI tools discovered", { count: inserted.length, sourceId });
  return inserted.map(toProviderToolView);
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

export async function rediscoverSource(sourceId: string) {
  const source = await getProviderSourceRecord(sourceId);
  if (!source) throw new Error("provider source not found");
  const existing = await getDb().select().from(providerTools).where(eq(providerTools.sourceId, sourceId));
  const byName = new Map(existing.map((t) => [t.name, t]));

  const refresh = async (name: string, description: string | null, inputSchema: unknown) => {
    const ex = byName.get(name);
    if (!ex) return false;
    await getDb()
      .update(providerTools)
      .set({ description, inputSchema: inputSchema && typeof inputSchema === "object" ? inputSchema : {}, updatedAt: new Date() })
      .where(eq(providerTools.id, ex.id));
    return true;
  };

  let inserted = 0;
  let updated = 0;
  if (source.sourceType === "openapi") {
    const tools = await discoverOpenApiTools(source.endpointUrl);
    const fresh = tools.filter((t) => !byName.has(t.name));
    if (fresh.length) inserted = (await persistOpenApiTools(sourceId, fresh)).length;
    for (const t of tools) if (await refresh(t.name, t.description ?? null, t.inputSchema)) updated += 1;
  } else {
    const discovered = await discoverMcpTools(source.endpointUrl);
    const fresh = discovered.filter((t) => !byName.has(t.name));
    if (fresh.length) inserted = (await persistDiscoveredMcpTools(sourceId, source.endpointUrl, fresh)).length;
    for (const t of discovered) if (await refresh(t.name, t.description ?? null, t.inputSchema)) updated += 1;
  }

  await getDb().update(providerSources).set({ updatedAt: new Date() }).where(eq(providerSources.id, sourceId));
  await logProviderAudit("info", "Provider source re-discovered", { inserted, sourceId, updated });
  return { inserted, updated };
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

export async function listServerCatalog() {
  const sources = await getDb().select().from(providerSources).orderBy(desc(providerSources.createdAt));
  if (!sources.length) return [];
  const published = await getDb().select().from(providerTools).where(eq(providerTools.status, "published"));
  const publishedIds = published.map((tool) => tool.id);
  const prices = publishedIds.length
    ? await getDb().select().from(toolPrices).where(inArray(toolPrices.toolId, publishedIds))
    : [];
  return sources
    .map((source) => {
      const toolIds = new Set(published.filter((tool) => tool.sourceId === source.id).map((tool) => tool.id));
      // Distinct settlement networks this server prices tools on (for the browse badge + filter).
      const networks = [...new Set(prices.filter((price) => price.toolId && toolIds.has(price.toolId)).map((price) => price.network))];
      return { ...toProviderSourceView(source), networks, toolCount: toolIds.size };
    })
    .filter((server) => server.toolCount > 0);
}

export async function getServerWithTools(sourceId: string) {
  const source = await getProviderSourceRecord(sourceId);
  if (!source) return null;
  return { source: toProviderSourceView(source), tools: await listPublishedEndpointTools(sourceId) };
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
  return setProviderToolStatus(toolId, "published");
}

export async function publishProviderToolFree(toolId: string) {
  const db = getDb();
  const [tool] = await db.transaction(async (tx) => {
    await tx.delete(toolPrices).where(eq(toolPrices.toolId, toolId));
    return tx
      .update(providerTools)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(providerTools.id, toolId))
      .returning();
  });
  if (!tool) throw new Error("provider tool not found");
  await logProviderAudit("info", "Provider tool published free", { toolId });
  return toProviderToolView(tool);
}

export async function unpublishProviderTool(toolId: string) {
  return setProviderToolStatus(toolId, "unpublished");
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
