import type { providerSources, providerTools } from "@/db/schema";
import type { DiscoveredMcpTool } from "./mcp-client";

export type ProviderSourceType = "openapi" | "mcp" | "manual";
export type ProviderAuthMode = "none" | "static" | "apikey" | "bearer";
export type ProviderToolStatus = "draft" | "selected" | "priced" | "published" | "unpublished" | "unsupported";

export interface CreateProviderSourceInput {
  authMode?: ProviderAuthMode;
  credentialRef?: string;
  endpointUrl: string;
  name: string;
  sourceType: ProviderSourceType;
}

export interface ToolPriceInput {
  amount: string;
  asset: string;
  maxTimeoutSeconds?: number;
  network: string;
  payTo: string;
  scheme?: "exact";
  toolId: string;
}

export function normalizeProviderSourceInput(input: CreateProviderSourceInput) {
  const name = requiredText(input.name, "source name");
  const sourceType = assertSourceType(input.sourceType);
  const authMode = assertAuthMode(input.authMode ?? "none");
  const endpointUrl = normalizeEndpoint(input.endpointUrl, sourceType);
  const credentialRef = normalizeCredentialRef(input.credentialRef);
  return { authMode, credentialRef, endpointUrl, name, sourceType };
}

export function normalizeDiscoveredTool(sourceId: string, endpointUrl: string, tool: DiscoveredMcpTool) {
  const name = requiredText(tool.name, "tool name");
  return {
    description: tool.description,
    inputSchema: isRecord(tool.inputSchema) ? tool.inputSchema : {},
    outputSchema: isRecord(tool.outputSchema) ? tool.outputSchema : undefined,
    sourceId,
    status: "draft" as const,
    upstreamTarget: `${endpointUrl}#${name}`,
    name,
  };
}

export function normalizeToolPriceInput(input: ToolPriceInput) {
  return {
    amount: positiveIntegerString(input.amount, "amount"),
    asset: requiredText(input.asset, "asset"),
    extra: {},
    maxTimeoutSeconds: positiveInteger(input.maxTimeoutSeconds ?? 900, "max timeout seconds"),
    network: requiredText(input.network, "network"),
    payTo: requiredText(input.payTo, "payTo"),
    scheme: input.scheme ?? "exact",
    toolId: requiredText(input.toolId, "tool id"),
  };
}

export function toProviderSourceView(row: typeof providerSources.$inferSelect) {
  return {
    authMode: row.authMode as ProviderAuthMode,
    credentialConfigured: Boolean(row.credentialRef),
    endpointUrl: row.endpointUrl,
    id: row.id,
    name: row.name,
    sourceType: row.sourceType as ProviderSourceType,
  };
}

export function toProviderToolView(row: typeof providerTools.$inferSelect) {
  return {
    description: row.description,
    id: row.id,
    inputSchema: row.inputSchema,
    name: row.name,
    outputSchema: row.outputSchema,
    sourceId: row.sourceId,
    status: row.status as ProviderToolStatus,
    upstreamTarget: row.upstreamTarget,
  };
}

export function assertToolStatus(value: string): asserts value is ProviderToolStatus {
  if (["draft", "selected", "priced", "published", "unpublished", "unsupported"].includes(value)) return;
  throw new Error("provider tool status is not supported");
}

function assertSourceType(value: string): ProviderSourceType {
  if (value === "openapi" || value === "mcp" || value === "manual") return value;
  throw new Error("provider source type is not supported");
}

function assertAuthMode(value: string): ProviderAuthMode {
  if (value === "none" || value === "static" || value === "apikey" || value === "bearer") return value;
  throw new Error("provider auth mode is not supported");
}

function normalizeEndpoint(value: string, sourceType: ProviderSourceType) {
  const endpointUrl = requiredText(value, "endpoint URL");
  if (sourceType === "manual") return endpointUrl;

  const parsed = new URL(endpointUrl);
  if (parsed.protocol !== "https:") throw new Error("provider endpoint must use HTTPS");
  if (parsed.username || parsed.password) throw new Error("provider endpoint must not contain credentials");
  return parsed.toString();
}

function normalizeCredentialRef(value?: string) {
  const credentialRef = value?.trim();
  if (!credentialRef) return undefined;
  if (/^(cred_|vault:|env:)[A-Za-z0-9_:/.-]+$/.test(credentialRef)) return credentialRef;
  throw new Error("credentialRef must reference server-side credential storage");
}

function requiredText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function positiveIntegerString(value: string, label: string) {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${label} must be a positive integer string`);
  return value;
}

function positiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
