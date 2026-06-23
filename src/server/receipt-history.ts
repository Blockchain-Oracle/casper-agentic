import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/db/client";
import { paidCallAttempts } from "@/db/schema";
import { receipts as fixtureReceipts } from "@/lib/fixtures";
import { buildReceiptDetail } from "@/lib/receipt-detail";
import {
  receiptStatuses,
  type Receipt,
  type ReceiptHistoryFilters,
  type ReceiptHistoryResult,
  type ReceiptStatus,
} from "@/lib/types";

import { detailsForAttemptRows } from "./receipt-store";

export interface ReceiptHistoryInput extends Omit<ReceiptHistoryFilters, "status"> {
  page?: number | string | null;
  pageSize?: number | string | null;
  status?: ReceiptStatus | string | null;
}

export interface NormalizedReceiptHistoryInput {
  filters: ReceiptHistoryFilters;
  fromDate?: Date;
  offset: number;
  page: number;
  pageSize: number;
  toDate?: Date;
}

const DEFAULT_RECEIPT_PAGE_SIZE = 10;
const MAX_RECEIPT_PAGE = 1000;
const MAX_RECEIPT_PAGE_SIZE = 25;

export async function listReceiptHistory(input: ReceiptHistoryInput = {}): Promise<ReceiptHistoryResult> {
  const normalized = normalizeReceiptHistoryInput(input);
  if (!hasDatabaseUrl()) return listFixtureReceiptHistory(normalized);

  const where = buildReceiptHistoryWhere(normalized);
  const db = getDb();
  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(paidCallAttempts)
      .where(where)
      .orderBy(desc(paidCallAttempts.createdAt))
      .limit(normalized.pageSize)
      .offset(normalized.offset),
    db
      .select({ count: sql<number>`cast(count(${paidCallAttempts.id}) as integer)` })
      .from(paidCallAttempts)
      .where(where),
  ]);
  const totalCount = Number(countRows[0]?.count ?? 0);
  return {
    filters: normalized.filters,
    network: normalized.filters.network ?? "casper:casper-test",
    pagination: toPagination(normalized.page, normalized.pageSize, totalCount),
    receipts: await detailsForAttemptRows(rows),
    source: "postgres",
  };
}

export function normalizeReceiptHistoryInput(input: ReceiptHistoryInput = {}): NormalizedReceiptHistoryInput {
  const page = boundedInt(input.page, 1, 1, MAX_RECEIPT_PAGE);
  const pageSize = boundedInt(input.pageSize, DEFAULT_RECEIPT_PAGE_SIZE, 1, MAX_RECEIPT_PAGE_SIZE);
  const from = clean(input.from);
  const to = clean(input.to);
  const fromDate = from ? dateBoundary(from, "start") : undefined;
  const toDate = to ? dateBoundary(to, "end") : undefined;
  const status = isReceiptStatus(input.status) ? input.status : undefined;
  const filters: ReceiptHistoryFilters = {
    ...(fromDate ? { from } : {}),
    ...(clean(input.network) ? { network: clean(input.network) } : {}),
    ...(clean(input.provider) ? { provider: clean(input.provider) } : {}),
    ...(clean(input.q) ? { q: clean(input.q) } : {}),
    ...(status ? { status } : {}),
    ...(toDate ? { to } : {}),
    ...(clean(input.tool) ? { tool: clean(input.tool) } : {}),
    ...(clean(input.wallet) ? { wallet: normalizeAccountFilter(clean(input.wallet) ?? "") } : {}),
  };
  return { filters, fromDate, offset: (page - 1) * pageSize, page, pageSize, toDate };
}

function listFixtureReceiptHistory(normalized: NormalizedReceiptHistoryInput): ReceiptHistoryResult {
  const filtered = fixtureReceipts
    .map((receipt) => buildReceiptDetail(receipt))
    .filter((detail) => matchesFixtureReceipt(detail.receipt, normalized));
  return {
    filters: normalized.filters,
    network: normalized.filters.network ?? "casper:casper-test",
    pagination: toPagination(normalized.page, normalized.pageSize, filtered.length),
    receipts: filtered.slice(normalized.offset, normalized.offset + normalized.pageSize),
    source: "fixture",
  };
}

function buildReceiptHistoryWhere(input: NormalizedReceiptHistoryInput): SQL | undefined {
  const conditions: SQL[] = [];
  const { filters } = input;
  if (filters.status) conditions.push(eq(paidCallAttempts.status, filters.status));
  if (filters.provider) conditions.push(ilike(paidCallAttempts.providerName, `%${filters.provider}%`));
  if (filters.tool) conditions.push(ilike(paidCallAttempts.toolName, `%${filters.tool}%`));
  if (filters.wallet) conditions.push(ilike(paidCallAttempts.walletAccountHash, `%${filters.wallet}%`));
  if (filters.network) conditions.push(eq(paidCallAttempts.network, filters.network));
  if (input.fromDate) conditions.push(gte(paidCallAttempts.createdAt, input.fromDate));
  if (input.toDate) conditions.push(lte(paidCallAttempts.createdAt, input.toDate));
  if (filters.q) conditions.push(textSearchCondition(filters.q));
  return conditions.length ? and(...conditions) : undefined;
}

function textSearchCondition(query: string): SQL {
  const pattern = `%${query}%`;
  return or(
    sql`${paidCallAttempts.id}::text ilike ${pattern}`,
    ilike(paidCallAttempts.providerName, pattern),
    ilike(paidCallAttempts.toolName, pattern),
    ilike(paidCallAttempts.walletAccountHash, pattern),
    ilike(paidCallAttempts.status, pattern),
    ilike(paidCallAttempts.network, pattern),
    ilike(paidCallAttempts.asset, pattern),
    ilike(paidCallAttempts.client, pattern),
  ) as SQL;
}

function matchesFixtureReceipt(receipt: Receipt, input: NormalizedReceiptHistoryInput) {
  const { filters } = input;
  if (filters.status && receipt.status !== filters.status) return false;
  if (filters.provider && !contains(receipt.provider, filters.provider)) return false;
  if (filters.tool && !contains(receipt.tool, filters.tool)) return false;
  if (filters.wallet && !contains(receipt.wallet, filters.wallet)) return false;
  if (input.fromDate && new Date(receipt.time) < input.fromDate) return false;
  if (input.toDate && new Date(receipt.time) > input.toDate) return false;
  if (filters.network && filters.network !== "casper:casper-test") return false;
  if (!filters.q) return true;
  return [receipt.id, receipt.hash, receipt.provider, receipt.tool, receipt.wallet, receipt.status, receipt.asset, receipt.client]
    .filter(Boolean)
    .some((value) => contains(String(value), filters.q ?? ""));
}

function toPagination(page: number, pageSize: number, totalCount: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize,
    totalCount,
    totalPages,
  };
}

function boundedInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function contains(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function dateBoundary(value: string, boundary: "start" | "end") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(
      boundary === "start" ? 0 : 23,
      boundary === "start" ? 0 : 59,
      boundary === "start" ? 0 : 59,
      boundary === "start" ? 0 : 999,
    );
  }
  return date;
}

function isReceiptStatus(value: unknown): value is ReceiptStatus {
  return typeof value === "string" && receiptStatuses.includes(value as ReceiptStatus);
}

function normalizeAccountFilter(value: string) {
  const match = value.match(/^account-hash-([0-9a-f]{64})$/i);
  return match ? match[1].toLowerCase() : value.toLowerCase();
}
