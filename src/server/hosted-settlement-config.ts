import { getRuntimeConfig, type RuntimeConfig } from "./env";

export type HostedSettlementConfig = RuntimeConfig & { csprCloudApiKey: string };

export function requireHostedSettlementConfig(): HostedSettlementConfig {
  const config = getRuntimeConfig();
  if (!config.csprCloudApiKey) throw new Error("CSPR_CLOUD_API_KEY is required");
  return config as HostedSettlementConfig;
}
