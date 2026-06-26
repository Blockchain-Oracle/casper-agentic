import { AppPageHeader } from "@/components/app/app-chrome";
import { WalletDetail } from "@/components/screens/wallet/wallet-detail";

export default async function WalletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <AppPageHeader
        eyebrow="Agent operator"
        title="Wallet detail"
        subtitle="Identity, readiness, and spend policy for this agent wallet."
      />
      <WalletDetail walletId={id} />
    </>
  );
}
