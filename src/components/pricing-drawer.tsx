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
  const validAmount = Number(amount) > 0;

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
            <input className="input" readOnly value="CEP-18 WCSPR" />
          </Field>
          <Field label="amount">
            <input className="input" onChange={(event) => onAmount(event.target.value)} value={amount} />
          </Field>
          <Field label="payee account">
            <input
              className="input"
              readOnly
              value="account-hash-4d2f0000000000000000000000000000000000000000000000000000000000a017"
            />
          </Field>
          <Field label="timeout seconds">
            <input className="input" readOnly value="120" />
          </Field>
          <div className={`notice ${validAmount ? "signal" : "danger"}`}>
            {validAmount
              ? "Amount, asset, payee, network, and timeout pass the hosted endpoint publish checks."
              : "Amount must be greater than zero before publishing."}
          </div>
          <button className="primaryButton" disabled={!validAmount} onClick={onSave} type="button">
            Save and publish tool
          </button>
        </div>
      </aside>
    </div>
  );
}
