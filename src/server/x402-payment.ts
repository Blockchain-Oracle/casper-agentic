import type { PaymentPayload, PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";

import type { RuntimeConfig } from "./env";

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

export async function createCasperPaymentPayload(
  config: RuntimeConfig & { signerPrivateKeyPem: string },
  resourceUrl: string,
) {
  const requirements = buildPaymentRequirements(config);
  const paymentRequired: PaymentRequired = {
    accepts: [requirements],
    resource: {
      description: "Casper GW Phase 0 paid tool call",
      mimeType: "application/json",
      url: resourceUrl,
    },
    x402Version: 2,
  };
  const signer = createSigner(config);
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

export function getConfiguredSignerAddress(config: RuntimeConfig & { signerPrivateKeyPem: string }) {
  return createSigner(config).accountAddress();
}

function createSigner(config: RuntimeConfig & { signerPrivateKeyPem: string }) {
  const algorithm = config.signerKeyAlgo === "ed25519" ? KeyAlgorithm.ED25519 : KeyAlgorithm.SECP256K1;
  const privateKey = PrivateKey.fromPem(config.signerPrivateKeyPem, algorithm);
  const accountAddress = `00${privateKey.publicKey.accountHash().toHex()}`;
  const publicKey = privateKey.publicKey.toHex();
  return {
    accountAddress: () => accountAddress,
    publicKey: () => publicKey,
    signEIP712: async (digest: Uint8Array) => privateKey.signAndAddAlgorithmBytes(digest),
  };
}
