"use client";

import { useCallback, useState } from "react";
import { UserRound } from "lucide-react";

import { DeveloperKeysTab } from "@/components/account/developer-keys-tab";
import { FundTab } from "@/components/account/fund-tab";
import { WalletTab } from "@/components/account/wallet-tab";
import { useCsprClick } from "@/components/csprclick/csprclick-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGatewayBalance, listApiKeys, listTools, type ApiKeyView } from "@/lib/gateway-api";

type GatewayBalance = Awaited<ReturnType<typeof getGatewayBalance>>;
type Tab = "wallet" | "keys" | "fund";

export function AccountDialog() {
  const { publicKey } = useCsprClick();
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
        <Button size="sm" variant="outline" className="gap-1.5 font-medium">
          <UserRound className="size-3.5" /> <span className="max-sm:hidden">Account</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b border-hairline px-5 py-4">
          <DialogTitle className="font-display">Account</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5">
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-4">
            <TabsList className="mt-4 grid h-auto w-full grid-cols-3 bg-well">
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="keys">Developer keys</TabsTrigger>
              <TabsTrigger value="fund">Fund</TabsTrigger>
            </TabsList>
            <TabsContent value="wallet">
              <WalletTab balance={balance} loading={loading} publicKey={publicKey} />
            </TabsContent>
            <TabsContent value="keys">
              <DeveloperKeysTab keys={keys} tools={tools} onFundKey={fundKey} onRefresh={refresh} />
            </TabsContent>
            <TabsContent value="fund">
              <FundTab key={fundKeyId ?? "fund"} balance={balance} initialKeyId={fundKeyId} keys={keys} onRefresh={refresh} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
