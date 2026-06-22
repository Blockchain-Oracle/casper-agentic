export class OperatorAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function requireOperatorRequest(request: Request) {
  const expected = process.env.CASPER_GW_OPERATOR_TOKEN?.trim();
  if (!expected) throw new OperatorAccessError("CASPER_GW_OPERATOR_TOKEN is required", 503);

  const actual = request.headers.get("x-casper-gw-operator-token")?.trim();
  if (!actual || actual !== expected) throw new OperatorAccessError("operator access required", 403);
}

export function requireHttpSigningEnabled() {
  if (process.env.CASPER_GW_HTTP_SIGNING_ENABLED !== "true") {
    throw new OperatorAccessError("HTTP signing endpoint is disabled; use pnpm smoke:live", 403);
  }
}

export function isOperatorAccessError(error: unknown): error is OperatorAccessError {
  return error instanceof OperatorAccessError;
}
