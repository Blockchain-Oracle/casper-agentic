import { describe, expect, it } from "vitest";

import {
  buildBrowserX402PaymentPayload,
  validateCSPRClickActivePublicKey,
} from "@/lib/browser-x402-signing";
import {
  accountHashForPublicKey,
  browserSigningInput,
  digest,
  payerAddress,
  payeeAddress,
  publicKey,
  requirements,
  signParams,
  signatureHex,
} from "./browser-x402-signing-fixtures";

describe("browser x402 signing contract", () => {
  it("builds a Casper x402 payment payload from a successful CSPR.click typed-data signature", () => {
    const result = buildBrowserX402PaymentPayload(browserSigningInput());

    expect(result).toMatchObject({ digest, publicKey: publicKey.toLowerCase(), status: "signed" });
    expect(result.status === "signed" ? result.paymentPayload : null).toEqual({
      accepted: requirements,
      payload: {
        authorization: {
          from: payerAddress,
          nonce: signParams.typedData.message.nonce,
          to: payeeAddress,
          validAfter: "1",
          validBefore: "901",
          value: "5",
        },
        publicKey: publicKey.toLowerCase(),
        signature: signatureHex.slice(2).toLowerCase(),
      },
      resource: { url: "https://mcp.cspr.trade/mcp#get_quote" },
      x402Version: 2,
    });
  });

  it("returns a cancelled result without constructing a payment payload", () => {
    const result = buildBrowserX402PaymentPayload(
      browserSigningInput({
        signTypedDataResult: { cancelled: true, digest: null, error: null, publicKey: null, signatureHex: null },
      }),
    );

    expect(result).toEqual({ message: "CSPR.click signing was cancelled", reason: "user_cancelled", status: "cancelled" });
  });

  it("preserves CSPR.click error code and avoids a payment payload", () => {
    const result = buildBrowserX402PaymentPayload(
      browserSigningInput({
        signTypedDataResult: {
          cancelled: false,
          digest: null,
          error: "Account is not authorized",
          errorCode: "NOT_AUTHORIZED",
          publicKey: null,
          signatureHex: null,
        },
      }),
    );

    expect(result).toEqual({
      errorCode: "NOT_AUTHORIZED",
      message: "Account is not authorized",
      reason: "signature_error",
      status: "failed",
    });
  });

  it("rejects malformed success responses before a payment payload exists", () => {
    const result = buildBrowserX402PaymentPayload(
      browserSigningInput({
        signTypedDataResult: { cancelled: false, digest, error: null, publicKey, signatureHex: "not-hex" },
      }),
    );

    expect(result).toEqual({
      message: "CSPR.click returned a malformed signature",
      reason: "malformed_result",
      status: "failed",
    });
  });

  it("fails closed when CSPR.click active public key does not match the selected wallet", () => {
    expect(
      validateCSPRClickActivePublicKey({
        activePublicKey: `01${"cd".repeat(32)}`,
        expectedPublicKey: publicKey,
      }),
    ).toEqual({
      message: "CSPR.click active account does not match the selected Casper GW wallet",
      reason: "active_public_key_mismatch",
      status: "failed",
    });
  });

  it("rejects malformed CSPR.click public keys before constructing a payment payload", () => {
    const result = buildBrowserX402PaymentPayload(
      browserSigningInput({
        signTypedDataResult: {
          cancelled: false,
          digest,
          error: null,
          publicKey: "02aa",
          signatureHex,
        },
      }),
    );

    expect(result).toEqual({
      message: "CSPR.click returned a malformed signature",
      reason: "malformed_result",
      status: "failed",
    });
  });

  it("rejects a signature from a different active public key", () => {
    const otherPublicKey = `01${"cd".repeat(32)}`;
    const result = buildBrowserX402PaymentPayload(
      browserSigningInput({
        signTypedDataResult: {
          cancelled: false,
          digest,
          error: null,
          publicKey: otherPublicKey,
          signatureHex,
        },
      }),
    );

    expect(result).toEqual({
      message: "CSPR.click signature public key does not match the selected Casper GW wallet",
      reason: "active_public_key_mismatch",
      status: "failed",
    });
  });

  it("rejects typed data whose from account is not the selected wallet account", () => {
    const otherAddress = `00${accountHashForPublicKey(`01${"cd".repeat(32)}`)}`;
    const result = buildBrowserX402PaymentPayload(
      browserSigningInput({
        signTypedDataParams: {
          ...signParams,
          typedData: {
            ...signParams.typedData,
            message: { ...signParams.typedData.message, from: otherAddress },
          },
        },
      }),
    );

    expect(result).toEqual({
      message: "CSPR.click typed-data authorization is not for the selected Casper GW wallet",
      reason: "authorization_account_mismatch",
      status: "failed",
    });
  });
});
