import { describe, expect, it } from "vitest";

import {
  EndpointAccessError,
  hashClientAccessToken,
  normalizeEndpointAccessScope,
  toEndpointAccessKeyView,
} from "@/server/endpoint-access";

describe("endpoint access model", () => {
  it("hashes client access tokens without retaining the raw token", () => {
    const hash = hashClientAccessToken("cgw_test_secret");

    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hash).not.toContain("cgw_test_secret");
  });

  it("redacts token hashes from access-key views", () => {
    const view = toEndpointAccessKeyView({
      createdAt: new Date(),
      id: "key-1",
      label: "Cursor",
      ownerAccountHash: null,
      ownerPublicKey: null,
      revoked: false,
      scope: { sourceId: "source-1" },
      sourceId: "source-1",
      tokenHash: hashClientAccessToken("cgw_test_secret"),
      updatedAt: new Date(),
    });

    expect(view).toEqual({
      id: "key-1",
      label: "Cursor",
      revoked: false,
      scope: { sourceId: "source-1" },
      sourceId: "source-1",
    });
    expect(view).not.toHaveProperty("tokenHash");
  });

  it("uses explicit HTTP status for client access failures", () => {
    expect(new EndpointAccessError("client access bearer token required", 401).status).toBe(401);
  });

  it("normalizes limited tool scopes and rejects unpublished tool ids", () => {
    expect(
      normalizeEndpointAccessScope(
        "source-1",
        { sourceId: "source-1", toolIds: ["tool-1", "tool-1"] },
        ["tool-1", "tool-2"],
      ),
    ).toEqual({ sourceId: "source-1", toolIds: ["tool-1"] });

    expect(() =>
      normalizeEndpointAccessScope("source-1", { sourceId: "source-1", toolIds: ["tool-3"] }, ["tool-1"]),
    ).toThrow("access scope toolIds must reference published tools");
  });

  it("rejects malformed endpoint access scopes", () => {
    expect(() => normalizeEndpointAccessScope("source-1", { sourceId: "other-source" })).toThrow(
      "access scope source id must match endpoint source",
    );
    expect(() => normalizeEndpointAccessScope("source-1", { sourceId: "source-1", toolIds: [] })).toThrow(
      "access scope toolIds must be a non-empty string array",
    );
  });
});
