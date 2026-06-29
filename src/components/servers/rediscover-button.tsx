"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Re-run discovery for a source: refresh tool schemas + pick up newly-exposed tools.
export function RediscoverButton({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={busy}
      className="h-7 gap-1.5 text-xs"
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/provider/sources/${sourceId}/rediscover`, { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Re-discover failed");
          toast.success(`Re-indexed — ${data.inserted} new, ${data.updated} refreshed`);
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Re-discover failed");
        }
        setBusy(false);
      }}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Re-index
    </Button>
  );
}
