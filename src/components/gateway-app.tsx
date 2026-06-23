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
import { useWalletControl } from "@/components/screens/use-wallet-control";
import { WalletScreen } from "@/components/screens/wallet-screen";
import { endpointUrl, type ConfigTab } from "@/lib/client-config";
import { consoleReceiptId, screens } from "@/lib/fixtures";
import { receiptById } from "@/lib/receipt-detail";
import type { Receipt, Screen, Tool } from "@/lib/types";

export function GatewayApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [pricingToolId, setPricingToolId] = useState<string | null>(null);
  const [amount, setAmount] = useState(defaultProviderPriceAmount);
  const [configTab, setConfigTab] = useState<ConfigTab>("cursor");
  const [copied, setCopied] = useState<string | null>(null);
  const provider = useProviderGateway();
  const wallet = useWalletControl(provider.operatorToken);

  const activeScreen = screens.find((item) => item.id === screen) ?? screens[0];
  const pricingTool = provider.toolRows.find((tool) => tool.id === pricingToolId) ?? null;
  const consoleReceipt = receiptById(consoleReceiptId);

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
            copied={copied}
            dailyLimit={wallet.dailyLimit}
            errorMessage={wallet.errorMessage}
            loading={wallet.loading}
            onCopy={copy}
            onCreateWallet={wallet.createWallet}
            onDailyLimit={wallet.setDailyLimit}
            onLoadWallets={() => wallet.loadWallets()}
            onOpenReceipt={openReceipt}
            onPolicyAmount={wallet.setPolicyAmount}
            onPolicyDisabled={wallet.setPolicyDisabled}
            onPolicyTool={wallet.setPolicyTool}
            onRefreshReadiness={() => wallet.refreshReadiness()}
            onSavePolicy={wallet.savePolicy}
            onSelectWallet={wallet.selectWallet}
            onSessionLimit={wallet.setSessionLimit}
            onWalletAccountHash={wallet.setWalletAccountHash}
            onWalletLabel={wallet.setWalletLabel}
            onWalletSigningMode={wallet.setWalletSigningMode}
            operatorConnected={Boolean(provider.operatorToken)}
            policy={wallet.policy}
            policyAmount={wallet.policyAmount}
            policyDisabled={wallet.policyDisabled}
            policyTool={wallet.policyTool}
            policyTools={provider.publishedTools}
            readiness={wallet.readiness}
            selectedWallet={wallet.selectedWallet}
            selectedWalletId={wallet.selectedWalletId}
            sessionLimit={wallet.sessionLimit}
            statusMessage={wallet.statusMessage}
            walletAccountHash={wallet.walletAccountHash}
            walletLabel={wallet.walletLabel}
            wallets={wallet.wallets}
            walletSigningMode={wallet.walletSigningMode}
          />
        ) : null}
        {screen === "console" ? (
          <TestConsoleScreen
            endpointUrl={endpointUrl}
            fixtureReceipt={consoleReceipt}
            onOpenReceipt={openReceipt}
            tools={provider.publishedTools}
            wallets={wallet.walletProfiles}
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
