import { AppPageHeader } from "@/components/app/app-chrome";
import { ProviderScreen } from "@/components/screens/provider-screen";

export default function ProviderPage() {
  return (
    <>
      <AppPageHeader
        eyebrow="Provider gateway"
        title="Provider"
        subtitle="Connect a source, discover tools, price & publish, and share the hosted endpoint."
      />
      <ProviderScreen />
    </>
  );
}
