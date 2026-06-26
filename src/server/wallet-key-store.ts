import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db/client";
import { walletKeys } from "@/db/schema";

import { decryptWalletSecret, encryptWalletSecret } from "./wallet-key-crypto";

/** Encrypts and stores a hosted agent-wallet's PEM. Plaintext never leaves this call. */
export async function saveWalletKey(walletId: string, pem: string, algorithm: string) {
  const encrypted = encryptWalletSecret(pem);
  await getDb().insert(walletKeys).values({
    id: randomUUID(),
    walletId,
    algorithm,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    keyVersion: encrypted.keyVersion,
  });
}

/** Loads and decrypts a hosted wallet's PEM in-memory. Never log or persist the return value. */
export async function loadWalletKeyPem(walletId: string): Promise<{ pem: string; algorithm: string } | null> {
  const [row] = await getDb().select().from(walletKeys).where(eq(walletKeys.walletId, walletId)).limit(1);
  if (!row) return null;
  const pem = decryptWalletSecret({
    ciphertext: row.ciphertext,
    iv: row.iv,
    authTag: row.authTag,
    keyVersion: row.keyVersion,
  });
  return { pem, algorithm: row.algorithm };
}
