import type { PaymentPayload, PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";
import { readFileSync } from "node:fs";

import type { IntegrationRuntimeConfig, RuntimeConfig } from "./env";

export function buildPaymentRequirements(config: RuntimeConfig): PaymentRequirements {
  return {
    amount: config.paymentAmount,
    asset: config.paymentAsset,
    extra: {
      decimals: String(config.paymentAssetDecimals),
      name: config.paymentAssetName,
      symbol: config.paymentAssetSymbol,
      version: "1",
    },
    maxTimeoutSeconds: config.paymentTimeoutSeconds,
    network: config.casperNetwork as `${string}:${string}`,
    payTo: config.payeeAccountHash ?? "",
    scheme: "exact",
  };
}

/** Mode-agnostic Casper x402 client signer (matches casper-x402's ClientCasperSigner). */
export type ClientCasperSigner = {
  accountAddress: () => string;
  publicKey: () => string;
  signEIP712: (digest: Uint8Array) => Promise<Uint8Array>;
};

/**
 * Sign a fresh x402 payment payload against arbitrary requirements. Shared by the
 * console path (global config requirements) and the hosted server-signs path
 * (per-tool `tool_prices` requirements) — one signing engine, many price sources.
 */
export async function signPaymentPayload(
  requirements: PaymentRequirements,
  resourceUrl: string,
  signer: ClientCasperSigner,
) {
  const paymentRequired: PaymentRequired = {
    accepts: [requirements],
    resource: {
      description: "Casper GW paid tool call",
      mimeType: "application/json",
      url: resourceUrl,
    },
    x402Version: 2,
  };
  const [{ ExactCasperScheme }, { x402Client }] = await Promise.all([
    import("@make-software/casper-x402/exact/client"),
    import("@x402/fetch"),
  ]);
  const client = new x402Client().register("casper:*", new ExactCasperScheme(signer));
  const paymentPayload = (await client.createPaymentPayload(paymentRequired)) as PaymentPayload;

  return {
    paymentPayload,
    paymentRequired,
    paymentRequirements: requirements,
    payer: signer.accountAddress(),
  };
}

export async function createCasperPaymentPayload(
  config: IntegrationRuntimeConfig,
  resourceUrl: string,
  signer?: ClientCasperSigner,
) {
  return signPaymentPayload(buildPaymentRequirements(config), resourceUrl, signer ?? createSigner(config));
}

export function getConfiguredSignerAddress(config: IntegrationRuntimeConfig) {
  return createSigner(config).accountAddress();
}

/** Build a signer from PEM key material (used by the env test-signer and per-wallet hosted keys). */
export function signerFromPem(pem: string, keyAlgo: string): ClientCasperSigner {
  const algorithm = keyAlgo === "ed25519" ? KeyAlgorithm.ED25519 : KeyAlgorithm.SECP256K1;
  const privateKey = PrivateKey.fromPem(pem, algorithm);
  const accountAddress = `00${privateKey.publicKey.accountHash().toHex()}`;
  const publicKey = privateKey.publicKey.toHex();
  return {
    accountAddress: () => accountAddress,
    publicKey: () => publicKey,
    signEIP712: async (digest: Uint8Array) => privateKey.signAndAddAlgorithmBytes(digest),
  };
}

function createSigner(config: IntegrationRuntimeConfig): ClientCasperSigner {
  return signerFromPem(readSignerPem(config), config.signerKeyAlgo);
}

export function readSignerPem(config: IntegrationRuntimeConfig) {
  if (config.signerPrivateKeyPem) return config.signerPrivateKeyPem;
  if (config.signerPrivateKeyPemPath) return readFileSync(config.signerPrivateKeyPemPath, "utf8");
  throw new Error("Missing Casper Testnet signer PEM");
}
