import { describe, expect, it } from "vitest";

import { getWalletSigningReadiness } from "@/server/wallet-signing-readiness";

const baseConfig = {
  casperNetwork: "casper:casper-test",
  casperNodeRpcUrl: "https://node.testnet.casper.network/rpc",
  csprCloudApiKey: "cspr-cloud-token",
  csprCloudRestBaseUrl: "https://api.testnet.cspr.cloud",
  csprCloudStreamingBaseUrl: "wss://streaming.testnet.cspr.cloud",
  facilitatorUrl: "https://x402-facilitator.cspr.cloud",
  mcpUrl: "https://mcp.cspr.trade/mcp",
  paymentAsset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
  paymentAssetDecimals: 9,
  paymentAssetName: "Wrapped CSPR",
  paymentAssetSymbol: "WCSPR",
  paymentAmount: "7500000000",
  paymentTimeoutSeconds: 900,
  payeeAccountHash: "00payee",
  signerKeyAlgo: "secp256k1" as const,
  signerPrivateKeyPemPath: ".secrets/casper-phase0/payer.pem",
  wcsprDepositPaymentAmount: "5000000000",
  wcsprWrapAmount: "15000000000",
};

describe("wallet signing readiness", () => {
  it("marks the Testnet signer as integration-only and browser signing as deferred", () => {
    const readiness = getWalletSigningReadiness(baseConfig);

    expect(readiness).toMatchObject({
      browserWallet: {
        provider: "CSPR.click",
        status: "not_enabled",
      },
      currentPath: {
        mode: "testnet_signer",
        purpose: "integration_verification_only",
        status: "configured",
      },
      policyTiming: "before_signing",
      productionCustody: "not_claimed",
    });
    expect(readiness.browserWallet.futureGates.join(" ")).toContain("active wallet public key");
    expect(readiness.browserWallet.futureGates.join(" ")).toContain("user cancellation");
  });

  it("does not expose signer key material or signer file paths", () => {
    const readiness = getWalletSigningReadiness({
      ...baseConfig,
      signerPrivateKeyPem: "PRIVATE KEY MATERIAL",
      signerPrivateKeyPemPath: ".secrets/casper-phase0/payer.pem",
    });
    const serialized = JSON.stringify(readiness);

    expect(serialized).not.toContain("PRIVATE KEY MATERIAL");
    expect(serialized).not.toContain(".secrets");
    expect(serialized).not.toContain("payer.pem");
  });

  it("reports missing signer config without enabling browser signing", () => {
    const readiness = getWalletSigningReadiness({
      ...baseConfig,
      signerPrivateKeyPem: undefined,
      signerPrivateKeyPemPath: undefined,
    });

    expect(readiness.currentPath.status).toBe("missing_config");
    expect(readiness.browserWallet.status).toBe("not_enabled");
  });
});
