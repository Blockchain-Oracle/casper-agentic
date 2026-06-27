import { afterEach, describe, expect, it } from "vitest";

import { receipts } from "@/lib/fixtures";
import { listReceiptHistory, normalizeReceiptHistoryInput } from "@/server/receipt-history";
import { listReceiptDetails, receiptStoreSource } from "@/server/receipt-store";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("receipt store", () => {
  it("falls back to labeled fixture receipt details when Postgres is not configured", async () => {
    delete process.env.DATABASE_URL;

    const details = await listReceiptDetails();

    expect(details.length).toBeGreaterThan(0);
    expect(details[0]).toHaveProperty("gateway");
    expect(details[0]).toHaveProperty("x402");
    expect(details[0]).toHaveProperty("casper");
    expect(receiptStoreSource()).toBe("fixture");
  });

  it("paginates fixture receipt history with metadata when Postgres is not configured", async () => {
    delete process.env.DATABASE_URL;

    const history = await listReceiptHistory({ page: "2", pageSize: "2" });

    expect(history.source).toBe("fixture");
    expect(history.receipts).toHaveLength(2);
    expect(history.pagination).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: true,
      page: 2,
      pageSize: 2,
      totalCount: receipts.length,
      totalPages: 3,
    });
  });

  it("filters fixture receipt history by status and text query", async () => {
    delete process.env.DATABASE_URL;

    const history = await listReceiptHistory({
      page: 1,
      pageSize: 10,
      q: "weather",
      status: "blocked",
    });

    expect(history.receipts).toHaveLength(1);
    expect(history.receipts[0].receipt.provider).toBe("Weather Risk Desk");
    expect(history.receipts[0].receipt.status).toBe("blocked");
  });

  it("normalizes receipt history bounds and account-hash wallet filters", () => {
    const accountHash = "B".repeat(64);
    const normalized = normalizeReceiptHistoryInput({
      page: "9007199254740991",
      pageSize: "500",
      status: "not-a-status",
      wallet: `account-hash-${accountHash}`,
    });

    expect(normalized.page).toBe(1000);
    expect(normalized.pageSize).toBe(25);
    expect(normalized.filters.status).toBeUndefined();
    expect(normalized.filters.wallet).toBe(accountHash.toLowerCase());
  });

  it("normalizes negative receipt history pages to the first page", () => {
    const normalized = normalizeReceiptHistoryInput({ page: "-4", pageSize: "2" });

    expect(normalized.page).toBe(1);
    expect(normalized.offset).toBe(0);
  });
});
