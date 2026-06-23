import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  SupportedResponse,
  VerifyResponse,
} from "@x402/core/types";

import type { RuntimeConfig } from "./env";

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
