"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PricingDrawer } from "@/components/pricing-drawer";
import { Chip } from "@/components/ui";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { EndpointScreen } from "@/components/screens/endpoint-screen";
import { ImportScreen } from "@/components/screens/import-screen";
import { PricingScreen } from "@/components/screens/pricing-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { TestConsoleScreen } from "@/components/screens/test-console-screen";
import { defaultProviderPriceAmount, useProviderGateway } from "@/components/screens/use-provider-gateway";
import { WalletScreen } from "@/components/screens/wallet-screen";
import { endpointUrl, type ConfigTab } from "@/lib/client-config";
import { consoleReceiptId, screens, wallets } from "@/lib/fixtures";
import { receiptById } from "@/lib/receipt-detail";
import type { Receipt, Screen, Tool } from "@/lib/types";

export function GatewayApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [pricingToolId, setPricingToolId] = useState<string | null>(null);
  const [amount, setAmount] = useState(defaultProviderPriceAmount);
  const [configTab, setConfigTab] = useState<ConfigTab>("cursor");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0].id);
  const [policyAmount, setPolicyAmount] = useState("0.05");
  const [policyTool, setPolicyTool] = useState("get_cspr_quote");
  const [manualApproval, setManualApproval] = useState(false);
  const [allowlist] = useState<string[]>(["get_cspr_quote"]);
  const [copied, setCopied] = useState<string | null>(null);
  const provider = useProviderGateway();

  const activeScreen = screens.find((item) => item.id === screen) ?? screens[0];
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets[0];
  const pricingTool = provider.toolRows.find((tool) => tool.id === pricingToolId) ?? null;
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

  async function copy(value: string) {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1400);
  }

  function configurePricing(tool: Tool) {
    setPricingToolId(tool.id);
    setAmount(tool.priceAmount ?? defaultProviderPriceAmount);
  }

  async function savePricing() {
    if (!pricingTool) return;
    await provider.priceAndPublishTool(pricingTool, amount);
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
            publishedToolCount={provider.publishedTools.length}
          />
        ) : null}
        {screen === "import" ? (
          <ImportScreen
            errorMessage={provider.errorMessage}
            loading={provider.loading}
            onDiscover={provider.discoverSource}
            onLoadRecords={() => provider.loadProviderState()}
            onOperatorToken={provider.setOperatorToken}
            onScreen={go}
            onSourceName={provider.setSourceName}
            onSourceType={provider.setSourceType}
            onSourceUrl={provider.setSourceUrl}
            onUpstreamAuth={provider.setUpstreamAuth}
            operatorToken={provider.operatorToken}
            sourceName={provider.sourceName}
            sourcePhase={provider.sourcePhase}
            sourceType={provider.sourceType}
            sourceUrl={provider.sourceUrl}
            statusMessage={provider.statusMessage}
            toolRows={provider.toolRows}
            upstreamAuth={provider.upstreamAuth}
          />
        ) : null}
        {screen === "pricing" ? (
          <PricingScreen
            onConfigure={configurePricing}
            onScreen={go}
            pricedCount={provider.pricedTools.length}
            publishedCount={provider.publishedTools.length}
            toolRows={provider.toolRows}
          />
        ) : null}
        {screen === "endpoint" ? (
          <EndpointScreen
            clientToken={provider.endpointClientToken}
            configTab={configTab}
            copied={copied}
            endpointToolCount={provider.endpointToolCount}
            endpointUrl={provider.hostedEndpointUrl}
            loading={provider.loading}
            onConfigTab={setConfigTab}
            onCopy={copy}
            onCreateAccess={provider.createClientAccess}
            publishedTools={provider.publishedTools}
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
            policyTools={provider.toolRows}
            selectedWallet={selectedWallet}
            selectedWalletId={selectedWalletId}
          />
        ) : null}
        {screen === "console" ? (
          <TestConsoleScreen
            endpointUrl={endpointUrl}
            fixtureReceipt={consoleReceipt}
            onOpenReceipt={openReceipt}
            tools={provider.publishedTools}
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
