import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PublicKey } from "casper-js-sdk";

import { accountHashFromPublicKey, normalizeCasperPublicKey } from "@/lib/casper-public-key";

// Owner identity = a CSPR.click wallet. The browser asks the wallet to sign a
// short server-issued nonce message (client.signMessage); the server verifies the
// Casper signature with the public key and issues an HMAC-signed session cookie.
// This is identity/ownership only — it never signs or settles an x402 payment.

export const OWNER_SESSION_COOKIE = "casper_gw_owner";
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes to sign
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CASPER_MESSAGE_PREFIX = "Casper Message:\n";
// Exported only so the unit test can sign with the exact same bytes the server expects.
export const CASPER_MESSAGE_PREFIX_FOR_TEST = CASPER_MESSAGE_PREFIX;

export type OwnerIdentity = { publicKey: string; accountHash: string };

function sessionSecret(): string | null {
  const secret = process.env.CASPER_GW_SESSION_SECRET || process.env.CASPER_GW_ADMIN_TOKEN;
  return secret && secret.length >= 16 ? secret : null;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload: object): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function unsign<T>(token: string | undefined | null): T | null {
  const secret = sessionSecret();
  if (!secret || !token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp?: number };
    if (typeof parsed.exp === "number" && Date.now() > parsed.exp) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

export function ownerSessionsEnabled(): boolean {
  return sessionSecret() !== null;
}

export function buildSignInMessage(nonce: string, exp: number): string {
  return [
    "Casper GW wants you to sign in to manage your servers and keys.",
    "",
    `Nonce: ${nonce}`,
    `Expires: ${new Date(exp).toISOString()}`,
  ].join("\n");
}

export function createNonce(): { nonceToken: string; message: string } | null {
  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + NONCE_TTL_MS;
  const message = buildSignInMessage(nonce, exp);
  const nonceToken = sign({ kind: "nonce", nonce, exp });
  if (!nonceToken) return null;
  return { nonceToken, message };
}

export function readNonceToken(nonceToken: string): { nonce: string; exp: number } | null {
  const payload = unsign<{ kind?: string; nonce?: string; exp?: number }>(nonceToken);
  if (!payload || payload.kind !== "nonce" || !payload.nonce || typeof payload.exp !== "number") return null;
  return { nonce: payload.nonce, exp: payload.exp };
}

function withAlgorithmByte(sigHex: string, algoByte: "01" | "02"): string {
  const hex = sigHex.toLowerCase();
  // casper-js-sdk verifySignature expects the signature prefixed with its algorithm
  // byte (01 ed25519 / 02 secp256k1). A raw 64-byte signature (128 hex) gets the byte
  // prepended; an already-prefixed signature (130 hex) is used as-is.
  if (hex.length === 128) return algoByte + hex;
  return hex;
}

export function verifyCasperMessageSignature(input: {
  publicKey: string;
  message: string;
  signatureHex: string;
}): boolean {
  const publicKeyHex = normalizeCasperPublicKey(input.publicKey);
  const sigHexRaw = input.signatureHex?.trim().replace(/^0x/i, "");
  if (!publicKeyHex || !sigHexRaw) return false;
  let key: PublicKey;
  try {
    key = PublicKey.fromHex(publicKeyHex);
  } catch {
    return false;
  }
  const algoByte = publicKeyHex.startsWith("01") ? "01" : "02";
  const sigHex = withAlgorithmByte(sigHexRaw, algoByte);
  let sig: Uint8Array;
  try {
    sig = Uint8Array.from(Buffer.from(sigHex, "hex"));
  } catch {
    return false;
  }
  // Casper wallets sign the message wrapped with the "Casper Message:" header; accept
  // either the wrapped or raw bytes so we stay robust across wallet/SDK variants.
  const candidates = [CASPER_MESSAGE_PREFIX + input.message, input.message];
  for (const text of candidates) {
    try {
      if (key.verifySignature(new TextEncoder().encode(text), sig)) return true;
    } catch {
      // try next candidate
    }
  }
  return false;
}

export function createOwnerSession(publicKey: string): { token: string; identity: OwnerIdentity } | null {
  const normalized = normalizeCasperPublicKey(publicKey);
  const accountHash = accountHashFromPublicKey(publicKey);
  if (!normalized || !accountHash) return null;
  const token = sign({ kind: "session", pk: normalized, ah: accountHash, exp: Date.now() + SESSION_TTL_MS });
  if (!token) return null;
  return { token, identity: { publicKey: normalized, accountHash } };
}

export function readOwnerSession(token: string | undefined | null): OwnerIdentity | null {
  const payload = unsign<{ kind?: string; pk?: string; ah?: string }>(token ?? null);
  if (!payload || payload.kind !== "session" || !payload.pk || !payload.ah) return null;
  return { publicKey: payload.pk, accountHash: payload.ah };
}
