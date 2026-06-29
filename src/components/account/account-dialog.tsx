"use client";

import { useCallback, useState } from "react";
import { UserRound } from "lucide-react";

import { DeveloperKeysTab } from "@/components/account/developer-keys-tab";
import { FundTab } from "@/components/account/fund-tab";
import { WalletTab } from "@/components/account/wallet-tab";
import { useCsprClick } from "@/components/csprclick/csprclick-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGatewayBalance, listApiKeys, listTools, type ApiKeyView } from "@/lib/gateway-api";

type GatewayBalance = Awaited<ReturnType<typeof getGatewayBalance>>;
type Tab = "wallet" | "keys" | "fund";

export function AccountDialog() {
  const { connect, publicKey, ready, sendCsprDeposit } = useCsprClick();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("wallet");
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [balance, setBalance] = useState<GatewayBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [fundKeyId, setFundKeyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [keyRes, toolRes, gatewayRes] = await Promise.all([
        listApiKeys().catch(() => ({ keys: [] })),
        listTools().catch(() => ({ tools: [] })),
        getGatewayBalance().catch(() => null),
      ]);
      setKeys(keyRes.keys);
      setTools([...new Set(toolRes.tools.filter((tool) => tool.status === "published").map((tool) => tool.name))]);
      setBalance(gatewayRes);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) void refresh();
  }

  function fundKey(keyId: string) {
    setFundKeyId(keyId);
    setTab("fund");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 font-medium" aria-label="Account">
          <UserRound className="size-3.5" /> <span className="max-sm:hidden">Account</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-hairline px-4 py-4 sm:px-5">
          <DialogTitle className="font-display">Account</DialogTitle>
          <DialogDescription className="text-xs text-ink-3">
            {tab === "wallet"
              ? "Your wallet, owner sign-in, and the gateway's payment account."
              : tab === "keys"
                ? "Mint and manage casper_ API keys for paying per call."
                : "Fund a key with WCSPR so agents can pay through it."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(92dvh-73px)] overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-0">
            <TabsList className="mt-4 grid h-auto w-full grid-cols-3 bg-well">
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="keys"><span className="sm:hidden">Keys</span><span className="max-sm:hidden">Developer keys</span></TabsTrigger>
              <TabsTrigger value="fund">Fund</TabsTrigger>
            </TabsList>
            <TabsContent value="wallet" className="mt-4">
              <WalletTab balance={balance} loading={loading} publicKey={publicKey} />
            </TabsContent>
            <TabsContent value="keys" className="mt-4">
              <DeveloperKeysTab keys={keys} tools={tools} onFundKey={fundKey} onRefresh={refresh} />
            </TabsContent>
            <TabsContent value="fund" className="mt-4">
              <FundTab
                key={fundKeyId ?? "fund"}
                balance={balance}
                initialKeyId={fundKeyId}
                keys={keys}
                onConnectWallet={connect}
                onRefresh={refresh}
                onSendCsprDeposit={sendCsprDeposit}
                publicKey={publicKey}
                walletReady={ready}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
