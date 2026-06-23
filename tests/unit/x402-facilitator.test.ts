import { afterEach, describe, expect, it, vi } from "vitest";

import { X402FacilitatorClient } from "@/server/x402-facilitator";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CSPR.cloud x402 facilitator client", () => {
  it("sends auth headers and returns body-level supported data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        kinds: [{ network: "casper:casper-test", scheme: "exact" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new X402FacilitatorClient({
      csprCloudApiKey: "token",
      facilitatorUrl: "https://x402-facilitator.cspr.cloud",
    });

    await expect(client.supported()).resolves.toEqual({
      kinds: [{ network: "casper:casper-test", scheme: "exact" }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://x402-facilitator.cspr.cloud/supported",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "token" }),
        method: "GET",
      }),
    );
  });

  it("preserves a failed verify response body when HTTP succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ invalidReason: "insufficient funds", isValid: false })),
    );

    const client = new X402FacilitatorClient({
      csprCloudApiKey: "token",
      facilitatorUrl: "https://x402-facilitator.cspr.cloud",
    });
    const response = await client.verify({
      paymentPayload: {} as never,
      paymentRequirements: {} as never,
    });

    expect(response).toMatchObject({ invalidReason: "insufficient funds", isValid: false });
  });

  it("preserves a failed verify response body when HTTP fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ invalidReason: "signature expired", isValid: false }, { status: 402 }),
      ),
    );

    const client = new X402FacilitatorClient({
      csprCloudApiKey: "token",
      facilitatorUrl: "https://x402-facilitator.cspr.cloud",
    });

    await expect(
      client.verify({ paymentPayload: {} as never, paymentRequirements: {} as never }),
    ).resolves.toMatchObject({ invalidReason: "signature expired", isValid: false });
  });

  it("preserves a failed settle response body when HTTP fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ errorReason: "insufficient_funds", success: false }, { status: 402 }),
      ),
    );

    const client = new X402FacilitatorClient({
      csprCloudApiKey: "token",
      facilitatorUrl: "https://x402-facilitator.cspr.cloud",
    });

    await expect(
      client.settle({ paymentPayload: {} as never, paymentRequirements: {} as never }),
    ).resolves.toMatchObject({ errorReason: "insufficient_funds", success: false });
  });
});
