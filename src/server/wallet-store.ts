import { desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db/client";
import { agentWallets } from "@/db/schema";
import { accountHashFromPublicKey, normalizeCasperPublicKey } from "@/lib/casper-public-key";

import { casperAccountAliases, normalizeCasperAccountHash } from "./casper-account";

export interface CreateAgentWalletInput {
  accountHash: string;
  label: string;
  network: string;
  publicKey?: string;
  signingMode: string;
}

export async function createAgentWallet(input: CreateAgentWalletInput) {
  const values = normalizeAgentWalletInput(input);
  const [wallet] = await getDb()
    .insert(agentWallets)
    .values({ id: randomUUID(), ...values })
    .returning();
  return toAgentWalletView(wallet);
}

export async function listAgentWallets() {
  const rows = await getDb().select().from(agentWallets).orderBy(desc(agentWallets.createdAt));
  return rows.map(toAgentWalletView);
}

export async function getAgentWalletRecord(identifier: string) {
  const id = requiredText(identifier, "wallet id");
  const [byId] = await getDb().select().from(agentWallets).where(eq(agentWallets.id, id)).limit(1);
  if (byId) return byId;

  const [byAccount] = await getDb()
    .select()
    .from(agentWallets)
    .where(inArray(agentWallets.accountHash, casperAccountAliases(id)))
    .limit(1);
  return byAccount ?? null;
}

export function normalizeAgentWalletInput(input: CreateAgentWalletInput) {
  const accountHash = normalizeAccountHash(input.accountHash);
  const signingMode = normalizeSigningMode(input.signingMode);
  const publicKey = normalizeWalletPublicKey(input.publicKey, signingMode, accountHash);
  return {
    accountHash,
    label: requiredText(input.label, "wallet label"),
    network: requiredText(input.network, "wallet network"),
    publicKey,
    signingMode,
  };
}

export function toAgentWalletView(row: typeof agentWallets.$inferSelect) {
  return {
    accountHash: row.accountHash,
    id: row.id,
    label: row.label,
    network: row.network,
    publicKey: row.publicKey,
    signingMode: row.signingMode,
  };
}

function normalizeAccountHash(value: string) {
  return normalizeCasperAccountHash(value, "wallet account hash");
}

function normalizeSigningMode(value: string) {
  const signingMode = requiredText(value, "wallet signing mode");
  if (["browser-wallet", "test-signer", "external"].includes(signingMode)) return signingMode;
  throw new Error("wallet signing mode is not supported");
}

function normalizeWalletPublicKey(value: string | undefined, signingMode: string, accountHash: string) {
  const text = value?.trim();
  const publicKey = text ? normalizeCasperPublicKey(text) : null;
  if (text && !publicKey) throw new Error("wallet public key must be a Casper public key");
  if (signingMode === "browser-wallet" && !publicKey) {
    throw new Error("browser-wallet profiles require a CSPR.click public key");
  }
  if (publicKey && accountHashFromPublicKey(publicKey) !== accountHash) {
    throw new Error("wallet public key does not match account hash");
  }
  return publicKey ?? undefined;
}

function requiredText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}
