"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { screenToHref } from "@/components/app/app-chrome";
import { useWorkspace } from "@/components/app/workspace-provider";
import { Segmented } from "@/components/screen-primitives";
import { EndpointScreen } from "@/components/screens/endpoint-screen";
import { ImportScreen } from "@/components/screens/import-screen";
import { PricingScreen } from "@/components/screens/pricing-screen";
import type { Screen } from "@/lib/types";

type ProviderTab = "sources" | "tools" | "endpoint";

// Single Provider surface with Sources / My Tools / Endpoint sub-tabs (the 6-item
// nav collapses the old 3 provider screens). Reuses the existing screens as-is;
// deeper restructuring is deferred to later phases.
export function ProviderScreen() {
  const { provider, wallet, copied, copy, configurePricing, configTab, setConfigTab } = useWorkspace();
  const router = useRouter();
  const [tab, setTab] = useState<ProviderTab>("sources");
  const [accessWalletId, setAccessWalletId] = useState("");

  function navigate(screen: Screen) {
    if (screen === "import") setTab("sources");
    else if (screen === "pricing") setTab("tools");
    else if (screen === "endpoint") setTab("endpoint");
    else router.push(screenToHref(screen));
  }

  return (
    <div className="stack">
      <Segmented
        options={[
          ["sources", "Sources"],
          ["tools", "My Tools"],
          ["endpoint", "Endpoint"],
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "sources" ? (
        <ImportScreen
          errorMessage={provider.errorMessage}
          loading={provider.loading}
          onDiscover={provider.discoverSource}
          onLoadRecords={() => provider.loadProviderState()}
          onOperatorToken={provider.setOperatorToken}
          onScreen={navigate}
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

      {tab === "tools" ? (
        <PricingScreen
          onConfigure={configurePricing}
          onScreen={navigate}
          pricedCount={provider.pricedTools.length}
          publishedCount={provider.publishedTools.length}
          toolRows={provider.toolRows}
        />
      ) : null}

      {tab === "endpoint" ? (
        <EndpointScreen
          accessWalletId={accessWalletId}
          clientToken={provider.endpointClientToken}
          configTab={configTab}
          copied={copied}
          discoveryUrl={provider.endpointDiscoveryUrl}
          endpointToolCount={provider.endpointToolCount}
          endpointUrl={provider.hostedEndpointUrl}
          loading={provider.loading}
          onAccessWalletChange={setAccessWalletId}
          onConfigTab={setConfigTab}
          onCopy={copy}
          onCreateAccess={() => provider.createClientAccess(accessWalletId || undefined)}
          publishedTools={provider.publishedTools}
          wallets={wallet.walletProfiles}
        />
      ) : null}
    </div>
  );
}
