import { desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb, hasDatabaseUrl } from "@/db/client";
import { auditEvents, casperProofs, paidCallAttempts, policyDecisions, x402Records } from "@/db/schema";
import { receipts as fixtureReceipts } from "@/lib/fixtures";
import { buildReceiptDetail } from "@/lib/receipt-detail";
import { buildPersistedReceiptDetail } from "@/lib/persisted-receipt-detail";
import type { Receipt, ReceiptDetail, ReceiptStatus } from "@/lib/types";

export interface PersistAttemptInput {
  amount: string;
  asset: string;
  client: string;
  errorReason?: string;
  network: string;
  providerName: string;
  redactedInput: Record<string, unknown>;
  redactedOutput?: Record<string, unknown>;
  status: ReceiptStatus;
  toolName: string;
  walletAccountHash: string;
}

export async function listReceiptDetails() {
  if (!hasDatabaseUrl()) return fixtureReceipts.map((receipt) => buildReceiptDetail(receipt));
  const rows = await getDb().select().from(paidCallAttempts).orderBy(desc(paidCallAttempts.createdAt)).limit(50);
  const ids = rows.map((row) => row.id);
  const proofs = ids.length
    ? await getDb().select().from(casperProofs).where(inArray(casperProofs.attemptId, ids))
    : [];
  const policies = ids.length
    ? await getDb().select().from(policyDecisions).where(inArray(policyDecisions.attemptId, ids))
    : [];
  const x402s = ids.length
    ? await getDb().select().from(x402Records).where(inArray(x402Records.attemptId, ids)).orderBy(desc(x402Records.createdAt))
    : [];
  return rows.map((row) => {
    const proof = proofs.find((item) => item.attemptId === row.id);
    return buildPersistedReceiptDetail(fromAttemptRow(row, proof?.deployHash ?? null), {
      casperProof: proof,
      policyDecision: policies.find((item) => item.attemptId === row.id),
      x402Records: x402s.filter((item) => item.attemptId === row.id),
    });
  });
}

export async function getReceiptDetail(id: string): Promise<ReceiptDetail | undefined> {
  if (!hasDatabaseUrl()) {
    const receipt = fixtureReceipts.find((item) => item.id === id);
    return receipt ? buildReceiptDetail(receipt) : undefined;
  }

  if (!isUuid(id)) return undefined;
  const [attempt] = await getDb().select().from(paidCallAttempts).where(eq(paidCallAttempts.id, id)).limit(1);
  if (!attempt) return undefined;
  return detailForAttempt(attempt);
}

export async function getReceiptDetailByDeployHash(deployHash: string): Promise<ReceiptDetail | undefined> {
  if (!hasDatabaseUrl()) {
    const receipt = fixtureReceipts.find((item) => item.hash === deployHash);
    return receipt ? buildReceiptDetail(receipt) : undefined;
  }

  const [proof] = await getDb().select().from(casperProofs).where(eq(casperProofs.deployHash, deployHash)).limit(1);
  if (!proof?.attemptId) return undefined;
  const [attempt] = await getDb().select().from(paidCallAttempts).where(eq(paidCallAttempts.id, proof.attemptId)).limit(1);
  return attempt ? detailForAttempt(attempt) : undefined;
}

async function detailForAttempt(attempt: typeof paidCallAttempts.$inferSelect) {
  const [proof] = await getDb().select().from(casperProofs).where(eq(casperProofs.attemptId, attempt.id)).limit(1);
  const [policy] = await getDb().select().from(policyDecisions).where(eq(policyDecisions.attemptId, attempt.id)).limit(1);
  const x402s = await getDb()
    .select()
    .from(x402Records)
    .where(eq(x402Records.attemptId, attempt.id))
    .orderBy(desc(x402Records.createdAt));
  return buildPersistedReceiptDetail(fromAttemptRow(attempt, proof?.deployHash ?? null), {
    casperProof: proof,
    policyDecision: policy,
    x402Records: x402s,
  });
}

export async function persistAttempt(input: PersistAttemptInput) {
  const db = getDb();
  const id = randomUUID();
  const [attempt] = await db
    .insert(paidCallAttempts)
    .values({
      amount: input.amount,
      asset: input.asset,
      client: input.client,
      errorReason: input.errorReason,
      id,
      network: input.network,
      providerName: input.providerName,
      redactedInput: input.redactedInput,
      redactedOutput: input.redactedOutput,
      status: input.status,
      toolName: input.toolName,
      walletAccountHash: input.walletAccountHash,
    })
    .returning();
  return attempt;
}

export async function persistPolicyDecision(attemptId: string, allowed: boolean, reason: string, evaluatedPolicy = {}) {
  await getDb().insert(policyDecisions).values({ allowed, attemptId, evaluatedPolicy, reason });
}

export async function updateAttemptStatus(
  attemptId: string,
  status: ReceiptStatus,
  errorReason?: string,
  redactedOutput?: Record<string, unknown>,
) {
  await getDb()
    .update(paidCallAttempts)
    .set({ errorReason, redactedOutput, status, updatedAt: new Date() })
    .where(eq(paidCallAttempts.id, attemptId));
}

export async function persistX402Record(input: {
  attemptId: string;
  facilitatorUrl: string;
  paymentPayload?: unknown;
  paymentRequirements: unknown;
  settleResponse?: unknown;
  verifyResponse?: unknown;
}) {
  await getDb().insert(x402Records).values(input);
}

export async function persistCasperProof(input: {
  attemptId: string;
  deploy?: unknown;
  deployHash?: string;
  explorerUrl?: string;
  ftAction?: unknown;
  proofStatus: string;
}) {
  await getDb().insert(casperProofs).values(input);
}

export async function persistAudit(attemptId: string, kind: string, label: string, metadata = {}) {
  await getDb().insert(auditEvents).values({ attemptId, kind, label, metadata });
}

function fromAttemptRow(row: typeof paidCallAttempts.$inferSelect, hash: string | null): Receipt {
  return {
    amount: row.amount,
    asset: row.asset,
    client: row.client,
    hash,
    id: row.id,
    provider: row.providerName,
    reason: row.errorReason ?? undefined,
    status: row.status as ReceiptStatus,
    time: row.createdAt.toISOString(),
    tool: row.toolName,
    wallet: row.walletAccountHash,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
