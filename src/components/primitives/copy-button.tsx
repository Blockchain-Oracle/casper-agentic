"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

// One-click copy with toast. stopPropagation so it works inside a clickable row.
export function CopyButton({ value, label = "Copied", className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setDone(true);
        toast.success(label);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`shrink-0 text-ink-3 transition-colors hover:text-ink ${className ?? ""}`}
    >
      {done ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  );
}
