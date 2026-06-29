import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";
import { beforeAll, describe, expect, it } from "vitest";

import {
  CASPER_MESSAGE_PREFIX_FOR_TEST,
  createNonce,
  createOwnerSession,
  ownerSessionsEnabled,
  readNonceToken,
  readOwnerSession,
  verifyCasperMessageSignature,
} from "@/server/wallet-session";

// A real secret is required for the HMAC-signed nonce/session tokens.
beforeAll(() => {
  process.env.CASPER_GW_SESSION_SECRET = "test-session-secret-please-change-0123456789";
});

function signMessage(key: PrivateKey, message: string, withPrefix: boolean): string {
  const text = withPrefix ? CASPER_MESSAGE_PREFIX_FOR_TEST + message : message;
  const sig = key.sign(new TextEncoder().encode(text));
  return Buffer.from(sig).toString("hex");
}

describe("wallet-session", () => {
  it("enables sessions when a secret is configured", () => {
    expect(ownerSessionsEnabled()).toBe(true);
  });

  it("verifies an ed25519 message signature signed with the Casper Message prefix", () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const publicKey = key.publicKey.toHex();
    const message = "Casper GW sign-in nonce abc123";
    const signatureHex = signMessage(key, message, true);
    expect(verifyCasperMessageSignature({ publicKey, message, signatureHex })).toBe(true);
  });

  it("verifies a raw (unprefixed) ed25519 message signature too", () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const publicKey = key.publicKey.toHex();
    const message = "raw nonce";
    const signatureHex = signMessage(key, message, false);
    expect(verifyCasperMessageSignature({ publicKey, message, signatureHex })).toBe(true);
  });

  it("rejects a signature from a different key", () => {
    const signer = PrivateKey.generate(KeyAlgorithm.ED25519);
    const other = PrivateKey.generate(KeyAlgorithm.ED25519);
    const message = "Casper GW sign-in nonce abc123";
    const signatureHex = signMessage(signer, message, true);
    expect(
      verifyCasperMessageSignature({ publicKey: other.publicKey.toHex(), message, signatureHex }),
    ).toBe(false);
  });

  it("rejects a signature over a different message", () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const signatureHex = signMessage(key, "message A", true);
    expect(
      verifyCasperMessageSignature({ publicKey: key.publicKey.toHex(), message: "message B", signatureHex }),
    ).toBe(false);
  });

  it("issues and reads a nonce token", () => {
    const issued = createNonce();
    expect(issued).not.toBeNull();
    const parsed = readNonceToken(issued!.nonceToken);
    expect(parsed).not.toBeNull();
    expect(issued!.message).toContain(parsed!.nonce);
  });

  it("rejects a tampered nonce token", () => {
    const issued = createNonce();
    expect(readNonceToken(issued!.nonceToken + "x")).toBeNull();
  });

  it("creates a session and reads back the owner identity", () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const publicKey = key.publicKey.toHex();
    const session = createOwnerSession(publicKey);
    expect(session).not.toBeNull();
    const identity = readOwnerSession(session!.token);
    expect(identity?.publicKey).toBe(publicKey.toLowerCase());
    expect(identity?.accountHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects a tampered session token", () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const session = createOwnerSession(key.publicKey.toHex());
    expect(readOwnerSession(session!.token.slice(0, -2) + "zz")).toBeNull();
  });
});
