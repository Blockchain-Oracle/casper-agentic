import { CsprCloudClient, CsprCloudRequestError } from "./cspr-cloud";
import { getRuntimeConfig } from "./env";

export type ExplorerQueryKind = "account" | "cspr_name" | "deploy" | "public_key" | "receipt" | "unknown";

export interface ParsedExplorerQuery {
  kind: ExplorerQueryKind;
  query: string;
}

export type AccountIdentifierResolution =
  | {
      accountHash: string;
      message: string;
      publicKey?: string;
      source: "resolved";
    }
  | {
      message: string;
      source: "not_found" | "unconfigured" | "upstream_error";
    };

export function parseExplorerQuery(rawQuery: string): ParsedExplorerQuery {
  const raw = rawQuery.trim();
  const match = raw.match(/^(account|wallet|deploy|receipt|public-key|public|pk|name|cspr-name):(.+)$/i);
  const kind = match?.[1]?.toLowerCase();
  const value = (match?.[2] ?? raw).trim();
  const accountHash = normalizeAccountHash(value);
  const publicKey = normalizePublicKey(value);
  const csprName = normalizeCsprName(value);
  const query = accountHash ?? publicKey ?? csprName ?? (isHexHash(value) ? value.toLowerCase() : value);

  if (kind === "account" || kind === "wallet") return { kind: "account", query };
  if (kind === "deploy") return { kind: "deploy", query };
  if (kind === "receipt") return { kind: "receipt", query };
  if (kind === "public-key" || kind === "public" || kind === "pk") return { kind: "public_key", query };
  if (kind === "name" || kind === "cspr-name") return { kind: "cspr_name", query };
  if (accountHash && /^account-hash-/i.test(value)) return { kind: "account", query };
  if (publicKey) return { kind: "public_key", query };
  if (csprName) return { kind: "cspr_name", query };
  return { kind: "unknown", query };
}

export async function resolveAccountIdentifier(parsed: ParsedExplorerQuery): Promise<AccountIdentifierResolution> {
  if (parsed.kind === "public_key") return resolvePublicKey(parsed.query);
  if (parsed.kind === "cspr_name") return resolveCsprName(parsed.query);
  return { accountHash: parsed.query, message: "", source: "resolved" };
}

export function isHexHash(query: string) {
  return /^[0-9a-f]{64}$/i.test(query);
}

export function normalizeAccountHash(query: string) {
  const match = query.match(/^account-hash-([0-9a-f]{64})$/i);
  return match ? match[1].toLowerCase() : undefined;
}

function normalizePublicKey(query: string) {
  const value = query.toLowerCase();
  if (/^01[0-9a-f]{64}$/.test(value)) return value;
  if (/^02[0-9a-f]{66}$/.test(value)) return value;
  return undefined;
}

function normalizeCsprName(query: string) {
  const value = query.toLowerCase();
  return isCsprName(value) ? value : undefined;
}

async function resolvePublicKey(publicKey: string): Promise<AccountIdentifierResolution> {
  if (!normalizePublicKey(publicKey)) {
    return { message: "Public-key search requires a full Casper public key hex value.", source: "not_found" };
  }
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) return unconfigured("public-key account lookup");

  try {
    const account = await new CsprCloudClient(config).getAccount(publicKey);
    return {
      accountHash: account.account_hash.toLowerCase(),
      message: "Resolved public key to a Casper account.",
      publicKey: account.public_key ?? publicKey,
      source: "resolved",
    };
  } catch (error) {
    return accountResolutionError(error, "No Casper account matched that public key.");
  }
}

async function resolveCsprName(name: string): Promise<AccountIdentifierResolution> {
  const normalized = normalizeCsprName(name);
  if (!normalized) return { message: "CSPR.name search requires a valid .cspr name.", source: "not_found" };
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) return unconfigured("CSPR.name lookup");

  try {
    const client = new CsprCloudClient(config);
    const resolution = await client.getCsprNameResolution(normalized);
    const account = await client.getAccount(resolution.resolved_hash);
    return {
      accountHash: account.account_hash.toLowerCase(),
      message: `Resolved ${resolution.name} to a Casper account.`,
      publicKey: account.public_key,
      source: "resolved",
    };
  } catch (error) {
    return accountResolutionError(error, "No Casper account matched that CSPR.name.");
  }
}

function unconfigured(label: string): AccountIdentifierResolution {
  return { message: `CSPR_CLOUD_API_KEY is required for ${label}.`, source: "unconfigured" };
}

function accountResolutionError(error: unknown, notFoundMessage: string): AccountIdentifierResolution {
  if (error instanceof CsprCloudRequestError && error.status === 404) {
    return { message: notFoundMessage, source: "not_found" };
  }
  return { message: "CSPR.cloud account identifier lookup is unavailable.", source: "upstream_error" };
}

function isCsprName(value: string) {
  if (value.length > 253) return false;
  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  return new RegExp(`^(?:${label}\\.)*${label}\\.cspr$`).test(value);
}
