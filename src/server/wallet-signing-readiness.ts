import type { RuntimeConfig } from "./env";
import { getIntegrationConfigStatus, getRuntimeConfig } from "./env";

export interface WalletSigningReadiness {
  browserWallet: {
    futureGates: string[];
    provider: "CSPR.click";
    status: "not_enabled";
  };
  currentPath: {
    mode: "testnet_signer";
    purpose: "integration_verification_only";
    status: "configured" | "missing_config";
  };
  policyTiming: "before_signing";
  productionCustody: "not_claimed";
}

export function getWalletSigningReadiness(config: RuntimeConfig = getRuntimeConfig()): WalletSigningReadiness {
  const integrationStatus = getIntegrationConfigStatus(config);
  const signerMissing = integrationStatus.missing.some((item) =>
    item.includes("CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM"),
  );

  return {
    browserWallet: {
      futureGates: [
        "Install and configure CSPR.click SDK.",
        "Require the active wallet public key to match the selected wallet profile.",
        "Run spend policy before requesting wallet approval.",
        "Handle user cancellation, network errors, timeout, sent, and processed states.",
        "Resolve Casper proof through CSPR.cloud before claiming settlement.",
      ],
      provider: "CSPR.click",
      status: "not_enabled",
    },
    currentPath: {
      mode: "testnet_signer",
      purpose: "integration_verification_only",
      status: signerMissing ? "missing_config" : "configured",
    },
    policyTiming: "before_signing",
    productionCustody: "not_claimed",
  };
}
