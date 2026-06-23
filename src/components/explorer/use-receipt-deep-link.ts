"use client";

import { useEffect, useState } from "react";

import type { ReceiptDetail } from "@/lib/types";

export function useReceiptDeepLink(receiptId: string | null) {
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);

  useEffect(() => {
    let active = true;
    if (!receiptId) {
      queueMicrotask(() => {
        if (active) setDetail(null);
      });
      return () => {
        active = false;
      };
    }
    fetch(`/api/receipts/${encodeURIComponent(receiptId)}`)
      .then((response) => (response.ok ? response.json() : undefined))
      .then((body: { receipt?: ReceiptDetail } | undefined) => {
        if (active && body?.receipt) setDetail(body.receipt);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [receiptId]);

  return {
    clear: () => setDetail(null),
    detail,
  };
}
