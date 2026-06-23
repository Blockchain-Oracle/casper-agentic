import { describe, expect, it } from "vitest";

import {
  EndpointAccessError,
  hashClientAccessToken,
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
});
