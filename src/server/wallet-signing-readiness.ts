import { CSPRCLICK_SCRIPT_ID, CSPRCLICK_SCRIPT_SRC, getCSPRClickPublicConfig } from "@/lib/csprclick-browser";

import type { RuntimeConfig } from "./env";
import { getIntegrationConfigStatus, getRuntimeConfig } from "./env";

export interface WalletSigningReadiness {
  browserWallet: {
    futureGates: string[];
    provider: "CSPR.click";
    runtime: {
      appConfigured: boolean;
      loadMode: "cdn";
      scriptId: string;
      scriptSrc: string;
    };
    status: "configured" | "not_enabled";
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
  const browserConfig = getCSPRClickPublicConfig(process.env);
  const signerMissing = integrationStatus.missing.some((item) =>
    item.includes("CASPER_TESTNET_SIGNER_PRIVATE_KEY_PEM"),
  );

  return {
    browserWallet: {
      futureGates: browserFutureGates(browserConfig.status === "configured"),
      provider: "CSPR.click",
      runtime: {
        appConfigured: browserConfig.status === "configured",
        loadMode: "cdn",
        scriptId: CSPRCLICK_SCRIPT_ID,
        scriptSrc: CSPRCLICK_SCRIPT_SRC,
      },
      status: browserConfig.status === "configured" ? "configured" : "not_enabled",
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

function browserFutureGates(configured: boolean) {
  const gates = [
    "Require the active wallet public key to match the selected wallet profile.",
    "Run spend policy before requesting wallet approval.",
    "Handle user cancellation, network errors, timeout, sent, and processed states.",
    "Resolve Casper proof through CSPR.cloud before claiming settlement.",
  ];
  return configured ? gates : ["Configure public CSPR.click app id.", ...gates];
}
