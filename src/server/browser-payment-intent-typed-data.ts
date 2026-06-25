import type { PaymentRequirements } from "@x402/core/types";
import { randomBytes } from "node:crypto";

import type { CSPRClickSignTypedDataParams } from "@/lib/browser-x402-signing";

import { normalizeCasperAccountHash } from "./casper-account";

export function buildCSPRClickPaymentIntentParams(input: {
  nowSeconds?: number;
  nonceHex?: string;
  payerAccountHash: string;
  paymentRequirements: PaymentRequirements;
}): CSPRClickSignTypedDataParams {
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const validAfter = now - 600;
  const validBefore = now + input.paymentRequirements.maxTimeoutSeconds;
  const nonce = input.nonceHex ?? randomBytes(32).toString("hex");
  const extra = input.paymentRequirements.extra ?? {};
  const name = typeof extra.name === "string" && extra.name ? extra.name : "Wrapped CSPR";
  const version = typeof extra.version === "string" && extra.version ? extra.version : "1";

  return {
    options: {
      returnHashArtifacts: true,
    },
    typedData: {
      domain: {
        chain_name: input.paymentRequirements.network,
        contract_package_hash: input.paymentRequirements.asset,
        name,
        version,
      },
      message: {
        from: `00${normalizeCasperAccountHash(input.payerAccountHash)}`,
        nonce,
        to: input.paymentRequirements.payTo,
        validAfter,
        validBefore,
        value: safeUintNumber(input.paymentRequirements.amount),
      },
      primaryType: "TransferWithAuthorization",
      types: {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
    },
  };
}

function safeUintNumber(value: string) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("browser payment-intent amount is not safe to encode");
  return amount;
}
