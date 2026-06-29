import { KeyAlgorithm, PrivateKey } from "casper-js-sdk";
import { beforeAll, describe, expect, it } from "vitest";

import { isDestructiveActionError } from "@/server/destructive-action-guard";
import { assertOwnerAccess, readOwnerFromRequest } from "@/server/owner-guard";
import { OWNER_SESSION_COOKIE, createOwnerSession } from "@/server/wallet-session";

beforeAll(() => {
  process.env.CASPER_GW_SESSION_SECRET = "test-session-secret-please-change-0123456789";
  delete process.env.CASPER_GW_ADMIN_TOKEN;
});

function requestWithSession(token?: string): Request {
  const headers = new Headers();
  if (token) headers.set("cookie", `${OWNER_SESSION_COOKIE}=${token}; other=x`);
  return new Request("https://gw.test/api", { headers });
}

describe("owner-guard", () => {
  it("reads the owner identity from a session cookie", () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const session = createOwnerSession(key.publicKey.toHex())!;
    const identity = readOwnerFromRequest(requestWithSession(session.token));
    expect(identity?.publicKey).toBe(key.publicKey.toHex().toLowerCase());
  });

  it("allows legacy owner-null records under the allow fallback", () => {
    expect(assertOwnerAccess(requestWithSession(), { ownerPublicKey: null }, "allow")).toBeNull();
  });

  it("blocks legacy owner-null destructive ops when no admin token is configured", () => {
    try {
      assertOwnerAccess(requestWithSession(), { ownerPublicKey: null }, "admin");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(isDestructiveActionError(error)).toBe(true);
    }
  });

  it("allows the matching wallet session on an owned record", () => {
    const key = PrivateKey.generate(KeyAlgorithm.ED25519);
    const owner = createOwnerSession(key.publicKey.toHex())!;
    const result = assertOwnerAccess(requestWithSession(owner.token), {
      ownerPublicKey: owner.identity.publicKey,
    });
    expect(result?.publicKey).toBe(owner.identity.publicKey);
  });

  it("rejects a different wallet session on an owned record", () => {
    const owner = createOwnerSession(PrivateKey.generate(KeyAlgorithm.ED25519).publicKey.toHex())!;
    const intruder = createOwnerSession(PrivateKey.generate(KeyAlgorithm.ED25519).publicKey.toHex())!;
    expect(() =>
      assertOwnerAccess(requestWithSession(intruder.token), { ownerPublicKey: owner.identity.publicKey }),
    ).toThrow();
  });

  it("rejects an owned record when no session is present", () => {
    const owner = createOwnerSession(PrivateKey.generate(KeyAlgorithm.ED25519).publicKey.toHex())!;
    expect(() =>
      assertOwnerAccess(requestWithSession(), { ownerPublicKey: owner.identity.publicKey }),
    ).toThrow();
  });
});
