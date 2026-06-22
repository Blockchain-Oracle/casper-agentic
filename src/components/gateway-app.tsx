"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PricingDrawer } from "@/components/pricing-drawer";
import { Chip } from "@/components/ui";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { EndpointScreen } from "@/components/screens/endpoint-screen";
import { ImportScreen } from "@/components/screens/import-screen";
import { PricingScreen } from "@/components/screens/pricing-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { TestConsoleScreen } from "@/components/screens/test-console-screen";
import { WalletScreen } from "@/components/screens/wallet-screen";
import { endpointUrl, type ConfigTab } from "@/lib/client-config";
import { consoleReceiptId, screens, tools, wallets } from "@/lib/fixtures";
import { receiptById } from "@/lib/receipt-detail";
import type { Receipt, Screen, SourcePhase, SourceType, Tool, UpstreamAuth } from "@/lib/types";

const copiedResetMs = 1400;

export function GatewayApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("openapi");
  const [upstreamAuth, setUpstreamAuth] = useState<UpstreamAuth>("apikey");
  const [sourcePhase, setSourcePhase] = useState<SourcePhase>("form");
  const [toolRows, setToolRows] = useState<Tool[]>(tools);
  const [pricingToolId, setPricingToolId] = useState<string | null>(null);
  const [amount, setAmount] = useState("0.05");
  const [configTab, setConfigTab] = useState<ConfigTab>("cursor");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0].id);
  const [policyAmount, setPolicyAmount] = useState("0.05");
  const [policyTool, setPolicyTool] = useState("get_cspr_quote");
  const [manualApproval, setManualApproval] = useState(false);
  const [allowlist] = useState<string[]>(["get_cspr_quote"]);
  const [copied, setCopied] = useState<string | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const activeScreen = screens.find((item) => item.id === screen) ?? screens[0];
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets[0];
  const pricedTools = toolRows.filter((tool) => tool.enabled && tool.price !== null);
  const publishedTools = toolRows.filter((tool) => tool.published);
  const pricingTool = toolRows.find((tool) => tool.id === pricingToolId) ?? null;
  const consoleReceipt = receiptById(consoleReceiptId);
  const policyAllowed =
    Number(policyAmount) <= 0.08 &&
    allowlist.includes(policyTool) &&
    selectedWallet.funded &&
    !manualApproval;

  function go(next: Screen) {
    setScreen(next);
    setNavOpen(false);
  }

  function queueTimer(callback: () => void, ms: number) {
    const timer = setTimeout(callback, ms);
    timers.current.push(timer);
  }

  async function copy(value: string) {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(value);
    queueTimer(() => setCopied(null), copiedResetMs);
  }

  function runSourceDiscovery(success: boolean) {
    setSourcePhase("loading");
    queueTimer(() => setSourcePhase(success ? "success" : "error"), 700);
  }

  function configurePricing(tool: Tool) {
    setPricingToolId(tool.id);
    setAmount(tool.price?.toFixed(2) ?? "0.05");
  }

  function savePricing() {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !pricingToolId) return;
    setToolRows((current) =>
      current.map((tool) =>
        tool.id === pricingToolId
          ? { ...tool, enabled: true, price: numericAmount, published: true }
          : tool,
      ),
    );
    setPricingToolId(null);
  }

  function openReceipt(receipt: Receipt) {
    window.location.href = `/explorer?receipt=${encodeURIComponent(receipt.id)}`;
  }

  return (
    <main className="app">
      <AppShell
        active={screen}
        navOpen={navOpen}
        onScreen={go}
        onToggleNav={() => setNavOpen((open) => !open)}
      />
      <section className="page">
        <header className="pageHeader">
          <div className="eyebrow">{activeScreen.eyebrow}</div>
          <h1>{activeScreen.title}</h1>
          <p className="subhead">{activeScreen.subtitle}</p>
          <div className="buttonRow" style={{ marginTop: 14 }}>
            <Chip tone="signal">Casper Testnet first</Chip>
            <Chip tone="warn">Fixture data labeled</Chip>
          </div>
        </header>

        {screen === "dashboard" ? (
          <DashboardScreen
            onOpenReceipt={openReceipt}
            onOpenConsole={() => go("console")}
            onScreen={go}
            publishedToolCount={publishedTools.length}
          />
        ) : null}
        {screen === "import" ? (
          <ImportScreen
            onDiscover={runSourceDiscovery}
            onScreen={go}
            onSourceType={setSourceType}
            onUpstreamAuth={setUpstreamAuth}
            sourcePhase={sourcePhase}
            sourceType={sourceType}
            toolRows={toolRows}
            upstreamAuth={upstreamAuth}
          />
        ) : null}
        {screen === "pricing" ? (
          <PricingScreen
            onConfigure={configurePricing}
            onScreen={go}
            pricedCount={pricedTools.length}
            publishedCount={publishedTools.length}
            toolRows={toolRows}
          />
        ) : null}
        {screen === "endpoint" ? (
          <EndpointScreen
            configTab={configTab}
            copied={copied}
            onConfigTab={setConfigTab}
            onCopy={copy}
            publishedTools={publishedTools}
          />
        ) : null}
        {screen === "wallet" ? (
          <WalletScreen
            allowlist={allowlist}
            copied={copied}
            manualApproval={manualApproval}
            onCopy={copy}
            onManualApproval={setManualApproval}
            onOpenReceipt={openReceipt}
            onPolicyAmount={setPolicyAmount}
            onPolicyTool={setPolicyTool}
            onWallet={setSelectedWalletId}
            policyAllowed={policyAllowed}
            policyAmount={policyAmount}
            policyTool={policyTool}
            policyTools={toolRows}
            selectedWallet={selectedWallet}
            selectedWalletId={selectedWalletId}
          />
        ) : null}
        {screen === "console" ? (
          <TestConsoleScreen
            endpointUrl={endpointUrl}
            fixtureReceipt={consoleReceipt}
            onOpenReceipt={openReceipt}
            tools={publishedTools}
            wallets={wallets}
          />
        ) : null}
        {screen === "settings" ? <SettingsScreen /> : null}
      </section>

      {pricingTool ? (
        <PricingDrawer
          amount={amount}
          onAmount={setAmount}
          onClose={() => setPricingToolId(null)}
          onSave={savePricing}
          tool={pricingTool}
        />
      ) : null}
    </main>
  );
}
