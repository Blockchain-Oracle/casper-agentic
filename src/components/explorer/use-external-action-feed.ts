"use client";

import { useState } from "react";

import type { ExternalActionFeedResult } from "@/lib/types";

export function useExternalActionFeed(pageSize: number) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ExternalActionFeedResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(nextPage = 1) {
    setLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({ page: String(nextPage), pageSize: String(pageSize) });
      const response = await fetch(`/api/explorer/actions?${params.toString()}`);
      const body = (await response.json()) as ExternalActionFeedResult;
      setPage(body.pagination?.page ?? nextPage);
      setResult(body);
    } catch {
      setResult({
        matches: [],
        message: "External WCSPR feed failed before a result was returned.",
        network: "casper:casper-test",
        pagination: { hasNextPage: false, hasPreviousPage: false, page: nextPage, pageSize, totalCount: 0, totalPages: 1 },
        source: "upstream_error",
      });
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setPage(1);
    setResult(null);
  }

  return {
    clear,
    loadFirstPage: () => load(1),
    loading,
    nextPage: () => load(page + 1),
    page,
    previousPage: () => load(Math.max(1, page - 1)),
    result,
  };
}
