import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db/client";
import { agentWallets, paidCallAttempts, spendPolicies } from "@/db/schema";

import { casperAccountAliases } from "./casper-account";

const SPEND_STATUSES = ["settled", "raw_proof_unavailable", "upstream_failed"];

export interface CreateSpendPolicyInput {
  allowedAsset: string;
  allowedNetwork: string;
  allowedTools: unknown;
  dailyLimit?: unknown;
  disabled?: unknown;
  maxPerCall: unknown;
  sessionLimit?: unknown;
  walletId: string;
}

export interface StoredSpendPolicy {
  allowedAsset: string;
  allowedNetwork: string;
  allowedTools: string[];
  dailyLimit?: bigint;
  disabled: boolean;
  maxPerCall: bigint;
  sessionLimit?: bigint;
}

export interface SpendPolicyView {
  allowedAsset: string;
  allowedNetwork: string;
  allowedTools: string[];
  dailyLimit: string | null;
  disabled: boolean;
  id: string;
  maxPerCall: string;
  sessionLimit: string | null;
  walletId: string | null;
}

export async function createSpendPolicy(input: CreateSpendPolicyInput) {
  const values = normalizeSpendPolicyInput(input);
  const [policy] = await getDb()
    .insert(spendPolicies)
    .values({ id: randomUUID(), ...values })
    .returning();
  return toSpendPolicyView(policy);
}

export async function getLatestSpendPolicyForWalletId(walletId: string) {
  const [policy] = await getDb()
    .select()
    .from(spendPolicies)
    .where(eq(spendPolicies.walletId, requiredText(walletId, "wallet id")))
    .orderBy(desc(spendPolicies.createdAt))
    .limit(1);
  return policy ? toSpendPolicyView(policy) : null;
}

export async function getEffectiveSpendPolicyViewForWallet(accountHash: string) {
  const policy = await getLatestPolicyForAccountHash(accountHash);
  return policy ? toSpendPolicyView(policy) : null;
}

export async function getSpendPolicyForWallet(accountHash: string): Promise<StoredSpendPolicy | null> {
  const policy = await getLatestPolicyForAccountHash(accountHash);
  if (!policy) return null;

  return {
    allowedAsset: policy.allowedAsset,
    allowedNetwork: policy.allowedNetwork,
    allowedTools: Array.isArray(policy.allowedTools) ? policy.allowedTools.filter(isString) : [],
    dailyLimit: policy.dailyLimit ? BigInt(policy.dailyLimit) : undefined,
    disabled: policy.disabled,
    maxPerCall: BigInt(policy.maxPerCall),
    sessionLimit: policy.sessionLimit ? BigInt(policy.sessionLimit) : undefined,
  };
}

async function getLatestPolicyForAccountHash(accountHash: string) {
  const aliases = casperAccountAliases(accountHash);
  const wallets = await getDb()
    .select()
    .from(agentWallets)
    .where(inArray(agentWallets.accountHash, aliases));
  const walletIds = wallets.map((wallet) => wallet.id);
  if (!walletIds.length) return null;

  const [policy] = await getDb()
    .select()
    .from(spendPolicies)
    .where(inArray(spendPolicies.walletId, walletIds))
    .orderBy(desc(spendPolicies.createdAt))
    .limit(1);
  return policy ?? null;
}

export async function getWalletDailySpend(accountHash: string, asset: string, network: string) {
  const aliases = casperAccountAliases(accountHash);
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [row] = await getDb()
    .select({
      total: sql<string>`coalesce(sum(${paidCallAttempts.amount}), 0)`,
    })
    .from(paidCallAttempts)
    .where(
      and(
        inArray(paidCallAttempts.walletAccountHash, aliases),
        inArray(paidCallAttempts.status, SPEND_STATUSES),
        eq(paidCallAttempts.asset, asset),
        eq(paidCallAttempts.network, network),
        gte(paidCallAttempts.createdAt, startOfDay),
      ),
    );
  return BigInt(row?.total ?? "0");
}

export function normalizeSpendPolicyInput(input: CreateSpendPolicyInput) {
  return {
    allowedAsset: requiredText(input.allowedAsset, "allowed asset"),
    allowedNetwork: requiredText(input.allowedNetwork, "allowed network"),
    allowedTools: normalizeAllowedTools(input.allowedTools),
    dailyLimit: optionalAmount(input.dailyLimit, "daily limit"),
    disabled: Boolean(input.disabled),
    maxPerCall: requiredAmount(input.maxPerCall, "max per call"),
    sessionLimit: optionalAmount(input.sessionLimit, "session limit"),
    walletId: requiredText(input.walletId, "wallet id"),
  };
}

function toSpendPolicyView(row: typeof spendPolicies.$inferSelect): SpendPolicyView {
  return {
    allowedAsset: row.allowedAsset,
    allowedNetwork: row.allowedNetwork,
    allowedTools: Array.isArray(row.allowedTools) ? row.allowedTools.filter(isString) : [],
    dailyLimit: row.dailyLimit,
    disabled: row.disabled,
    id: row.id,
    maxPerCall: row.maxPerCall,
    sessionLimit: row.sessionLimit,
    walletId: row.walletId,
  };
}

function normalizeAllowedTools(value: unknown) {
  if (!Array.isArray(value)) throw new Error("allowed tools must be an array");
  return Array.from(
    new Set(
      value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean),
    ),
  );
}

function optionalAmount(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredAmount(value, label);
}

function requiredAmount(value: unknown, label: string) {
  const text = requiredText(String(value ?? ""), label);
  if (!/^[0-9]+$/.test(text)) throw new Error(`${label} must be an integer atomic amount`);
  const amount = BigInt(text);
  if (amount <= BigInt(0)) throw new Error(`${label} must be greater than zero`);
  return text;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function requiredText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}
