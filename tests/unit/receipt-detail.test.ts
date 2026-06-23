import { describe, expect, it } from "vitest";

import { buildReceiptDetail } from "@/lib/receipt-detail";
import type { Receipt } from "@/lib/types";

describe("receipt proof rendering", () => {
  it("shows Casper proof when settlement exists even if upstream failed afterward", () => {
    const receipt: Receipt = {
      amount: "7500000000",
      asset: "WCSPR",
      client: "phase-0-console",
      hash: "0123456789abcdef",
      id: "rcp_real_proof",
      provider: "Make Software Labs",
      reason: "Provider returned an error after settlement",
      status: "upstream_failed",
      time: "2026-06-22T12:00:00.000Z",
      tool: "get_quote",
      wallet: "account-hash-payer",
    };

    const detail = buildReceiptDetail(receipt);

    expect(detail.x402.find((row) => row.key === "settle")?.value).toBe("settled");
    expect(detail.casper.find((row) => row.key === "deploy hash")?.value).toBe(receipt.hash);
    expect(detail.casperNote).toContain("Chain proof covers payment only");
  });

  it("does not present proof-pending receipts as verified deploy proof", () => {
    const receipt: Receipt = {
      amount: "7500000000",
      asset: "WCSPR",
      client: "phase-0-console",
      hash: "settle-transaction-hash",
      id: "rcp_pending_proof",
      provider: "Make Software Labs",
      reason: "Casper proof pending CSPR.cloud indexing",
      status: "raw_proof_unavailable",
      time: "2026-06-22T12:00:00.000Z",
      tool: "get_quote",
      wallet: "account-hash-payer",
    };

    const detail = buildReceiptDetail(receipt);

    expect(detail.x402.find((row) => row.key === "settle")?.value).toBe(
      "settle transaction recorded - proof pending",
    );
    expect(detail.casper.find((row) => row.key === "settle transaction")?.value).toBe(receipt.hash);
    expect(detail.casper.find((row) => row.key === "proof status")?.value).toBe(
      "CSPR.cloud indexing pending",
    );
  });
});
