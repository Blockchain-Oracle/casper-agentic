"use client";

import { useWorkspace } from "./workspace-provider";

/**
 * Wallet-connection gate for /app. When no Casper wallet is connected the
 * workspace renders blurred behind a connect overlay; connecting unlocks it.
 * (Phase 2 will expand the connection-state machine — mismatch/switched/etc.)
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { browserWallet } = useWorkspace();
  const state = browserWallet.browserSigningState;

  if (state.connected) return <>{children}</>;

  return (
    <div style={{ position: "relative", minHeight: "70vh" }}>
      <div aria-hidden style={{ filter: "blur(7px)", opacity: 0.45, pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "30px 28px",
            boxShadow: "var(--shadow)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              margin: "0 auto 16px",
              borderRadius: 10,
              background: "rgb(229 56 59 / 0.14)",
              display: "grid",
              placeItems: "center",
              color: "var(--brand)",
              fontWeight: 700,
            }}
          >
            ⬡
          </div>
          <h2 style={{ font: "800 22px/1.12 var(--sans)", margin: 0 }}>Connect a Casper wallet to enter the app</h2>
          <p style={{ font: "500 14px/1.55 var(--sans)", color: "var(--ink-2)", marginTop: 12 }}>
            Wallet connection unlocks the operator workspace. We never ask for a seed phrase, private key, or provider
            secret — your profile stores public identity only.
          </p>
          <button
            type="button"
            onClick={() => browserWallet.connectBrowserWallet()}
            style={{
              marginTop: 18,
              width: "100%",
              padding: "12px 18px",
              borderRadius: 8,
              background: "var(--brand)",
              color: "#fff",
              font: "600 15px/1 var(--sans)",
            }}
          >
            Connect wallet · CSPR.click
          </button>
          <div style={{ marginTop: 12, font: "500 12px/1.4 var(--mono)", color: "var(--ink-3)" }}>{state.message}</div>
        </div>
      </div>
    </div>
  );
}
