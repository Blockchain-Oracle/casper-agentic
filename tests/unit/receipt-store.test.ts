import { afterEach, describe, expect, it } from "vitest";

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
    expect(details[0]).toHaveProperty("policy");
    expect(details[0]).toHaveProperty("x402");
    expect(details[0]).toHaveProperty("casper");
    expect(receiptStoreSource()).toBe("fixture");
  });
});
