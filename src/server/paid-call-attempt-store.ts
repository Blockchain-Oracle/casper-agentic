import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { paidCallAttempts, policyDecisions } from "@/db/schema";

export async function getPaidCallAttempt(id: string) {
  const [attempt] = await getDb().select().from(paidCallAttempts).where(eq(paidCallAttempts.id, id)).limit(1);
  return attempt ?? null;
}

export async function getLatestPolicyDecisionForAttempt(attemptId: string) {
  const [decision] = await getDb()
    .select()
    .from(policyDecisions)
    .where(eq(policyDecisions.attemptId, attemptId))
    .orderBy(desc(policyDecisions.createdAt))
    .limit(1);
  return decision ?? null;
}
