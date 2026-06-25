import { hasDatabaseUrl } from "@/db/client";

import { getPaidCallAttempt } from "./paid-call-attempt-store";
import { persistAudit, updateAttemptStatus } from "./receipt-store";

export interface BrowserPaymentFailureInput {
  attemptId: string;
  errorCode?: string | null;
  reason: string;
  resultStatus?: string;
  toolName: string;
}

export class BrowserPaymentFailureInputError extends Error {
  readonly status = 400;
}

export function isBrowserPaymentFailureInputError(error: unknown): error is BrowserPaymentFailureInputError {
  return error instanceof BrowserPaymentFailureInputError;
}

export async function reportBrowserPaymentFailure(input: BrowserPaymentFailureInput) {
  if (!hasDatabaseUrl()) throw new Error("Missing browser payment-failure configuration: DATABASE_URL");
  const parsed = requireFailureInput(input);
  const attempt = await getPaidCallAttempt(parsed.attemptId);
  if (!attempt) throw new BrowserPaymentFailureInputError("browser payment intent attempt not found");
  if (attempt.client !== "csprclick-browser-intent") {
    throw new BrowserPaymentFailureInputError("attempt is not a browser payment intent");
  }
  if (attempt.toolName !== parsed.toolName) {
    throw new BrowserPaymentFailureInputError("toolName does not match browser payment intent");
  }
  if (attempt.status !== "policy_pending") {
    throw new BrowserPaymentFailureInputError("browser payment intent is not waiting for signature");
  }

  await updateAttemptStatus(parsed.attemptId, "auth_failed", parsed.reason, {
    browserSigning: {
      errorCode: parsed.errorCode,
      resultStatus: parsed.resultStatus,
    },
  });
  await persistAudit(parsed.attemptId, "fail", "Browser CSPR.click signing failed before facilitator", {
    errorCode: parsed.errorCode,
    resultStatus: parsed.resultStatus,
  });
  return {
    attemptId: parsed.attemptId,
    message: parsed.reason,
    reason: parsed.reason,
    status: "auth_failed" as const,
  };
}

function requireFailureInput(input: BrowserPaymentFailureInput): Required<BrowserPaymentFailureInput> {
  return {
    attemptId: requireText(input.attemptId, "attemptId"),
    errorCode: optionalText(input.errorCode) ?? "BROWSER_AUTHORIZATION_FAILED",
    reason: requireText(input.reason, "reason"),
    resultStatus: optionalText(input.resultStatus) ?? "auth_failed",
    toolName: requireText(input.toolName, "toolName"),
  };
}

function optionalText(value: string | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, 160) : undefined;
}

function requireText(value: string | undefined, label: string) {
  const text = optionalText(value);
  if (!text) throw new BrowserPaymentFailureInputError(`${label} is required`);
  return text;
}
