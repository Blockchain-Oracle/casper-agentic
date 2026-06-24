import { describe, expect, it } from "vitest";

import {
  buildCsprCloudStreamingUrl,
  getCsprCloudStreamingReadiness,
} from "@/server/cspr-cloud-streaming";

const config = {
  casperNetwork: "casper:casper-test",
  csprCloudApiKey: "secret-api-key",
  csprCloudStreamingBaseUrl: "wss://streaming.testnet.cspr.cloud",
  paymentAsset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
};

describe("CSPR.cloud streaming readiness", () => {
  it("builds the documented ft-token-actions stream URL without credentials", () => {
    const endpoint = buildCsprCloudStreamingUrl({
      baseUrl: config.csprCloudStreamingBaseUrl,
      contractPackageHash: config.paymentAsset,
    });
    const url = new URL(endpoint);

    expect(url.protocol).toBe("wss:");
    expect(url.pathname).toBe("/ft-token-actions");
    expect(url.searchParams.get("contract_package_hash")).toBe(config.paymentAsset);
    expect(endpoint).not.toContain(config.csprCloudApiKey);
  });

  it("strips URL userinfo because CSPR.cloud authorization belongs in headers", () => {
    const endpoint = buildCsprCloudStreamingUrl({
      baseUrl: "wss://api-user:api-pass@streaming.testnet.cspr.cloud",
      contractPackageHash: config.paymentAsset,
    });

    expect(endpoint).toBe(
      `wss://streaming.testnet.cspr.cloud/ft-token-actions?contract_package_hash=${config.paymentAsset}`,
    );
    expect(endpoint).not.toContain("api-user");
    expect(endpoint).not.toContain("api-pass");
  });

  it("rejects non-WebSocket streaming base URLs", () => {
    expect(() =>
      buildCsprCloudStreamingUrl({
        baseUrl: "https://api.testnet.cspr.cloud",
        contractPackageHash: config.paymentAsset,
      }),
    ).toThrow("must use wss");
  });

  it("keeps the public explorer on REST feed mode until streaming runtime is accepted", () => {
    const readiness = getCsprCloudStreamingReadiness(config);

    expect(readiness).toMatchObject({
      configured: true,
      publicExplorerMode: "rest_feed",
      restFallback: "enabled",
      runtimeStatus: "not_enabled",
      source: "cspr_cloud_streaming",
    });
    expect(readiness.dedupeKey).toEqual(["deploy_hash", "transform_idx"]);
    expect(readiness.nextGates.join(" ")).toContain("long-lived WebSocket consumer");
    expect(JSON.stringify(readiness)).not.toContain(config.csprCloudApiKey);
  });

  it("does not treat a missing API key as live streaming", () => {
    const readiness = getCsprCloudStreamingReadiness({ ...config, csprCloudApiKey: undefined });

    expect(readiness.configured).toBe(false);
    expect(readiness.runtimeStatus).toBe("not_enabled");
    expect(readiness.publicExplorerMode).toBe("rest_feed");
  });

  it("marks invalid streaming URL config unconfigured without echoing the raw value", () => {
    const readiness = getCsprCloudStreamingReadiness({
      ...config,
      csprCloudStreamingBaseUrl: "https://api-user:api-pass@api.testnet.cspr.cloud",
    });

    expect(readiness).toMatchObject({
      configured: false,
      endpoint: null,
      error: "invalid_streaming_url",
      runtimeStatus: "not_enabled",
    });
    expect(JSON.stringify(readiness)).not.toContain("api-user");
    expect(JSON.stringify(readiness)).not.toContain("api-pass");
  });
});
