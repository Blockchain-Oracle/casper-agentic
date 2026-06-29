"use client";

import { useState } from "react";

import { FundTab } from "@/components/account/fund-tab";
import { useCsprClick } from "@/components/csprclick/csprclick-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getGatewayBalance, listApiKeys, type ApiKeyView } from "@/lib/gateway-api";

type GatewayBalance = Awaited<ReturnType<typeof getGatewayBalance>>;

// Deposit-CSPR popup, opened inline from the tool runner so a user can fund the
// selected key the moment they hit "not enough" — no trip to the Account modal.
export function FundKeyDialog({
  balance,
  initialKeyId,
  keys,
  onFunded,
  trigger,
}: {
  balance: GatewayBalance | null;
  initialKeyId?: string | null;
  keys: ApiKeyView[];
  onFunded: () => void;
  trigger: React.ReactNode;
}) {
  const { connect, publicKey, ready, sendCsprDeposit } = useCsprClick();
  const [localKeys, setLocalKeys] = useState(keys);

  async function refresh() {
    const res = await listApiKeys().catch(() => ({ keys: localKeys }));
    setLocalKeys(res.keys);
    onFunded();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Fund key</DialogTitle>
          <DialogDescription className="text-xs text-ink-3">
            Deposit CSPR to fund this key — no need to leave this page.
          </DialogDescription>
        </DialogHeader>
        <FundTab
          balance={balance}
          initialKeyId={initialKeyId}
          keys={localKeys}
          onConnectWallet={connect}
          onRefresh={refresh}
          onSendCsprDeposit={sendCsprDeposit}
          publicKey={publicKey}
          walletReady={ready}
        />
      </DialogContent>
    </Dialog>
  );
}
