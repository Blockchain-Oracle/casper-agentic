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

import {
  FeedStatePruneMaintenanceError,
  formatFeedStatePruneError,
  formatFeedStatePruneResult,
  runFeedStatePrune,
} from "@/server/external-action-feed-maintenance";

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
    await expect(runFeedStatePrune()).rejects.toMatchObject({
      code: "database_url_required",
      name: "FeedStatePruneMaintenanceError",
    });
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

  it("formats maintenance errors without raw database details", () => {
    expect(formatFeedStatePruneError(new FeedStatePruneMaintenanceError(
      "database_url_required",
      "DATABASE_URL is required to prune shared public feed state.",
    ))).toEqual({
      error: "database_url_required",
      message: "DATABASE_URL is required to prune shared public feed state.",
    });

    const output = JSON.stringify(formatFeedStatePruneError(new Error(
      "delete from external_action_feed_cache_entries failed for postgres://user:secret@localhost/db and 203.0.113.10",
    )));

    expect(output).toContain("feed_state_prune_failed");
    expect(output).toContain("Failed to prune shared public feed state.");
    expect(output).not.toContain("delete from");
    expect(output).not.toContain("postgres://");
    expect(output).not.toContain("secret");
    expect(output).not.toContain("203.0.113.10");
  });
});
