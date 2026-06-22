import { Suspense } from "react";
import { PublicExplorerApp } from "@/components/public-explorer-app";

export default function ExplorerPage() {
  return (
    <Suspense fallback={<main className="app" />}>
      <PublicExplorerApp />
    </Suspense>
  );
}
