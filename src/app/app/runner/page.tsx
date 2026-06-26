"use client";

import { AppPageHeader } from "@/components/app/app-chrome";
import { useWorkspace } from "@/components/app/workspace-provider";
import { TestConsoleScreen } from "@/components/screens/test-console-screen";

export default function RunnerPage() {
  const { provider, wallet, browserWallet } = useWorkspace();
  return (
    <>
      <AppPageHeader
        eyebrow="Agent operator"
        title="Runner"
        subtitle="Discover endpoint tools, select inputs, check wallet policy, and produce a receipt."
      />
      <TestConsoleScreen
        browserConnection={browserWallet}
        endpointUrl={provider.sourceUrl}
        operatorToken={provider.operatorToken}
        sourceId={provider.providerSource?.id}
        tools={provider.publishedTools}
        wallets={wallet.walletProfiles}
      />
    </>
  );
}
