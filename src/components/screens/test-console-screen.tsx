"use client";

import { useState } from "react";
import { Panel, Segmented } from "@/components/screen-primitives";
import { Chip, Field, KeyValueList, StatusChip } from "@/components/ui";
import type { ConsolePhase, Receipt, Tool, WalletProfile } from "@/lib/types";

type ConsoleTarget = "hosted" | "custom";

export function TestConsoleScreen({
  endpointUrl,
  fixtureReceipt,
  onOpenReceipt,
  tools,
  wallets,
}: {
  endpointUrl: string;
  fixtureReceipt: Receipt;
  onOpenReceipt: (receipt: Receipt) => void;
  tools: Tool[];
  wallets: WalletProfile[];
}) {
  const [target, setTarget] = useState<ConsoleTarget>("hosted");
  const [phase, setPhase] = useState<ConsolePhase>("idle");
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id ?? "");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? "");

  const selectedTool = tools.find((tool) => tool.id === selectedToolId) ?? tools[0];
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets[0];
  const discovered = phase !== "idle";
  const completed = phase === "complete";
  const toolNeedsInput = selectedTool?.id !== "list_pairs";

  return (
    <div className="grid two">
      <div className="stack">
        <Panel title="Endpoint target" action={<Chip tone="warn">Design fixture</Chip>}>
          <div className="stack">
            <Segmented<ConsoleTarget>
              options={[
                ["hosted", "My hosted endpoint"],
                ["custom", "Paste MCP/x402 URL"],
              ]}
              value={target}
              onChange={setTarget}
            />
            <Field label={target === "hosted" ? "hosted endpoint" : "mcp/x402 endpoint url"}>
              <input
                className="input"
                readOnly={target === "hosted"}
                defaultValue={target === "hosted" ? endpointUrl : "https://provider.example.com/mcp"}
              />
            </Field>
            <div className="notice">
              This console models the endpoint-first flow. It does not claim a live Casper
              settlement until a real facilitator response and deploy hash are stored.
            </div>
            <button className="primaryButton" onClick={() => setPhase("discovered")} type="button">
              Discover endpoint tools
            </button>
          </div>
        </Panel>

        <Panel title="Discovered tools">
          {!discovered ? (
            <div className="emptyState">Discover tools before selecting inputs.</div>
          ) : (
            <div className="stack tight">
              {tools.map((tool) => (
                <button
                  className="toolRow"
                  data-active={tool.id === selectedToolId}
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  type="button"
                >
                  <div>
                    <strong className="mono">{tool.id}</strong>
                    <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                      {tool.description} - {tool.target}
                    </div>
                  </div>
                  <Chip tone={tool.published ? "signal" : "neutral"}>
                    {tool.published ? `${tool.price?.toFixed(2)} TUSDC` : "not published"}
                  </Chip>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="stack">
        <Panel title="Tool input and wallet policy">
          {!discovered || !selectedTool ? (
            <div className="emptyState">Select a discovered tool to continue.</div>
          ) : (
            <div className="stack">
              <KeyValueList
                rows={[
                  { key: "selected tool", value: selectedTool.id, mono: true },
                  { key: "payment asset", value: "CEP-18 TUSDC", mono: true },
                  { key: "network", value: "casper:casper-test", mono: true },
                  { key: "price", value: `${selectedTool.price?.toFixed(2) ?? "0.00"} TUSDC`, mono: true },
                ]}
              />
              {toolNeedsInput ? (
                <div className="formGrid">
                  <Field label="token in">
                    <input className="input" defaultValue="CSPR" />
                  </Field>
                  <Field label="token out">
                    <input className="input" defaultValue="USD" />
                  </Field>
                  <Field label="amount">
                    <input className="input" defaultValue="10" />
                  </Field>
                  <Field label="quote type">
                    <select className="input" defaultValue="exact_in">
                      <option value="exact_in">exact_in</option>
                      <option value="exact_out">exact_out</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <div className="emptyState">No input required for this tool.</div>
              )}
              <Field label="wallet / policy">
                <select
                  className="input"
                  onChange={(event) => setSelectedWalletId(event.target.value)}
                  value={selectedWalletId}
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.id} - {wallet.status}
                    </option>
                  ))}
                </select>
              </Field>
              <div className={selectedWallet?.funded ? "notice signal" : "notice"}>
                {selectedWallet?.funded
                  ? "Policy pre-check can run before wallet signing."
                  : "Wallet is not ready; a real run must stop before signing/payment."}
              </div>
              <button
                className="primaryButton"
                disabled={!selectedTool.published}
                onClick={() => setPhase("complete")}
                type="button"
              >
                Run policy and paid call
              </button>
            </div>
          )}
        </Panel>

        <Panel
          title="Result timeline"
          action={completed ? <StatusChip status={fixtureReceipt.status} /> : undefined}
        >
          <div className="stack">
            {[
              ["Endpoint discovery", discovered ? "Tools discovered from endpoint metadata." : "Waiting for discovery."],
              ["Policy pre-check", completed ? "Allowed fixture path reached x402." : "Runs before signing/payment."],
              ["x402 verify / settle", completed ? "Fixture only: no deploy hash is claimed." : "Requires facilitator response."],
              ["Receipt", completed ? fixtureReceipt.id : "Created for every meaningful attempt."],
            ].map(([label, note], index) => (
              <div className="timelineItem" key={label}>
                <span className={`timelineDot ${completed || index === 0 && discovered ? "done" : ""}`}>
                  {index + 1}
                </span>
                <div>
                  <strong>{label}</strong>
                  <div className="muted" style={{ marginTop: 3, fontSize: 13 }}>
                    {note}
                  </div>
                </div>
              </div>
            ))}
            {completed ? (
              <button className="secondaryButton" onClick={() => onOpenReceipt(fixtureReceipt)} type="button">
                Open public receipt
              </button>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
