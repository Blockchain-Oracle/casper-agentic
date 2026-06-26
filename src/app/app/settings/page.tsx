import { AppPageHeader } from "@/components/app/app-chrome";
import { SettingsScreen } from "@/components/screens/settings-screen";

export default function SettingsPage() {
  return (
    <>
      <AppPageHeader
        eyebrow="System"
        title="Settings"
        subtitle="Trust boundaries, network & facilitator, signing, and client access."
      />
      <SettingsScreen />
    </>
  );
}
