"use client";

import { useRouter } from "next/navigation";

import { AppPageHeader, screenToHref } from "@/components/app/app-chrome";
import { useWorkspace } from "@/components/app/workspace-provider";
import { DashboardScreen } from "@/components/screens/dashboard-screen";

/** /app IS the dashboard — no redirect. (Other surfaces live at /app/provider, /app/wallets, …) */
export default function AppPage() {
  const { provider, openReceipt } = useWorkspace();
  const router = useRouter();
  return (
    <>
      <AppPageHeader
        eyebrow="Control plane"
        title="Overview"
        subtitle="Whole-gateway state across provider, wallet, paid console, and proof surfaces."
      />
      <DashboardScreen
        onOpenReceipt={openReceipt}
        onOpenConsole={() => router.push("/app/runner")}
        onScreen={(screen) => router.push(screenToHref(screen))}
        publishedToolCount={provider.publishedTools.length}
      />
    </>
  );
}
