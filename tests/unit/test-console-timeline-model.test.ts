import { describe, expect, it } from "vitest";

import { testConsoleTimelineRows } from "@/components/screens/test-console-timeline-model";
import type { ReceiptStatus } from "@/lib/types";

describe("test console timeline model", () => {
  it.each([
    ["blocked", "Blocked before wallet approval; no payment was signed.", "Not attempted because policy blocked the call."],
    ["verify_failed", "Policy passed before wallet approval.", "Facilitator verify failed; no settlement proof exists."],
    ["settle_failed", "Policy passed before wallet approval.", "Facilitator settle failed; no settled proof exists."],
  ] satisfies [ReceiptStatus, string, string][])("renders honest %s outcome text", (status, policy, x402) => {
    const rows = testConsoleTimelineRows({ discovered: true, receiptId: "attempt-1", resultStatus: status });

    expect(rows[1]).toMatchObject({ done: true, label: "Policy pre-check", note: policy });
    expect(rows[2]).toMatchObject({ label: "x402 verify / settle", note: x402 });
    expect(rows.map((row) => row.note).join(" ")).not.toMatch(/deploy hash|proof can be opened/i);
  });

  it("renders settled as the only proof-complete console outcome", () => {
    const rows = testConsoleTimelineRows({ discovered: true, receiptId: "attempt-1", resultStatus: "settled" });

    expect(rows[2]).toMatchObject({
      done: true,
      label: "x402 verify / settle",
      note: "Facilitator settled and Casper proof can be opened.",
    });
  });
});
