import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";

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

export interface HostedEndpointSource {
  authMode: string;
  credentialConfigured: boolean;
  endpointUrl: string;
  id: string;
  name: string;
  sourceType: string;
}

export interface HostedEndpointTool {
  description: string | null;
  id: string;
  inputSchema: unknown;
  name: string;
  paymentRequirements: PaymentRequirements | null;
  status: string;
  upstreamTarget: string;
}

export interface HostedEndpointView {
  source: HostedEndpointSource;
  tools: HostedEndpointTool[];
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
  } satisfies HostedEndpointView;
}

export function paymentRequirementsFromPrice(price: PaymentRequirementPrice) {
  return {
    amount: price.amount,
    asset: price.asset,
    extra: isRecord(price.extra) ? price.extra : {},
    maxTimeoutSeconds: price.maxTimeoutSeconds,
    network: price.network as `${string}:${string}`,
    payTo: price.payTo,
    scheme: price.scheme,
  } satisfies PaymentRequirements;
}

export function hostedMcpTools(endpoint: HostedEndpointView) {
  return endpoint.tools.map((tool) => ({
    _meta: {
      "casperGw/paymentRequirements": tool.paymentRequirements,
      "casperGw/toolId": tool.id,
    },
    description: tool.description ?? undefined,
    inputSchema: tool.inputSchema,
    name: tool.name,
  }));
}

export function resolveHostedTool(endpoint: HostedEndpointView, nameOrId: string) {
  return endpoint.tools.find((tool) => tool.name === nameOrId || tool.id === nameOrId) ?? null;
}

export function buildHostedPaymentRequired(input: {
  endpoint: HostedEndpointView;
  requestUrl: string;
  tool: HostedEndpointTool;
}): PaymentRequired {
  const paymentRequirements = input.tool.paymentRequirements;
  if (!paymentRequirements) throw new Error("published tool is missing payment requirements");

  return {
    accepts: [paymentRequirements],
    error: "PAYMENT-SIGNATURE header is required",
    resource: {
      description: `${input.endpoint.source.name} ${input.tool.name}`,
      mimeType: "application/json",
      serviceName: "Casper GW",
      url: `${input.requestUrl}#${input.tool.name}`,
    },
    x402Version: 2,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
