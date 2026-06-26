import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * At-rest encryption for hosted agent-wallet private keys (Testnet only — NOT a
 * production custody claim). AES-256-GCM with a 32-byte master key supplied via
 * the CASPER_GW_WALLET_ENCRYPTION_KEY env var (base64 or hex). GCM gives integrity
 * for free: a tampered ciphertext/tag fails closed at decrypt.
 *
 * decryptWalletPem is the ONLY function that returns plaintext key material —
 * never log, persist, or include its return value in any response/receipt/export.
 */

const ALGORITHM = "aes-256-gcm";
const ENV_KEY = "CASPER_GW_WALLET_ENCRYPTION_KEY";
export const WALLET_KEY_VERSION = 1;

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

function masterKey(): Buffer {
  const raw = process.env[ENV_KEY];
  if (!raw) throw new Error(`${ENV_KEY} is not set`);
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`${ENV_KEY} must decode to 32 bytes (got ${key.length})`);
  }
  return key;
}

export function encryptWalletSecret(plaintext: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, masterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: WALLET_KEY_VERSION,
  };
}

export function decryptWalletSecret(secret: EncryptedSecret): string {
  const decipher = createDecipheriv(ALGORITHM, masterKey(), Buffer.from(secret.iv, "base64"));
  decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(secret.ciphertext, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}

export function hasWalletEncryptionKey(): boolean {
  return Boolean(process.env[ENV_KEY]);
}
