import type { RuntimeConfig } from "./env";
import { getRuntimeConfig } from "./env";

export const CSPR_CLOUD_FT_ACTIONS_STREAM_PATH = "/ft-token-actions";

export interface CsprCloudStreamingReadiness {
  configured: boolean;
  dedupeKey: string[];
  endpoint: string | null;
  error?: "invalid_streaming_url";
  filters: {
    contractPackageHash: string;
    network: string;
  };
  limitations: string[];
  nextGates: string[];
  publicExplorerMode: "rest_feed";
  restFallback: "enabled";
  runtimeStatus: "not_enabled";
  source: "cspr_cloud_streaming";
}

export function getCsprCloudStreamingReadiness(
  config: Pick<
    RuntimeConfig,
    "casperNetwork" | "csprCloudApiKey" | "csprCloudStreamingBaseUrl" | "paymentAsset"
  > = getRuntimeConfig(),
): CsprCloudStreamingReadiness {
  const endpoint = safeStreamingEndpoint(config.csprCloudStreamingBaseUrl, config.paymentAsset);
  return {
    configured: Boolean(config.csprCloudApiKey && endpoint),
    dedupeKey: ["deploy_hash", "transform_idx"],
    endpoint,
    error: endpoint ? undefined : "invalid_streaming_url",
    filters: {
      contractPackageHash: config.paymentAsset,
      network: config.casperNetwork,
    },
    limitations: [
      "Streaming consumes CSPR.cloud WebSocket events with server-side authorization.",
      "Public explorer feed remains REST-backed until a long-lived runtime is accepted.",
      "Consumers must tolerate reconnects, duplicate events, and temporary connection closures.",
    ],
    nextGates: [
      "Accept runtime ownership for a long-lived WebSocket consumer.",
      "Persist and deduplicate streamed ft-token-actions before rendering them.",
      "Verify deployment scheduler/process behavior before claiming live updates.",
    ],
    publicExplorerMode: "rest_feed",
    restFallback: "enabled",
    runtimeStatus: "not_enabled",
    source: "cspr_cloud_streaming",
  };
}

export function buildCsprCloudStreamingUrl(input: { baseUrl: string; contractPackageHash?: string }) {
  const url = new URL(CSPR_CLOUD_FT_ACTIONS_STREAM_PATH, input.baseUrl);
  if (url.protocol !== "wss:") {
    throw new Error("CSPR_CLOUD_STREAMING_BASE_URL must use wss:");
  }
  url.username = "";
  url.password = "";
  if (input.contractPackageHash) {
    url.searchParams.set("contract_package_hash", input.contractPackageHash);
  }
  return url.toString();
}

function safeStreamingEndpoint(baseUrl: string, contractPackageHash: string) {
  try {
    return buildCsprCloudStreamingUrl({ baseUrl, contractPackageHash });
  } catch {
    return null;
  }
}
