import { Field } from "@/components/ui";
import type { Tool } from "@/lib/types";

export function PricingDrawer({
  amount,
  onAmount,
  onClose,
  onSave,
  tool,
}: {
  amount: string;
  onAmount: (amount: string) => void;
  onClose: () => void;
  onSave: () => void;
  tool: Tool;
}) {
  const validAmount = /^[1-9][0-9]*$/.test(amount);
  const displayAmount = validAmount ? (Number(amount) / 1_000_000_000).toFixed(2) : "0.00";

  return (
    <div className="drawerBackdrop" role="presentation">
      <aside className="drawer" aria-label="Pricing drawer">
        <div className="panelHeader">
          <div>
            <div className="fieldLabel">pricing drawer</div>
            <div className="panelTitle">{tool.id}</div>
          </div>
          <button className="secondaryButton" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="panelBody stack">
          <Field label="network">
            <input className="input" readOnly value="casper:casper-test" />
          </Field>
          <Field label="scheme">
            <input className="input" readOnly value="exact" />
          </Field>
          <Field label="asset">
            <input className="input" readOnly value="CEP-18 WCSPR package" />
          </Field>
          <Field label="amount in base units">
            <input className="input" onChange={(event) => onAmount(event.target.value)} value={amount} />
          </Field>
          <Field label="payee account">
            <input className="input" readOnly value="server-side CASPER_PAYEE_ACCOUNT_HASH" />
          </Field>
          <Field label="timeout seconds">
            <input className="input" readOnly value="900" />
          </Field>
          <div className={`notice ${validAmount ? "signal" : "danger"}`}>
            {validAmount
              ? `${displayAmount} WCSPR will be saved with server-side Casper payment defaults.`
              : "Amount must be a positive integer string before publishing."}
          </div>
          <button className="primaryButton" disabled={!validAmount} onClick={onSave} type="button">
            Save and publish tool
          </button>
        </div>
      </aside>
    </div>
  );
}
