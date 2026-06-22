import { afterEach, describe, expect, it } from "vitest";

import { getIntegrationConfigStatus, getRuntimeConfig, requireIntegrationConfig } from "@/server/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("integration env preflight", () => {
  it("reports every required missing value without exposing secrets", () => {
    delete process.env.CSPR_CLOUD_API_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.CASPER_PAYEE_ACCOUNT_HASH;
    delete process.env.CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM;

    expect(getIntegrationConfigStatus().missing).toEqual([
      "CSPR_CLOUD_API_KEY",
      "DATABASE_URL",
      "CASPER_PAYEE_ACCOUNT_HASH",
      "CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM",
    ]);
    expect(() => requireIntegrationConfig()).toThrow("Missing integration configuration");
  });

  it("uses Casper Testnet and WCSPR defaults", () => {
    const config = getRuntimeConfig();

    expect(config.casperNetwork).toBe("casper:casper-test");
    expect(config.paymentAsset).toBe("3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e");
    expect(config.facilitatorUrl).toBe("https://x402-facilitator.cspr.cloud");
  });
});
