import { AppPageHeader } from "@/components/app/app-chrome";
import { AuditScreen } from "@/components/screens/audit-screen";

export default function AuditPage() {
  return (
    <>
      <AppPageHeader
        eyebrow="System"
        title="Audit"
        subtitle="Source, credential, pricing, publish, policy, payment, and proof events."
      />
      <AuditScreen />
    </>
  );
}
