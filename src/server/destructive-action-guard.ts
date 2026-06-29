import { timingSafeEqual } from "node:crypto";

export class DestructiveActionError extends Error {
  constructor(
    message: string,
    readonly status = 403,
  ) {
    super(message);
  }
}

export function requireDestructiveActionToken(request: Request) {
  const expected = process.env.CASPER_GW_ADMIN_TOKEN?.trim();
  if (!expected) {
    throw new DestructiveActionError("owner verification is required before destructive actions are enabled");
  }
  const supplied = request.headers.get("x-casper-gw-admin-token")?.trim();
  if (!supplied || !safeEqual(supplied, expected)) {
    throw new DestructiveActionError("destructive action is not authorized");
  }
}

export function isDestructiveActionError(error: unknown): error is DestructiveActionError {
  return error instanceof DestructiveActionError;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
