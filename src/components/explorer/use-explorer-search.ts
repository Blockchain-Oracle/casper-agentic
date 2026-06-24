"use client";

import { useState } from "react";

import type { ExplorerSearchResult } from "@/lib/types";

export function useExplorerSearch(externalPageSize: number) {
  const [externalPage, setExternalPage] = useState(1);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ExplorerSearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  async function search(page = 1) {
    const trimmed = query.trim();
    if (!trimmed) {
      clear();
      return;
    }
    setSearching(true);
    setResult(null);
    try {
      const params = new URLSearchParams({
        externalPage: String(page),
        externalPageSize: String(externalPageSize),
        q: trimmed,
      });
      const response = await fetch(`/api/explorer/search?${params.toString()}`);
      const body = (await response.json()) as ExplorerSearchResult;
      setExternalPage(page);
      setResult(body);
    } catch {
      setResult({ message: "Explorer search failed before a result was returned.", query: trimmed, source: "not_found" });
    } finally {
      setSearching(false);
    }
  }

  function updateQuery(value: string) {
    setQuery(value);
    setExternalPage(1);
  }

  function clear() {
    setExternalPage(1);
    setResult(null);
  }

  return {
    clear,
    externalPage,
    nextExternalPage: () => search(externalPage + 1),
    previousExternalPage: () => search(Math.max(1, externalPage - 1)),
    query,
    result,
    searchFirstPage: () => search(1),
    searching,
    setQuery: updateQuery,
  };
}
