import { KeyValueList } from "@/components/ui";
import { Modal } from "@/components/ui/modal";

export type ApproveMethod = "agent-wallet" | "browser" | null;

// Phase 7 "Approve & sign" confirmation: a review step before any signature is
// produced, for both web triggers (server-signed agent wallet / CSPR.click connect).
export function TestConsoleApproveModal({
  busy,
  method,
  onApprove,
  onCancel,
  priceLabel,
  toolName,
  walletId,
}: {
  busy: boolean;
  method: ApproveMethod;
  onApprove: () => void;
  onCancel: () => void;
  priceLabel: string;
  toolName: string;
  walletId: string;
}) {
  const isAgentWallet = method === "agent-wallet";
  return (
    <Modal
      open={method !== null}
      onClose={busy ? () => undefined : onCancel}
      title="Approve & sign payment"
      subtitle={
        isAgentWallet
          ? "The Gateway server-signs with your selected agent wallet, under its spend policy."
          : "Your Casper wallet will prompt you to approve this payment."
      }
      maxWidth={460}
      footer={
        <>
          <button className="secondaryButton" disabled={busy} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="primaryButton" disabled={busy} onClick={onApprove} type="button">
            {busy ? "Signing…" : "Approve & sign"}
          </button>
        </>
      }
    >
      <KeyValueList
        rows={[
          { key: "tool", value: toolName, mono: true },
          { key: "price", value: priceLabel, mono: true },
          { key: "network", value: "casper:casper-test", mono: true },
          { key: "wallet", value: walletId || "—", mono: true },
          { key: "method", value: isAgentWallet ? "Pay with my agent wallet (server-signed)" : "Connect & sign (CSPR.click)" },
        ]}
      />
      <div className="notice" style={{ marginTop: 12 }}>
        A fresh per-call x402 authorization is signed — there is no pre-approved session.
      </div>
    </Modal>
  );
}
