export function latestPolicyDecisionForAttempt<T extends { attemptId?: string | null; createdAt: Date }>(
  policies: T[],
  attemptId: string,
) {
  return policies
    .filter((policy) => policy.attemptId === attemptId)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
}
