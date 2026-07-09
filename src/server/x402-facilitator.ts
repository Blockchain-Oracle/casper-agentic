import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  SupportedResponse,
  VerifyResponse,
} from "@x402/core/types";
import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";

import type { IntegrationRuntimeConfig, RuntimeConfig } from "./env";
import { readSignerPem } from "./x402-payment";

export interface FacilitatorRequestBody {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}

export class X402FacilitatorClient {
  constructor(
    private readonly config: Pick<RuntimeConfig, "csprCloudApiKey" | "facilitatorUrl">,
  ) {}

  async supported() {
    return this.request<SupportedResponse>("/supported", { method: "GET" });
  }

  async verify(body: FacilitatorRequestBody) {
    return this.request<VerifyResponse>("/verify", {
      body: JSON.stringify(body),
      method: "POST",
    }, true);
  }

  async settle(body: FacilitatorRequestBody) {
    return this.request<SettleResponse>("/settle", {
      body: JSON.stringify(body),
      method: "POST",
    }, true);
  }

  private async request<T>(path: string, init: RequestInit, preserveBodyFailure = false) {
    if (!this.config.csprCloudApiKey) throw new Error("CSPR_CLOUD_API_KEY is required");
    const response = await fetch(`${this.config.facilitatorUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        authorization: this.config.csprCloudApiKey,
        "content-type": "application/json",
        ...init.headers,
      },
    });

    const body = (await response.json()) as T;
    if (!response.ok && !preserveBodyFailure) {
      throw new Error(`x402 facilitator ${path} failed with ${response.status}`);
    }
    return body;
  }
}

export function shouldSettleWithGatewaySigner(response: SettleResponse) {
  if (response.success) return false;
  const details = `${response.errorReason ?? ""} ${errorMessage(response)}`.toLowerCase();
  return details.includes("account_put_transaction") && details.includes("insufficient balance");
}

export async function settleWithGatewaySigner(config: IntegrationRuntimeConfig, body: FacilitatorRequestBody) {
  const [{ ExactCasperScheme }, { toFacilitatorCasperSigner }] = await Promise.all([
    import("@make-software/casper-x402/exact/facilitator"),
    import("@make-software/casper-x402"),
  ]);
  const algorithm = config.signerKeyAlgo === "ed25519" ? KeyAlgorithm.ED25519 : KeyAlgorithm.SECP256K1;
  const privateKey = PrivateKey.fromPem(readSignerPem(config), algorithm);
  const signer = await toFacilitatorCasperSigner(privateKey, config.casperNodeRpcUrl);
  const scheme = new ExactCasperScheme(signer);
  return scheme.settle(body.paymentPayload, body.paymentRequirements);
}

function errorMessage(response: SettleResponse) {
  const record = response as SettleResponse & { errorMessage?: string };
  return record.errorMessage ?? "";
}
