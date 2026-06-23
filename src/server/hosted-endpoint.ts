import { getProviderSourceRecord, listPublishedEndpointTools } from "./provider-store";
import { toProviderSourceView } from "./provider-model";

interface PaymentRequirementPrice {
  amount: string;
  asset: string;
  extra: unknown;
  maxTimeoutSeconds: number;
  network: string;
  payTo: string;
  scheme: string;
}

export async function getHostedEndpoint(sourceId: string, allowedToolIds?: string[]) {
  const source = await getProviderSourceRecord(sourceId);
  if (!source) throw new Error("hosted endpoint not found");

  const allowed = allowedToolIds ? new Set(allowedToolIds) : null;
  const tools = (await listPublishedEndpointTools(sourceId)).filter((tool) =>
    allowed ? allowed.has(tool.id) : true,
  );
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

export function paymentRequirementsFromPrice(price: PaymentRequirementPrice) {
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
