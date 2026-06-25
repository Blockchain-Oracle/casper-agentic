export interface BrowserSigningEvidenceAudit {
  digest?: string;
  hashArtifacts?: Record<string, unknown>;
  hasHashArtifacts: boolean;
  publicKey?: string;
}

export function auditSigningEvidence(value: unknown): BrowserSigningEvidenceAudit | null {
  if (!isRecord(value)) return null;
  const digest = textOrNull(value.digest, 80);
  const publicKey = textOrNull(value.publicKey, 140);
  const hashArtifacts = sanitizeHashArtifacts(value.hashArtifacts);
  if (!digest && !publicKey && !hashArtifacts) return null;
  return {
    ...(digest ? { digest } : {}),
    hasHashArtifacts: Boolean(hashArtifacts),
    ...(hashArtifacts ? { hashArtifacts } : {}),
    ...(publicKey ? { publicKey } : {}),
  };
}

function sanitizeHashArtifacts(value: unknown) {
  if (!isRecord(value)) return null;
  const result: Record<string, unknown> = {};
  for (const key of ["domainSeparator", "structHash", "typeHash", "canonicalTypeString", "domainTypeString"]) {
    const text = textOrNull(value[key], 500);
    if (text) result[key] = text;
  }
  if (isRecord(value.domain)) result.domain = sanitizeFlatRecord(value.domain);
  return Object.keys(result).length ? result : null;
}

function sanitizeFlatRecord(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 20)
      .flatMap(([key, entry]) => {
        const text = textOrNull(entry, 500);
        const safeKey = key.trim().slice(0, 80);
        return text && safeKey ? [[safeKey, text]] : [];
      }),
  );
}

function textOrNull(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
