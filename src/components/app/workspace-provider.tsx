"use client";

import { createContext, useContext, useState } from "react";

import { useCSPRClickBrowserConnection } from "@/components/screens/use-csprclick-browser-connection";
import { defaultProviderPriceAmount, useProviderGateway } from "@/components/screens/use-provider-gateway";
import { useWalletControl } from "@/components/screens/use-wallet-control";
import type { ConfigTab } from "@/lib/client-config";
import type { Receipt, Tool } from "@/lib/types";

type ProviderGateway = ReturnType<typeof useProviderGateway>;
type WalletControl = ReturnType<typeof useWalletControl>;
type BrowserConnection = ReturnType<typeof useCSPRClickBrowserConnection>;

export interface WorkspaceValue {
  provider: ProviderGateway;
  wallet: WalletControl;
  browserWallet: BrowserConnection;
  copied: string | null;
  copy: (value: string) => Promise<void>;
  openReceipt: (receipt: Receipt) => void;
  amount: string;
  setAmount: (value: string) => void;
  pricingTool: Tool | null;
  pricingToolId: string | null;
  configurePricing: (tool: Tool) => void;
  savePricing: () => Promise<void>;
  closePricing: () => void;
  configTab: ConfigTab;
  setConfigTab: (tab: ConfigTab) => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

/**
 * Holds the three domain hooks (provider/wallet/browser connection) and the
 * cross-screen UI state that used to live in gateway-app.tsx, so nested /app/*
 * route pages can share them via context. The hooks are unchanged — only their
 * call site moved here.
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const provider = useProviderGateway();
  const browserWallet = useCSPRClickBrowserConnection();
  const wallet = useWalletControl(provider.operatorToken);

  const [copied, setCopied] = useState<string | null>(null);
  const [pricingToolId, setPricingToolId] = useState<string | null>(null);
  const [amount, setAmount] = useState(defaultProviderPriceAmount);
  const [configTab, setConfigTab] = useState<ConfigTab>("cursor");

  const pricingTool = provider.toolRows.find((tool) => tool.id === pricingToolId) ?? null;

  async function copy(value: string) {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1400);
  }

  function openReceipt(receipt: Receipt) {
    window.location.href = `/explorer?receipt=${encodeURIComponent(receipt.id)}`;
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

  const value: WorkspaceValue = {
    provider,
    wallet,
    browserWallet,
    copied,
    copy,
    openReceipt,
    amount,
    setAmount,
    pricingTool,
    pricingToolId,
    configurePricing,
    savePricing,
    closePricing: () => setPricingToolId(null),
    configTab,
    setConfigTab,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return value;
}
