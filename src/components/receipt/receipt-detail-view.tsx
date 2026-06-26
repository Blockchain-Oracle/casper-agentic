import { ProofPanel } from "@/components/screen-primitives";
import type { ReceiptDetail } from "@/lib/types";

/**
 * The four-layer proof grid (gateway context / policy decision / x402 verify+settle /
 * Casper proof). Single source of truth shared by the public explorer and the public
 * `/receipt/[id]` page so both render identically. Honesty is inherited from
 * `buildReceiptDetail` — it never emits a deploy hash or "settled" without a real one.
 */
export function ReceiptProofGrid({ detail }: { detail: ReceiptDetail }) {
  return (
    <div className="proofGrid">
      <ProofPanel title="Gateway context" rows={detail.gateway} />
      <ProofPanel title="Policy decision" note={detail.policyNote} rows={detail.policy} />
      <ProofPanel title="x402 verify / settle" note={detail.x402Note} rows={detail.x402} />
      <ProofPanel title="Casper proof" note={detail.casperNote} rows={detail.casper} />
    </div>
  );
}

export const RECEIPT_PROOF_NOTE =
  "Chain proof covers payment settlement only. Provider, resource URL, pricing rule, client, and policy decision are gateway receipt context.";
