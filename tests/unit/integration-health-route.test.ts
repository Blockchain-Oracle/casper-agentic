import { beforeEach, describe, expect, it, vi } from "vitest";

const facilitatorSupported = vi.fn();

vi.mock("@/server/x402-facilitator", () => ({
  X402FacilitatorClient: vi.fn(() => ({ supported: facilitatorSupported })),
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  facilitatorSupported.mockReset();
});

describe("integration health route", () => {
  it("reports streaming readiness without exposing CSPR.cloud credentials", async () => {
    process.env.CSPR_CLOUD_API_KEY = "secret-cspr-cloud-token";
    process.env.CSPR_CLOUD_STREAMING_BASE_URL = "wss://streaming.testnet.cspr.cloud";
    facilitatorSupported.mockResolvedValue({
      kinds: [{ network: "casper:casper-test", scheme: "exact" }],
    });

    const { GET } = await import("@/app/api/health/integrations/route");
    const response = await GET();
    const body = await response.json();

    expect(body.streaming).toMatchObject({
      configured: true,
      publicExplorerMode: "rest_feed",
      restFallback: "enabled",
      runtimeStatus: "not_enabled",
      source: "cspr_cloud_streaming",
    });
    expect(body.streaming.endpoint).toContain("/ft-token-actions");
    expect(body.streaming.endpoint).toContain("contract_package_hash=");
    expect(JSON.stringify(body)).not.toContain("secret-cspr-cloud-token");
  });

  it("does not echo malformed streaming URL userinfo in health JSON", async () => {
    process.env.CSPR_CLOUD_API_KEY = "secret-cspr-cloud-token";
    process.env.CSPR_CLOUD_STREAMING_BASE_URL = "https://api-user:api-pass@api.testnet.cspr.cloud";
    facilitatorSupported.mockResolvedValue({
      kinds: [{ network: "casper:casper-test", scheme: "exact" }],
    });

    const { GET } = await import("@/app/api/health/integrations/route");
    const response = await GET();
    const body = await response.json();

    expect(body.streaming).toMatchObject({
      configured: false,
      endpoint: null,
      error: "invalid_streaming_url",
      runtimeStatus: "not_enabled",
    });
    expect(JSON.stringify(body)).not.toContain("api-user");
    expect(JSON.stringify(body)).not.toContain("api-pass");
    expect(JSON.stringify(body)).not.toContain("secret-cspr-cloud-token");
  });
});
