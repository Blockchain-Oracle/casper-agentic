import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decryptWalletSecret, encryptWalletSecret, hasWalletEncryptionKey } from "@/server/wallet-key-crypto";

const KEY_B64 = Buffer.alloc(32, 7).toString("base64");
// Deliberately not a real PEM block (avoids tripping the secret-scan guard).
const SECRET = "ed25519-test-key-material-not-a-real-pem";

describe("wallet-key-crypto", () => {
  beforeEach(() => {
    process.env.CASPER_GW_WALLET_ENCRYPTION_KEY = KEY_B64;
  });
  afterEach(() => {
    delete process.env.CASPER_GW_WALLET_ENCRYPTION_KEY;
  });

  it("round-trips an encrypted secret", () => {
    const encrypted = encryptWalletSecret(SECRET);
    expect(encrypted.ciphertext).not.toContain(SECRET);
    expect(encrypted.keyVersion).toBe(1);
    expect(decryptWalletSecret(encrypted)).toBe(SECRET);
  });

  it("uses a fresh iv per encryption", () => {
    const a = encryptWalletSecret(SECRET);
    const b = encryptWalletSecret(SECRET);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("fails closed when the auth tag is tampered with", () => {
    const encrypted = encryptWalletSecret(SECRET);
    const tampered = { ...encrypted, authTag: Buffer.alloc(16, 0).toString("base64") };
    expect(() => decryptWalletSecret(tampered)).toThrow();
  });

  it("fails closed when the ciphertext is tampered with", () => {
    const encrypted = encryptWalletSecret(SECRET);
    const bytes = Buffer.from(encrypted.ciphertext, "base64");
    bytes[0] ^= 0xff;
    const tampered = { ...encrypted, ciphertext: bytes.toString("base64") };
    expect(() => decryptWalletSecret(tampered)).toThrow();
  });

  it("throws when the encryption key is missing", () => {
    delete process.env.CASPER_GW_WALLET_ENCRYPTION_KEY;
    expect(hasWalletEncryptionKey()).toBe(false);
    expect(() => encryptWalletSecret(SECRET)).toThrow(/CASPER_GW_WALLET_ENCRYPTION_KEY/);
  });

  it("rejects a key that is not 32 bytes", () => {
    process.env.CASPER_GW_WALLET_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");
    expect(() => encryptWalletSecret(SECRET)).toThrow(/32 bytes/);
  });
});
