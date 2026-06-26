import { AppPageHeader } from "@/components/app/app-chrome";
import { WalletList } from "@/components/screens/wallet/wallet-list";

export default function WalletsPage() {
  return (
    <>
      <AppPageHeader
        eyebrow="Agent operator"
        title="Wallets"
        subtitle="Select an agent wallet to govern its spend limits, allowlist, and funding."
      />
      <WalletList />
    </>
  );
}
