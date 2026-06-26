"use client";

import { useState } from "react";

import { Panel, TabButton } from "@/components/screen-primitives";
import { Chip, KeyValueList } from "@/components/ui";
import { clientToken } from "@/lib/client-config";

type SettingsTab = "boundaries" | "network" | "signing" | "client";

const TABS: Array<[SettingsTab, string]> = [
  ["boundaries", "Trust boundaries"],
  ["network", "Network & facilitator"],
  ["signing", "Signing"],
  ["client", "Client access"],
];

// Read-only, tabbed settings. The old live provider-capability probe + connect
// button + embedded audit log were removed (Audit is now its own screen); this
// surface just documents the trust boundaries, network, signing modes, and client
// access scope — honest static framing, no live SDK state.
export function SettingsScreen() {
  const [tab, setTab] = useState<SettingsTab>("boundaries");

  return (
    <div className="stack">
      <div className="buttonRow">
        {TABS.map(([id, label]) => (
          <TabButton active={tab === id} key={id} onClick={() => setTab(id)}>
            {label}
          </TabButton>
        ))}
      </div>

      {tab === "boundaries" ? (
        <Panel title="Three separate trust boundaries — never merged">
          <KeyValueList
            rows={[
              { key: "Provider upstream credential", value: "••••3f9a · server-side only", tone: "warn", mono: true },
              { key: "Client access token", value: "sample…3a91 · scoped discover/call", tone: "primary", mono: true },
              { key: "Wallet / payment authorization", value: "01a2…ef · fresh signed x402 per call", tone: "danger", mono: true },
            ]}
          />
          <div className="notice" style={{ marginTop: 12 }}>
            Provider credentials never appear in endpoint config, receipts, the explorer, client snippets, or logs.
          </div>
        </Panel>
      ) : null}

      {tab === "network" ? (
        <Panel title="Network & facilitator">
          <KeyValueList
            rows={[
              { key: "network", value: "casper:casper-test", tone: "signal", mono: true },
              { key: "facilitator", value: "CSPR.cloud · hosted x402 facilitator", mono: true },
              { key: "payment asset", value: "WCSPR · CEP-18", mono: true },
              { key: "proof rule", value: "No deploy hash is shown until a real Testnet transaction exists" },
            ]}
          />
          <div className="buttonRow" style={{ marginTop: 12 }}>
            <Chip tone="warn">Mainnet · hidden / later</Chip>
          </div>
        </Panel>
      ) : null}

      {tab === "signing" ? (
        <Panel title="Signing modes">
          <KeyValueList
            rows={[
              { key: "browser-wallet · CSPR.click", value: "per-payment approval", tone: "signal" },
              { key: "hosted agent wallet", value: "Testnet only · not production custody", tone: "primary" },
              { key: "test-signer backstop", value: "integration smokes only · not a user mode", tone: "warn" },
            ]}
          />
          <div className="notice" style={{ marginTop: 12 }}>
            Every paid call requires a fresh signed x402 authorization — there is no pre-approved session. Production
            custody is not claimed in this design pass.
          </div>
        </Panel>
      ) : null}

      {tab === "client" ? (
        <Panel title="Client access state">
          <KeyValueList
            rows={[
              { key: "active tokens", value: "1", mono: true },
              { key: "token", value: clientToken, mono: true },
              { key: "scope", value: "discover · call · pay-intent" },
              { key: "authority", value: "cannot authorize payment", tone: "danger" },
            ]}
          />
          <div className="notice" style={{ marginTop: 12 }}>
            Fixture tokens never use live-looking secret prefixes.
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
