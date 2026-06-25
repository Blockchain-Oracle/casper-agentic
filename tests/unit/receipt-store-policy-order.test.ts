import { beforeEach, describe, expect, it, vi } from "vitest";

import { casperProofs, policyDecisions, x402Records } from "@/db/schema";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  getDb: mocks.getDb,
  hasDatabaseUrl: () => true,
}));

import { detailsForAttemptRows } from "@/server/receipt-store";

describe("receipt store policy ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the latest policy decision when completion blocks after an allowed intent", async () => {
    setRows({
      policies: [
        {
          allowed: true,
          attemptId: attemptId(),
          createdAt: new Date("2026-06-25T10:00:00.000Z"),
          evaluatedPolicy: {},
          id: "policy-allowed",
          reason: "policy allowed before signing/payment",
        },
        {
          allowed: false,
          attemptId: attemptId(),
          createdAt: new Date("2026-06-25T10:01:00.000Z"),
          evaluatedPolicy: { browserPaymentCompletion: { policyRechecked: true } },
          id: "policy-blocked",
          reason: "policy is disabled",
        },
      ],
    });

    const [detail] = await detailsForAttemptRows([attemptRow()]);

    expect(detail.receipt.status).toBe("blocked");
    expect(detail.policy).toContainEqual({ key: "decision", tone: "primary", value: "BLOCKED" });
    expect(detail.policy).toContainEqual({ key: "reason", tone: "primary", value: "policy is disabled" });
  });
});

function setRows(rows: { policies: unknown[] }) {
  mocks.getDb.mockReturnValue({
    select: () => ({
      from: (table: unknown) => ({
        where: () => queryRows(table, rows),
      }),
    }),
  });
}

function queryRows(table: unknown, rows: { policies: unknown[] }) {
  if (table === policyDecisions) return chain(rows.policies);
  if (table === casperProofs || table === x402Records) return chain([]);
  return chain([]);
}

function chain<T>(rows: T[]) {
  return Object.assign([...rows], {
    orderBy: () => rows,
  });
}

function attemptId() {
  return "158ab798-5e21-4512-9823-fe6d95b8d3e5";
}

function attemptRow() {
  return {
    amount: "5",
    asset: "asset",
    client: "csprclick-browser-intent",
    createdAt: new Date("2026-06-25T10:00:00.000Z"),
    errorReason: "policy is disabled",
    id: attemptId(),
    network: "casper:casper-test",
    providerName: "CSPR.trade MCP",
    redactedInput: {},
    redactedOutput: null,
    status: "blocked",
    toolName: "get_quote",
    updatedAt: new Date("2026-06-25T10:01:00.000Z"),
    walletAccountHash: "74b27259f8938538adf20f3ef58ea3d8cf7461dfb0102497a98fcb04c540bb07",
  };
}
