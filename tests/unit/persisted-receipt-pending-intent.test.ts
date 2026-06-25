import { describe, expect, it } from "vitest";

import { buildPersistedReceiptDetail } from "@/lib/persisted-receipt-detail";
import type { Receipt } from "@/lib/types";

describe("persisted receipt pending browser intent", () => {
  it("labels policy-allowed browser intents as awaiting wallet signing, not incomplete policy", () => {
    const receipt: Receipt = {
      amount: "7500000000",
      asset: "WCSPR",
      client: "csprclick-browser-intent",
      hash: null,
      id: "browser_intent_attempt",
      provider: "CSPR.trade MCP",
      status: "policy_pending",
      time: "2026-06-25T12:00:00.000Z",
      tool: "get_quote",
      wallet: "account-hash-browser-payer",
    };

    const detail = buildPersistedReceiptDetail(receipt, {
      policyDecision: {
        allowed: true,
        evaluatedPolicy: { toolName: "get_quote" },
        reason: "policy allowed before signing/payment",
      },
      x402Records: [],
    });

    expect(detail.policy.find((row) => row.key === "decision")?.value).toBe("ALLOWED");
    expect(detail.policyNote).toBe("Policy allowed. Browser wallet signing has not run yet, so no payment or Casper transaction is attached.");
    expect(detail.x402.find((row) => row.key === "settle")?.value).toBe("not attempted");
    expect(detail.casper).toEqual([]);
  });
});
