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
    delete process.env.CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM_PATH;

    expect(getIntegrationConfigStatus().missing).toEqual([
      "CSPR_CLOUD_API_KEY",
      "DATABASE_URL",
      "CASPER_PAYEE_ACCOUNT_HASH",
      "CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM or CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM_PATH",
    ]);
    expect(() => requireIntegrationConfig()).toThrow("Missing integration configuration");
  });

  it("accepts a local signer PEM path instead of multiline PEM content", () => {
    process.env.CSPR_CLOUD_API_KEY = "token";
    process.env.DATABASE_URL = "postgres://casper_gw:casper_gw@127.0.0.1:5432/casper_gw";
    process.env.CASPER_PAYEE_ACCOUNT_HASH = "00payee";
    delete process.env.CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM;
    process.env.CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM_PATH = ".secrets/casper-phase0/payer.pem";

    const config = requireIntegrationConfig();

    expect(getIntegrationConfigStatus().configured).toBe(true);
    expect(config.signerPrivateKeyPemPath).toBe(".secrets/casper-phase0/payer.pem");
  });

  it("uses Casper Testnet and WCSPR defaults", () => {
    const config = getRuntimeConfig();

    expect(config.casperNetwork).toBe("casper:casper-test");
    expect(config.paymentAsset).toBe("3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e");
    expect(config.facilitatorUrl).toBe("https://x402-facilitator.cspr.cloud");
    expect(config.csprCloudStreamingBaseUrl).toBe("wss://streaming.testnet.cspr.cloud");
  });
});
