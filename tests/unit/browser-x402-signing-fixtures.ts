import type { PaymentRequirements } from "@x402/core/types";
import { PublicKey } from "casper-js-sdk";

import type {
  CSPRClickSignTypedDataParams,
  CSPRClickSignTypedDataResult,
} from "@/lib/browser-x402-signing";

export const publicKey = `01${"ab".repeat(32)}`;
export const payerHash = accountHashForPublicKey(publicKey);
export const payerAddress = `00${payerHash}`;
export const payeeAddress = "00aa35d1c9dcaadea97c34d79b55b6af07aa9d760e5dd1aabf78a45fb39e0723fa";
export const signatureHex = `0x02${"cd".repeat(64)}`;
export const digest = `0x${"ef".repeat(32)}`;

export const requirements = {
  amount: "5",
  asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
  extra: { name: "Wrapped CSPR", version: "1" },
  maxTimeoutSeconds: 900,
  network: "casper:casper-test",
  payTo: payeeAddress,
  scheme: "exact",
} satisfies PaymentRequirements;

export const signParams = {
  typedData: {
    domain: {
      chain_name: requirements.network,
      contract_package_hash: requirements.asset,
      name: "Wrapped CSPR",
      version: "1",
    },
    message: {
      from: payerAddress,
      nonce: "17a0406a474c8dc0ac00889901001fdec05f21a0e204f99c8c5005c416bfe910",
      to: payeeAddress,
      validAfter: 1,
      validBefore: 901,
      value: 5,
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
  options: { returnHashArtifacts: true },
} satisfies CSPRClickSignTypedDataParams;

export const successfulSignature = {
  cancelled: false,
  digest,
  error: null,
  publicKey,
  signatureHex,
} satisfies CSPRClickSignTypedDataResult;

export function browserSigningInput(
  overrides: Partial<{
    accepted: PaymentRequirements;
    expectedAccountHash: string;
    expectedPublicKey: string;
    resourceUrl: string;
    signTypedDataParams: CSPRClickSignTypedDataParams;
    signTypedDataResult: CSPRClickSignTypedDataResult;
    x402Version: number;
  }> = {},
) {
  return {
    accepted: requirements,
    expectedAccountHash: payerHash,
    expectedPublicKey: publicKey,
    resourceUrl: "https://mcp.cspr.trade/mcp#get_quote",
    signTypedDataParams: signParams,
    signTypedDataResult: successfulSignature,
    x402Version: 2,
    ...overrides,
  };
}

export function accountHashForPublicKey(value: string) {
  return PublicKey.fromHex(value).accountHash().toHex();
}
