import type { toolPrices } from "@/db/schema";
import { getProviderSourceRecord, listPublishedEndpointTools } from "./provider-store";
import { toProviderSourceView } from "./provider-model";

type ToolPriceRow = typeof toolPrices.$inferSelect;

export async function getHostedEndpoint(sourceId: string) {
  const source = await getProviderSourceRecord(sourceId);
  if (!source) throw new Error("hosted endpoint not found");

  const tools = await listPublishedEndpointTools(sourceId);
  return {
    source: toProviderSourceView(source),
    tools: tools.map((tool) => ({
      description: tool.description,
      id: tool.id,
      inputSchema: tool.inputSchema,
      name: tool.name,
      paymentRequirements: tool.price ? paymentRequirementsFromPrice(tool.price) : null,
      status: tool.status,
      upstreamTarget: tool.upstreamTarget,
    })),
  };
}

export function paymentRequirementsFromPrice(price: ToolPriceRow) {
  return {
    amount: price.amount,
    asset: price.asset,
    extra: price.extra,
    maxTimeoutSeconds: price.maxTimeoutSeconds,
    network: price.network,
    payTo: price.payTo,
    scheme: price.scheme,
  };
}
