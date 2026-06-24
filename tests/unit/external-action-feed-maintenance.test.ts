import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasDatabaseUrl: vi.fn(),
  pruneSharedExternalActionFeedState: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  hasDatabaseUrl: mocks.hasDatabaseUrl,
}));

vi.mock("@/server/external-action-feed-state", () => ({
  pruneSharedExternalActionFeedState: mocks.pruneSharedExternalActionFeedState,
}));

import { formatFeedStatePruneResult, runFeedStatePrune } from "@/server/external-action-feed-maintenance";

describe("external action feed maintenance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasDatabaseUrl.mockReturnValue(true);
    mocks.pruneSharedExternalActionFeedState.mockResolvedValue({
      cacheEntriesDeleted: 2,
      databaseConfigured: true,
      prunedAt: new Date("2026-06-24T12:00:00.000Z"),
      rateBucketsDeleted: 3,
    });
  });

  it("fails loudly when DATABASE_URL is missing", async () => {
    mocks.hasDatabaseUrl.mockReturnValue(false);

    await expect(runFeedStatePrune()).rejects.toThrow("DATABASE_URL is required");
    expect(mocks.pruneSharedExternalActionFeedState).not.toHaveBeenCalled();
  });

  it("allows explicit no-op runs without database configuration", async () => {
    mocks.hasDatabaseUrl.mockReturnValue(false);
    mocks.pruneSharedExternalActionFeedState.mockResolvedValue({
      cacheEntriesDeleted: 0,
      databaseConfigured: false,
      prunedAt: new Date("2026-06-24T12:00:00.000Z"),
      rateBucketsDeleted: 0,
    });

    await expect(runFeedStatePrune({ allowMissingDatabase: true })).resolves.toEqual({
      cacheEntriesDeleted: 0,
      databaseConfigured: false,
      prunedAt: "2026-06-24T12:00:00.000Z",
      rateBucketsDeleted: 0,
    });
  });

  it("prints aggregate counts without secrets, raw identities, or feed payloads", async () => {
    const result = await runFeedStatePrune();
    const output = JSON.stringify(result);

    expect(result).toEqual({
      cacheEntriesDeleted: 2,
      databaseConfigured: true,
      prunedAt: "2026-06-24T12:00:00.000Z",
      rateBucketsDeleted: 3,
    });
    expect(output).not.toContain("postgres://");
    expect(output).not.toContain("203.0.113.10");
    expect(output).not.toContain("deploy_hash");
    expect(output).not.toContain("CSPR_CLOUD_API_KEY");
  });

  it("formats prune results as stable JSON-safe output", () => {
    expect(formatFeedStatePruneResult({
      cacheEntriesDeleted: 1,
      databaseConfigured: true,
      prunedAt: new Date("2026-06-24T12:00:00.000Z"),
      rateBucketsDeleted: 0,
    })).toEqual({
      cacheEntriesDeleted: 1,
      databaseConfigured: true,
      prunedAt: "2026-06-24T12:00:00.000Z",
      rateBucketsDeleted: 0,
    });
  });
});
