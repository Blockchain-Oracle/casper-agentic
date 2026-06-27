export interface PaidCallInput {
  args: Record<string, unknown>;
  client?: string;
  endpointUrl: string;
  toolName: string;
}

export interface ParsedPaidCallInput {
  args: Record<string, unknown>;
  endpointUrl: string;
  toolName: string;
}

export class PaidCallInputError extends Error {
  readonly status = 400;
}

export function isPaidCallInputError(error: unknown): error is PaidCallInputError {
  return error instanceof PaidCallInputError;
}

export function requireLivePaidCallInput(input: PaidCallInput): ParsedPaidCallInput {
  return {
    args: requireArgs(input.args),
    endpointUrl: requireText(input.endpointUrl, "endpointUrl"),
    toolName: requireText(input.toolName, "toolName"),
  };
}

export function redactLiveInput(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : value]),
  );
}

function requireText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) throw new PaidCallInputError(`${label} is required`);
  return text;
}

function requireArgs(value: Record<string, unknown> | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PaidCallInputError("args object is required");
  }
  return value;
}
