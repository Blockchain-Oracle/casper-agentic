import { describe, expect, it } from "vitest";

import { buildReceiptDetail } from "@/lib/receipt-detail";
import { buildPersistedReceiptDetail } from "@/lib/persisted-receipt-detail";
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

  it("does not render pre-policy failures as proof-pending Casper receipts", () => {
    const receipt: Receipt = {
      amount: "7500000000",
      asset: "WCSPR",
      client: "phase-0-console",
      hash: null,
      id: "rcp_policy_pending",
      provider: "Make Software Labs",
      reason: "Policy evaluation did not complete",
      status: "policy_pending",
      time: "2026-06-22T12:00:00.000Z",
      tool: "get_quote",
      wallet: "account-hash-payer",
    };

    const detail = buildReceiptDetail(receipt);

    expect(detail.x402.find((row) => row.key === "settle")?.value).toBe("not attempted");
    expect(detail.casper).toEqual([]);
    expect(detail.casperNote).toContain("no transaction exists on Casper");
  });

  it("builds real receipt layers from persisted policy, x402, and proof records", () => {
    const receipt: Receipt = {
      amount: "7500000000",
      asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
      client: "phase-3-console",
      hash: "real-deploy-hash",
      id: "real_attempt",
      provider: "CSPR.trade MCP",
      status: "settled",
      time: "2026-06-23T12:00:00.000Z",
      tool: "get_quote",
      wallet: "account-hash-real-payer",
    };

    const detail = buildPersistedReceiptDetail(receipt, {
      casperProof: {
        deploy: { status: "processed" },
        deployHash: "real-deploy-hash",
        explorerUrl: "https://testnet.cspr.live/deploy/real-deploy-hash",
        ftAction: {
          amount: "7500000000",
          from: "account-hash-real-payer",
          to: "account-hash-real-payee",
        },
        proofStatus: "processed",
      },
      x402Records: [
        {
          facilitatorUrl: "https://x402-facilitator.cspr.cloud",
          paymentRequirements: {
            amount: "7500000000",
            asset: "3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e",
            network: "casper:casper-test",
            payTo: "account-hash-real-payee",
            scheme: "exact",
          },
          settleResponse: { payer: "account-hash-real-payer", success: true, transaction: "real-deploy-hash" },
          verifyResponse: { isValid: true },
        },
      ],
    });

    expect(detail.x402.find((row) => row.key === "payee")?.value).toBe("account-hash-real-payee");
    expect(detail.casper.find((row) => row.key === "payer")?.value).toBe("account-hash-real-payer");
    expect(detail.casper.find((row) => row.key === "proof status")?.value).toBe("processed");
    expect(JSON.stringify(detail)).not.toContain("0x4d2f...a017");
    expect(JSON.stringify(detail)).not.toContain("0x9f3a...b2c1");
  });

  it("does not render settlement as completed when persisted verify failed first", () => {
    const receipt: Receipt = {
      amount: "7500000000",
      asset: "WCSPR",
      client: "phase-3-console",
      hash: null,
      id: "verify_failed_attempt",
      provider: "CSPR.trade MCP",
      reason: "signature expired",
      status: "verify_failed",
      time: "2026-06-23T12:00:00.000Z",
      tool: "get_quote",
      wallet: "account-hash-real-payer",
    };

    const detail = buildPersistedReceiptDetail(receipt, {
      x402Records: [
        {
          facilitatorUrl: "https://x402-facilitator.cspr.cloud",
          paymentRequirements: {
            amount: "7500000000",
            asset: "WCSPR",
            network: "casper:casper-test",
            payTo: "account-hash-real-payee",
            scheme: "exact",
          },
          verifyResponse: { invalidReason: "signature expired", isValid: false },
        },
      ],
    });

    expect(detail.x402.find((row) => row.key === "verify")?.value).toBe("FAILED");
    expect(detail.x402.find((row) => row.key === "settle")?.value).toBe("not attempted");
    expect(detail.casper).toEqual([]);
  });
});
