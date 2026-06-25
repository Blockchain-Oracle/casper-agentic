import type { ReceiptStatus } from "@/lib/types";

export interface TestConsoleTimelineRow {
  done: boolean;
  label: string;
  note: string;
}

export function testConsoleTimelineRows(input: {
  discovered: boolean;
  receiptId: string | null;
  resultStatus: ReceiptStatus | null;
}): TestConsoleTimelineRow[] {
  const status = input.resultStatus;
  return [
    {
      done: input.discovered,
      label: "Endpoint discovery",
      note: input.discovered ? "Tools discovered from endpoint metadata." : "Waiting for discovery.",
    },
    {
      done: Boolean(status),
      label: "Policy pre-check",
      note: policyNote(status),
    },
    {
      done: Boolean(status && status !== "blocked" && status !== "policy_pending"),
      label: "x402 verify / settle",
      note: x402Note(status),
    },
    {
      done: Boolean(input.receiptId),
      label: "Receipt",
      note: input.receiptId ?? "Created for every meaningful attempt.",
    },
  ];
}

function policyNote(status: ReceiptStatus | null) {
  if (!status) return "Runs before signing/payment.";
  if (status === "blocked") return "Blocked before wallet approval; no payment was signed.";
  if (status === "policy_pending") return "Policy decision is still pending.";
  return "Policy passed before wallet approval.";
}

function x402Note(status: ReceiptStatus | null) {
  if (!status) return "Requires facilitator response.";
  if (status === "settled") return "Facilitator settled and Casper proof can be opened.";
  if (status === "blocked") return "Not attempted because policy blocked the call.";
  if (status === "verify_failed") return "Facilitator verify failed; no settlement proof exists.";
  if (status === "settle_failed") return "Facilitator settle failed; no settled proof exists.";
  if (status === "raw_proof_unavailable") return "Settlement proof was not resolved; no deploy link is shown.";
  if (status === "upstream_failed") return "Provider call failed after payment handling; inspect the receipt.";
  if (status === "auth_failed") return "Authorization failed before settlement proof.";
  if (status === "external_proof") return "External proof is explorer-only; gateway context is unavailable.";
  return "Waiting for verify/settle result.";
}
