"use client";

import { useEffect, useMemo, useState } from "react";

import { receipts } from "@/lib/fixtures";
import { buildReceiptDetail } from "@/lib/receipt-detail";
import type { ReceiptDetail, ReceiptFeedSource, ReceiptHistoryFilters, ReceiptHistoryPagination, ReceiptStatus } from "@/lib/types";

interface UseReceiptHistoryInput {
  from?: string;
  page: number;
  pageSize: number;
  q?: string;
  status?: ReceiptStatus;
  to?: string;
}

interface ReceiptHistoryResponse {
  filters: ReceiptHistoryFilters;
  pagination: ReceiptHistoryPagination;
  receipts: ReceiptDetail[];
  source: ReceiptFeedSource;
}

const initialReceipts = receipts.map((receipt) => buildReceiptDetail(receipt));
const initialPagination: ReceiptHistoryPagination = {
  hasNextPage: false,
  hasPreviousPage: false,
  page: 1,
  pageSize: initialReceipts.length,
  totalCount: initialReceipts.length,
  totalPages: 1,
};

export function useReceiptHistory(input: UseReceiptHistoryInput) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ReceiptHistoryResponse>({
    filters: {},
    pagination: initialPagination,
    receipts: initialReceipts,
    source: "fixture",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(input.page));
    params.set("pageSize", String(input.pageSize));
    if (input.status) params.set("status", input.status);
    if (input.q?.trim()) params.set("q", input.q.trim());
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);
    return params.toString();
  }, [input.from, input.page, input.pageSize, input.q, input.status, input.to]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    fetch(`/api/receipts?${queryString}`)
      .then((response) => (response.ok ? response.json() : undefined))
      .then((body: ReceiptHistoryResponse | undefined) => {
        if (!active || !Array.isArray(body?.receipts) || !body.pagination) return;
        setHistory(body);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [queryString]);

  return { ...history, loading };
}
