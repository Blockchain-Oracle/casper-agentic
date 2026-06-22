import { Panel } from "@/components/screen-primitives";
import { Chip, KeyValueList } from "@/components/ui";
import { auditEvents } from "@/lib/fixtures";
import { clientToken } from "@/lib/client-config";

export function SettingsScreen() {
  return (
    <div className="stack">
      <div className="grid two">
        <Panel title="Credential boundaries">
          <KeyValueList
            rows={[
              { key: "provider upstream", value: "masked vault reference: cred_provider_42" },
              { key: "client access", value: `${clientToken} scoped to make-software`, mono: true },
              { key: "oauth target", value: "OAuth 2.1 resource server metadata" },
              { key: "wallet payment", value: "x402 signed payment payload from wallet policy path" },
            ]}
          />
        </Panel>
        <Panel title="Network and facilitator">
          <KeyValueList
            rows={[
              { key: "network", value: "casper:casper-test", mono: true },
              { key: "facilitator", value: "CSPR.cloud x402 hosted facilitator" },
              { key: "proof source", value: "CSPR.cloud deploy and CEP-18 action reads" },
              { key: "proof rule", value: "No deploy hash is shown until a real Testnet transaction exists" },
            ]}
          />
        </Panel>
      </div>

      <div className="grid two">
        <Panel title="Wallet signing mode">
          <KeyValueList
            rows={[
              { key: "default signing mode", value: "Hosted encrypted signer" },
              { key: "scope", value: "MVP/prototype only" },
              { key: "production custody", value: "unresolved - do not claim" },
              { key: "policy timing", value: "policy before payment signing" },
            ]}
          />
        </Panel>
        <Panel title="Audit log">
          {auditEvents.map((event) => (
            <div className="auditRow" key={`${event.time}-${event.label}`}>
              <div className="receiptMeta">
                <strong>{event.label}</strong>
                <Chip
                  tone={
                    event.kind === "ok"
                      ? "signal"
                      : event.kind === "fail"
                        ? "danger"
                        : event.kind === "warn"
                          ? "warn"
                          : event.kind === "block"
                            ? "primary"
                            : "neutral"
                  }
                >
                  {event.kind}
                </Chip>
              </div>
              <div className="miniMeta">
                <span>{event.time}</span>
                <span>{event.meta}</span>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
